# Auditoría del roadmap · Alfa 0.38

Esta revisión compara la implementación presente con las 34 fases del roadmap. “Parcial” indica que existe un circuito jugable comprobado en alguna entrega, pero faltan criterios de aceptación de la fase. No se asignan porcentajes porque faltan pesos estables por sistema y criterios finales para toda la obra.

| Fases | Estado comprobable | Brecha principal |
|---|---|---|
| 0–5 | Parcial: terreno, calles, zonificación, obras, hogares y actividad privada básica | Mapas extensibles, catastro, promotores y necesidades de hogares más profundas |
| 6–10 | Parcial: servicios resumidos, comercio, empleo, finanzas y buses | Redes físicas de servicios, educación, seguridad y ambiente causal |
| 11–15 | Parcial: estado compartido LAN y UI; aprobación básica | Elecciones, destitución, roles municipales, crisis y metas equilibradas |
| 16–20 | Parcial en empresas y cadenas de comercio; resto pendiente | Derecho de suelo, industria, licitaciones complejas y alquileres |
| 21 | Parcial: salarios, habilidades, búsqueda y cursos | Desigualdad territorial, carga habitacional, movilidad social y educación formal |
| 22 | Parcial: viajes a pie/auto/bus, flotas, paradas, cocheras físicas, rutas, transbordos, tarifa integrada y regreso separado con capacidad por sentido | Viajes de ocio, integración multimodal, trenes, metro, carga, accidentes y capacidad vial detallada |
| 23 | Parcial: terminal en obra por etapas, exportaciones comerciales por camión, patio limitado, buque visible, tasa e inserción laboral; Online/Offline | Importaciones, tipos de carga, calado/dragado, grúas y atraque, ferrocarril, competencia y pérdidas operativas |
| 24–28 | Pendiente como sistemas completos | Aeropuertos, turismo, redes completas, clima y servicios profundos |
| 29–33 | Pendiente como sistemas completos | Hacienda plurianual, patrimonio, mantenimiento, gobierno y décadas de simulación |

## Evidencia de esta revisión

La creación y unión LAN funcionan en el servidor local, y dos clientes reciben cambios del mismo estado. El descubrimiento UDP respondió a un anuncio local de prueba. Offline inició con la interfaz nueva. El flujo de contratos y paradas de bus fue verificado en Alfa 0.27; el nuevo colectivo de Alfa 0.28 aparece en una línea activa en Chromium, pero aún falta medir su comportamiento en una ciudad grande. No se ha validado LAN entre dos computadoras físicas ni el despliegue Vercel de este commit.

Alfa 0.29 añade conductores identificables para el servicio de hora pico; la fase 22 continúa parcial.

Alfa 0.30 agrega cocheras físicas de cuatro plazas y vincula el ahorro operativo a acceso vial y ocupación. Transbordos y jornadas completas siguen pendientes.

Alfa 0.31 cubre dos turnos pico con residentes distintos por colectivo; aún falta un horario completo y transbordos.

Alfa 0.32 añade un transbordo físico de hasta dos líneas. Sigue pendiente simular el regreso, las franjas horarias y un billete integrado.

Alfa 0.33 incorpora tarifa integrada de dos tramos con liquidación por línea. Aún falta el recorrido vespertino como viaje separado.


Alfa 0.34 agrega el regreso laboral de 17:00–19:00 como trayecto diferenciado, con reserva separada por línea, cobro integrado en ambos sentidos, emisiones y animación de flota. La fase 22 sigue parcial; faltan franjas horarias completas, tren/metro, carga, accidentes, detalle de capacidad vial y prueba en LAN físico.


Alfa 0.35 distribuye viajes laborales en nueve franjas. Alfa 0.36 agrega viajes de compras a pie o en auto hacia comercios abiertos. La fase 22 sigue parcial: faltan destinos de ocio/servicios, bicicletas, movilidad multimodal, capacidad vial detallada, carga, accidentes y LAN física.


Alfa 0.36 inicia viajes no laborales hacia tiendas abiertas con selección por distancia/actividad, modo a pie o auto, ida y vuelta, emisiones y representación visual. No se cobra otra compra. Esta es una cobertura inicial; faltan destinos de ocio/servicios, bicicletas, uso de colectivo y elección por presupuesto/propiedad de vehículos.

Alfa 0.37 suma visitas agregadas a centros cívicos accesibles. Fase 22 continúa parcial: faltan destinos recreativos, elección de colectivo/bicicleta para viajes no laborales y el primer corredor ferroviario de superficie.


Alfa 0.38 inicia la fase 23 con terminal construible, exportación causada por ventas regionales, camiones en calles, patio con capacidad, despacho por carga reunida, buque visible, entrega regional, tasa y empleo. Pruebas de servidor y Offline confirmaron el ciclo inicial. No satisface aún los criterios de importación, calado, dragado, productividad de grúas, cola de atraque, acceso ferroviario, competencia ni pérdidas por baja utilización; fase parcial. La siguiente entrega debe abrir fase 24 con un aeropuerto como nuevo circuito, evitando profundizar detalles portuarios antes de ampliar el resto de sistemas.
