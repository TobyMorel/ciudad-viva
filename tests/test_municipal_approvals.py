import json
import tempfile
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from unittest.mock import patch

import server


class FakeEngine:
    def __init__(self, view):
        self.view=view
        self.actions=[]
    def action(self, payload):
        self.actions.append(dict(payload))
        return self.view
    def snapshot(self):
        return dict(self.view)
    def load(self, snapshot):
        self.loaded=snapshot
        return self.view


class MunicipalApprovalTests(unittest.TestCase):
    def setUp(self):
        self.old={"state":server.state,"room":server.ROOM_OPEN,"revision":server.STATE_REVISION,"engine":server.SHARED_ENGINE,"shared":server.SHARED_GAME_VIEW,"cache_revision":server._PUBLIC_STATE_CACHE_REVISION,"cache_view":server._PUBLIC_STATE_CACHE_VIEW,"slot":server.ACTIVE_SLOT_ID,"save_root":server.SAVE_ROOT}
        now=time.time()
        self.view={"day":1,"money":175000,"government":{"status":"en_mandato","mandate":1},"buildings":[],"events":[]}
        server.state={**self.view,"players":{"host":now,"guest":now,"third":now},"playerNames":{"host":"Ana","guest":"Beto","third":"Luz"},"host":"host","chatMessages":[],"actionFeed":[],"roomName":"Ciudad"}
        server.ROOM_OPEN=True;server.STATE_REVISION=0;server.SHARED_ENGINE=FakeEngine(self.view);server.SHARED_GAME_VIEW=self.view
        server._PUBLIC_STATE_CACHE_REVISION=-1;server._PUBLIC_STATE_CACHE_VIEW=None
        self.temp=tempfile.TemporaryDirectory();server.SAVE_ROOT=Path(self.temp.name);(server.SAVE_ROOT/"partidas").mkdir()
        self.http=ThreadingHTTPServer(("127.0.0.1",0),server.Handler);self.http.daemon_threads=True
        self.base=f"http://127.0.0.1:{self.http.server_port}";self.thread=threading.Thread(target=self.http.serve_forever,daemon=True);self.thread.start()
    def tearDown(self):
        self.http.shutdown();self.http.server_close();self.thread.join(timeout=2)
        server.state=self.old["state"];server.ROOM_OPEN=self.old["room"];server.STATE_REVISION=self.old["revision"];server.SHARED_ENGINE=self.old["engine"];server.SHARED_GAME_VIEW=self.old["shared"]
        server._PUBLIC_STATE_CACHE_REVISION=self.old["cache_revision"];server._PUBLIC_STATE_CACHE_VIEW=self.old["cache_view"]
        server.ACTIVE_SLOT_ID=self.old["slot"];server.SAVE_ROOT=self.old["save_root"];self.temp.cleanup()
    def request(self,player,payload,path="/api/action"):
        request=Request(self.base+path,data=json.dumps(payload).encode(),headers={"Content-Type":"application/json","X-Player-Id":player})
        try:
            with urlopen(request,timeout=5) as response:return response.status,json.loads(response.read())
        except HTTPError as error:return error.code,json.loads(error.read())
    def test_threshold_majority_executes_city_cost_once_and_skips_private_buildings(self):
        status,view=self.request("host",{"action":"setMunicipalApprovalThreshold","threshold":5000})
        self.assertEqual(status,200);self.assertEqual(view["municipalTeam"]["cooperation"]["approvalThreshold"],5000)
        construction={"action":"place","kind":"civic","serviceModel":"generalHospital","x":5,"y":9}
        status,view=self.request("host",construction)
        self.assertEqual(status,200);decision=view["municipalTeam"]["cooperation"]["decisions"][0]
        self.assertEqual(decision["status"],"pending");self.assertEqual(decision["cost"],25500);self.assertEqual(server.SHARED_ENGINE.actions,[])
        status,view=self.request("guest",{"action":"voteMunicipalDecision","decisionId":decision["id"],"vote":"yes"})
        self.assertEqual(status,200);self.assertEqual(view["municipalTeam"]["cooperation"]["decisions"][0]["status"],"approved")
        status,view=self.request("third",{"action":"executeMunicipalDecision","decisionId":decision["id"]})
        self.assertEqual(status,200);self.assertEqual(server.SHARED_ENGINE.actions,[construction]);self.assertEqual(view["municipalTeam"]["cooperation"]["decisions"][0]["status"],"executed")
        status,_=self.request("guest",{"action":"executeMunicipalDecision","decisionId":decision["id"]})
        self.assertEqual(status,409);self.assertEqual(len(server.SHARED_ENGINE.actions),1)
        status,_=self.request("host",{"action":"place","kind":"home","x":6,"y":10})
        self.assertEqual(status,200);self.assertEqual(server.SHARED_ENGINE.actions[-1]["kind"],"home")
    def test_private_projects_are_not_city_spending_and_host_controls_threshold(self):
        self.assertEqual(server.municipal_action_cost({"action":"place","kind":"home","x":1,"y":1}),0)
        self.assertEqual(server.municipal_action_cost({"action":"place","kind":"office","x":1,"y":1}),0)
        self.assertEqual(server.municipal_action_cost({"action":"placeRoad","x":5,"y":10,"roadType":"avenue"}),3200)
        status,body=self.request("guest",{"action":"setMunicipalApprovalThreshold","threshold":10000})
        self.assertEqual(status,403);self.assertIn("anfitrión",body["error"])
    def test_pause_and_speed_votes_apply_only_after_current_connected_majority(self):
        status,view=self.request("host",{"action":"proposeSimulationControl","control":"pause","value":True})
        self.assertEqual(status,200)
        vote=view["municipalTeam"]["cooperation"]["controlVote"]
        self.assertEqual(vote["status"],"pending");self.assertEqual(vote["yesVotes"],1);self.assertEqual(vote["requiredVotes"],2)
        self.assertEqual(server.SHARED_ENGINE.actions,[])
        status,view=self.request("guest",{"action":"voteSimulationControl","voteId":vote["id"],"vote":"yes"})
        self.assertEqual(status,200);self.assertEqual(view["municipalTeam"]["cooperation"]["controlVote"]["status"],"applied")
        self.assertEqual(server.SHARED_ENGINE.actions[-1],{"action":"pause","value":True})
        status,view=self.request("guest",{"action":"proposeSimulationControl","control":"speed","value":4})
        speed_vote=view["municipalTeam"]["cooperation"]["controlVote"]
        self.assertEqual(speed_vote["status"],"pending")
        status,view=self.request("host",{"action":"voteSimulationControl","voteId":speed_vote["id"],"vote":"yes"})
        self.assertEqual(status,200);self.assertEqual(view["municipalTeam"]["cooperation"]["controlVote"]["status"],"applied")
        self.assertEqual(server.SHARED_ENGINE.actions[-1],{"action":"speed","value":4})
        status,_=self.request("third",{"action":"voteSimulationControl","voteId":speed_vote["id"],"vote":"yes"})
        self.assertEqual(status,409)

    def test_only_connected_host_can_delegate_alcaldia(self):
        status,body=self.request("guest",{"action":"transferMunicipalHost","playerId":"third"})
        self.assertEqual(status,403);self.assertEqual(server.state["host"],"host")
        status,body=self.request("host",{"action":"transferMunicipalHost","playerId":"guest"})
        self.assertEqual(status,200);self.assertEqual(server.state["host"],"guest")
        self.assertFalse(body["municipalTeam"]["isHost"])
        self.assertTrue(server.public_state("guest")["municipalTeam"]["isHost"])
        server.state["players"]["third"]=time.time()-60
        status,_=self.request("guest",{"action":"transferMunicipalHost","playerId":"third"})
        self.assertEqual(status,409);self.assertEqual(server.state["host"],"guest")

    def test_quorum_rejects_when_remaining_players_cannot_reach_majority(self):
        decision=server.create_municipal_decision("host",{"action":"place","kind":"civic","x":4,"y":9},8000)
        self.assertIsNotNone(decision)
        server.vote_municipal_decision("guest",decision["id"],"no")
        result=server.vote_municipal_decision("third",decision["id"],"no")
        self.assertEqual(result["status"],"rejected")

    def test_disconnected_player_cannot_vote_and_load_cancels_old_pending_votes(self):
        decision=server.create_municipal_decision("host",{"action":"place","kind":"civic","x":4,"y":9},8000)
        self.assertIsNotNone(decision)
        server.state["players"]["guest"]=time.time()-60
        with self.assertRaisesRegex(ValueError,"siguen conectados"):
            server.vote_municipal_decision("guest",decision["id"],"yes")
        server.state["players"]["guest"]=time.time()
        pending={"id":"old-pending","title":"Centro de salud","cost":8000,"status":"pending","proposer":"old-user","proposerName":"Antes","eligibleVoters":["old-user","old-guest"],"votes":{"old-user":"yes"},"action":{"action":"place","kind":"civic","x":1,"y":2}}
        approved={"id":"old-approved","title":"Escuela aprobada","cost":12000,"status":"approved","proposer":"old-user","proposerName":"Antes","eligibleVoters":["old-user","old-guest"],"votes":{"old-user":"yes","old-guest":"yes"},"action":{"action":"place","kind":"school","x":2,"y":3}}
        loaded={"municipalCooperation":{"approvalThreshold":10000,"decisions":[pending,approved]},"municipalResponsibilities":{"urbanismo":"old-user","servicios":"host"}}
        server.ACTIVE_SLOT_ID="a"*32
        with patch("server.load_slot",return_value=loaded):
            status,body=self.request("host",{},"/api/load")
        self.assertEqual(status,200)
        decisions=body["municipalTeam"]["cooperation"]["decisions"]
        self.assertEqual({item["id"]:item["status"] for item in decisions},{"old-pending":"cancelled","old-approved":"approved"})
        self.assertEqual(body["municipalTeam"]["cooperation"]["approvalThreshold"],10000)
        self.assertEqual(server.state["municipalResponsibilities"],{"servicios":"host"})


if __name__=="__main__":unittest.main()
