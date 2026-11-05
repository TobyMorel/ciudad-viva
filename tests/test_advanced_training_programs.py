"""Los cursos técnicos y docentes elevan la habilidad que realmente usa el empleo."""
import unittest

import server


class AdvancedTrainingPrograms(unittest.TestCase):
    def setUp(self):
        server.state=server.initial_state()
        server.state.update({"day":61,"roads":[[4,10],[5,10],[6,10]],"roadAssets":[],"roadIncidents":{"events":[]},"projects":[],"traffic":{},"trainingPrograms":[],"events":[]})
        self.home={"x":4,"y":10,"kind":"home","occupants":2,"residents":[]}
        self.center={"x":6,"y":10,"kind":"civic","id":"civic-6-10","status":"habilitado","name":"Aula municipal"}
        server.state["buildings"]=[self.home,self.center]

    def add_person(self,identifier,rank,category):
        skill_key={"docencia":"educacion","tecnica":"logistica"}[category]
        person={"id":identifier,"age":30,"workerEligible":True,"status":"buscando","educationRank":rank,"skills":{skill_key:40}}
        self.home["residents"].append(person)
        return person

    def test_docencia_course_improves_school_qualification_skill(self):
        person=self.add_person("teacher-trainee",2,"docencia")
        candidates=server.training_candidates("docencia",self.center)
        self.assertEqual([row["person"]["id"] for row in candidates],[person["id"]])
        server.state["trainingPrograms"]=[{"id":"course-teacher","category":"docencia","label":"Formación docente","status":"active","centerId":"civic-6-10","traineeIds":[person["id"]],"durationMonths":2,"monthsCompleted":0,"monthlyCost":1,"remainingBudget":2}]
        server.process_training_programs()
        self.assertEqual(person["skills"]["educacion"],58)
        self.assertEqual(person["skills"]["docencia"],58)

    def test_technical_course_improves_industry_logistics_skill_and_requires_primary(self):
        excluded=self.add_person("no-primary",0,"tecnica")
        trainee=self.add_person("technical-trainee",1,"tecnica")
        candidates=server.training_candidates("tecnica",self.center)
        self.assertEqual([row["person"]["id"] for row in candidates],[trainee["id"]])
        server.state["trainingPrograms"]=[{"id":"course-tech","category":"tecnica","label":"Formación técnica","status":"active","centerId":"civic-6-10","traineeIds":[trainee["id"]],"durationMonths":2,"monthsCompleted":0,"monthlyCost":1,"remainingBudget":2}]
        server.process_training_programs()
        self.assertEqual(trainee["skills"]["logistica"],63)
        self.assertNotIn("no-primary",server.state["trainingPrograms"][0]["traineeIds"])


if __name__=="__main__":unittest.main()
