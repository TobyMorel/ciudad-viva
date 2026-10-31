# Auditoría del roadmap · Alfa 0.31

Esta revisión compara la implementación presente con las 34 fases del roadmap. “Parcial” indica que existe un circuito jugable comprobado en alguna entrega, pero faltan criterios de aceptación de la fase. No se asignan porcentajes porque faltan pesos estables por sistema y criterios finales para toda la obra.

| Fases | Estado comprobable | Brecha principal |
|---|---|---|
| 0–5 | Parcial: terreno, calles, zonificación, obras, hogares y actividad privada básica | Mapas extensibles, catastro, promotores y necesidades de hogares más profundas |
| 6–10 | Parcial: servicios resumidos, comercio, empleo, finanzas y buses | Redes físicas de servicios, educación, seguridad y ambiente causal |
| 11–15 | Parcial: estado compartido LAN y UI; aprobación básica | Elecciones, destitución, roles municipales, crisis y metas equilibradas |
| 16–20 | Parcial en empresas y cadenas de comercio; resto pendiente | Derecho de suelo, industria, licitaciones complejas y alquileres |
| 21 | Parcial: salarios, habilidades, búsqueda y cursos | Desigualdad territorial, carga habitacional, movilidad social y educación formal |
| 22 | Parcial: viajes a pie/auto/bus, flotas, paradas, cocheras físicas y rutas | Horarios completos, transferencias, trenes, metro, carga, accidentes y capacidad vial detallada |
| 23–28 | Pendiente como sistemas completos | Puertos, aeropuertos, turismo, redes completas, clima y servicios profundos |
| 29–33 | Pendiente como sistemas completos | Hacienda plurianual, patrimonio, mantenimiento, gobierno y décadas de simulación |

## Evidencia de esta revisión

La creación y unión LAN funcionan en el servidor local, y dos clientes reciben cambios del mismo estado. El descubrimiento UDP respondió a un anuncio local de prueba. Offline inició con la interfaz nueva. El flujo de contratos y paradas de bus fue verificado en Alfa 0.27; el nuevo colectivo de Alfa 0.28 aparece en una línea activa en Chromium, pero aún falta medir su comportamiento en una ciudad grande. No se ha validado LAN entre dos computadoras físicas ni el despliegue Vercel de este commit.

Alfa 0.29 añade conductores identificables para el servicio de hora pico; la fase 22 continúa parcial.

Alfa 0.30 agrega cocheras físicas de cuatro plazas y vincula el ahorro operativo a acceso vial y ocupación. Transbordos y jornadas completas siguen pendientes.

Alfa 0.31 cubre dos turnos pico con residentes distintos por colectivo; aún falta un horario completo y transbordos.
