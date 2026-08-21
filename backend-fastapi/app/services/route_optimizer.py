"""
app/services/route_optimizer.py — Otimização de rotas e cálculo de ETA
Lógica leve sem dependência externa pesada; pode ser expandida com OR-Tools/Google Maps
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
import math
import logging

logger = logging.getLogger(__name__)

# Velocidade média por modal (km/h)
AVG_SPEED_KMH = Decimal("60.0")
CITY_SPEED_KMH = Decimal("35.0")
HIGHWAY_SPEED_KMH = Decimal("80.0")


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distância geodésica Haversine em km — JS-style calc"""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calc_eta(distance_km: Decimal | float, avg_speed_kmh: Decimal | float | None = None, departure_at: Optional[datetime] = None) -> Tuple[Decimal, datetime | None]:
    """
    Calcula estimated_hours e ETA.
    JS: estimated_hours = distance / avg_speed
    ETA = departure_at + estimated_hours
    """
    if distance_km is None:
        return Decimal("0.00"), None
    speed = Decimal(str(avg_speed_kmh or AVG_SPEED_KMH))
    if speed == 0:
        speed = AVG_SPEED_KMH
    dist = Decimal(str(distance_km))
    hours = (dist / speed).quantize(Decimal("0.01"))
    eta = None
    if departure_at:
        # garante timezone aware
        if departure_at.tzinfo is None:
            departure_at = departure_at.replace(tzinfo=timezone.utc)
        eta = departure_at + timedelta(hours=float(hours))
    return hours, eta


def optimize_route_order(stops: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Otimização simples nearest-neighbor.
    stops: [{id, lat, lng, name}]
    Retorna ordem otimizada partindo do primeiro ponto.
    """
    if len(stops) <= 2:
        return stops
    unvisited = stops[1:]
    ordered = [stops[0]]
    current = stops[0]
    while unvisited:
        nearest = min(
            unvisited,
            key=lambda s: haversine_km(float(current["lat"]), float(current["lng"]), float(s["lat"]), float(s["lng"])),
        )
        ordered.append(nearest)
        unvisited.remove(nearest)
        current = nearest
    return ordered


def estimate_freight_cost(distance_km: Decimal | float, weight_kg: Decimal | float | None = None, volume_m3: Decimal | float | None = None) -> Decimal:
    """Estimativa frete: base R$ 50 + 2.50/km + 0.80/kg + 120/m3"""
    base = Decimal("50.00")
    if distance_km is None:
        return base
    cost = base + Decimal(str(distance_km)) * Decimal("2.50")
    if weight_kg:
        cost += Decimal(str(weight_kg)) * Decimal("0.80")
    if volume_m3:
        cost += Decimal(str(volume_m3)) * Decimal("120.00")
    return cost.quantize(Decimal("0.01"))


class RouteOptimizer:
    @staticmethod
    def optimize(
        origem: Dict[str, Any],
        destino: Dict[str, Any],
        waypoints: Optional[List[Dict[str, Any]]] = None,
        departure_at: Optional[datetime] = None,
        avg_speed: Optional[Decimal] = None,
    ) -> Dict[str, Any]:
        """
        Otimiza rota e retorna distance, estimated_hours, eta, freight, waypoints ordenados
        """
        waypoints = waypoints or []
        all_points = [origem] + waypoints + [destino]

        # Distância total via Haversine entre pontos sequenciais otimizados
        # Se houver waypoints, otimiza ordem dos intermediários
        if waypoints:
            # mantém origem e destino fixos, otimiza waypoints
            optimized_waypoints = optimize_route_order([origem] + waypoints)  # hack: origem como start
            # remove origem do resultado otimizado
            optimized_waypoints = [p for p in optimized_waypoints if p != origem]
            all_points = [origem] + optimized_waypoints + [destino]
        else:
            optimized_waypoints = []

        total_km = 0.0
        for i in range(len(all_points) - 1):
            a, b = all_points[i], all_points[i + 1]
            try:
                total_km += haversine_km(float(a["lat"]), float(a["lng"]), float(b["lat"]), float(b["lng"]))
            except Exception:
                # fallback: se não houver lat/lng, usa 0
                total_km += 0

        # Se distance explícita for maior, usa ela (ex: Rodovia)
        # Aqui usamos haversine; em prod integraria Google/OSRM

        hours, eta = calc_eta(Decimal(str(round(total_km, 2))), avg_speed, departure_at)

        return {
            "total_distance_km": round(total_km, 2),
            "estimated_hours": float(hours),
            "estimated_minutes": int(float(hours) * 60),
            "eta": eta.isoformat() if eta else None,
            "departure_at": departure_at.isoformat() if departure_at else None,
            "optimized_waypoints": optimized_waypoints,
            "ordered_points": all_points,
            "freight_estimate": str(estimate_freight_cost(total_km)),
            "avg_speed_kmh": float(avg_speed or AVG_SPEED_KMH),
        }

    @staticmethod
    def recalc_eta_for_route(route, departure_at: Optional[datetime] = None) -> Dict[str, Any]:
        dep = departure_at or route.departure_at or datetime.now(timezone.utc)
        hours, eta = calc_eta(route.distance_km or Decimal("0"), AVG_SPEED_KMH, dep)
        return {
            "route_id": str(route.id),
            "code": route.code,
            "distance_km": str(route.distance_km) if route.distance_km else None,
            "estimated_hours": str(hours),
            "eta": eta.isoformat() if eta else None,
            "departure_at": dep.isoformat(),
        }
