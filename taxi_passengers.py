"""Asignación determinista de pasajeros reales a circuitos de taxis municipales.

Solo reasigna viajes de compras/servicios que ya estaban modelados como auto:
no crea población, viajes ni tarifas ficticias. Conserva la contabilidad diaria
para cobrar al cierre mensual sin duplicar días por múltiples consultas.
"""
import math

TAXI_DAILY_CAPACITY = 8

def assign_taxi_passengers(state, trips):
    roads = {tuple(p) for p in state.get("roads", [])}
    depots = {(b.get("x"), b.get("y")) for b in state.get("buildings", [])
              if b.get("kind") == "depot" and b.get("serviceModel") == "taxiYard"
              and b.get("status") in ("habilitado", "operativo")}
    day = max(1, int(state.get("day", 1)))
    month = (day - 1) // 30
    for trip in trips:
        trip.pop("taxiRiders", None)
        trip.pop("taxiRouteIds", None)
    active_vehicles = 0
    vehicle_emissions = 0
    active_routes = []
    for taxi in sorted(state.get("taxiRoutes", []), key=lambda t: str(t.get("id", ""))):
        if taxi.get("fareMonth") != month:
            taxi["fareMonth"] = month
            taxi["fareByDay"] = {}
        history = taxi.setdefault("fareByDay", {})
        path = taxi.get("route") or []
        stops = [s.get("at") for s in taxi.get("stops", [])]
        connected = (len(path) >= 2 and (taxi.get("depotX"), taxi.get("depotY")) in depots
                     and all(isinstance(p, (list, tuple)) and len(p) == 2 and tuple(p) in roads for p in path)
                     and all(abs(a[0]-b[0])+abs(a[1]-b[1]) == 1 for a,b in zip(path, path[1:]))
                     and len(stops) >= 2 and all(isinstance(p, (list, tuple)) and len(p) == 2
                     and tuple(p) in roads and p in path for p in stops))
        serving = taxi.get("status") == "active" and taxi.get("operational") and connected
        riders = 0
        if serving:
            active_vehicles += 1
            vehicle_emissions += (len(path)-1) * .18 * 2
            active_routes.append(path)
            for trip in trips:
                if riders >= TAXI_DAILY_CAPACITY:
                    break
                if trip.get("reason") not in ("compras", "servicios") or trip.get("mode") != "auto":
                    continue
                if trip.get("distance", 0) < 4 or trip.get("workers", 0) <= trip.get("taxiRiders", 0):
                    continue
                origin, destination = trip.get("from", []), trip.get("to", [])
                matches = [(i, j) for i, a in enumerate(stops) for j, b in enumerate(stops)
                           if i != j and abs(a[0]-origin[0])+abs(a[1]-origin[1]) <= 1
                           and abs(b[0]-destination[0])+abs(b[1]-destination[1]) <= 1]
                if not matches:
                    continue
                count = min(TAXI_DAILY_CAPACITY-riders, trip["workers"]-trip.get("taxiRiders", 0))
                if count <= 0:
                    continue
                riders += count
                trip["taxiRiders"] = trip.get("taxiRiders", 0) + count
                trip.setdefault("taxiRouteIds", []).append(taxi.get("id"))
                other = max(0, trip["workers"] - trip["taxiRiders"])
                trip["vehicles"] = math.ceil(other / 1.4)
                trip["dailyEmissionsKg"] = round(trip["vehicles"] * trip["distance"] * .18 * 2, 2)
        history[str(day)] = riders
        taxi["dailyRiders"] = riders
        fare = max(0, min(3, float(taxi.get("fare", .45))))
        taxi["monthlyFareRevenue"] = math.floor(sum(history.values()) * fare + .5)
        taxi["forecastMonthlyFareRevenue"] = math.floor(riders * 30 * fare + .5)
        taxi["pauseReason"] = ("El circuito no conecta las paradas con el depósito." if taxi.get("status") == "active"
                               and taxi.get("operational") and not connected else None)
    return {"activeVehicles": active_vehicles, "vehicleEmissionsKg": round(vehicle_emissions, 2),
            "activeRoutes": active_routes, "dailyRiders": sum(t.get("dailyRiders", 0) for t in state.get("taxiRoutes", []))}
