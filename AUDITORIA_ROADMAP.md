# Auditoría del roadmap · Alfa 0.60

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
| 24 | Parcial: contrato por etapas, capacidad de terminal/pista, empleados, demanda, viabilidad de ruta, pasajeros, gasto visitante, tasas e integración Online/Offline | Rutas persistentes/múltiples, horarios, carga aérea, demoras meteorológicas, ruido zonal, emergencia y viajes terrestres dedicados |
| 25 | Parcial: hotel privado con inversión/obra por etapas, empleo, huéspedes derivados de vuelos, ocupación, tarifas, costos, impuestos y cierre causal en Online/Offline | Eventos/temporadas, atractivos, otros orígenes, impactos de vivienda/congestión/servicios y análisis distrital |
| 26 | Parcial: redes físicas de electricidad, agua, cloacas y drenaje; residuos por actividad, flota, cupo finito de relleno, basura pendiente y reciclaje con venta de recuperados | Transferencia, contenedores, clasificación de materiales, mercados privados, gas, telecomunicaciones, reparación, redundancia, respaldo y fallas/cortes detallados |
| 27 | Parcial: tormentas, recuperación, calor y sequía con respuestas operativas | Climas/regiones múltiples, incendios, inundaciones prolongadas y reconstrucción total |
| 28 | Parcial: salud primaria/urgente y agua diferida; escuela con docentes/aulas/viajes/espera; cuarteles con dotaciones cualificadas, despacho por ruta/tiempo, daños y costo, en ambos modos | Hospitalización, ambulancias, jardines y niveles educativos diferenciados, ampliaciones, seguridad y protección social |
| 29 | Parcial: créditos, amortización, proyección, impuestos efectivos con mora y fondo de servicio de deuda que cubre cuotas desde caja reservada | Presupuestos por programa, escenarios, compromisos plurianuales y refinanciación |
| 30–33 | Pendiente como sistemas completos | Patrimonio, mantenimiento plurianual, gobierno y décadas de simulación |

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


Alfa 0.40 abre la fase 24 con obra, pista y terminal, personal real, condiciones de demanda y acceso, una ruta de aerolínea condicionada por margen, pasajeros y compras locales de visitantes. La verificación de Online y Offline confirmó contratación, personal, vuelos y tasas. Fase parcial: aún no hay carga aérea, cartera persistente de aerolíneas, horario, clima, ruido territorial ni acceso multimodal del pasajero. Siguiente: fase 25, turismo y hoteles privados conectados con visitantes, gasto y demanda.


Alfa 0.40 incorpora el primer circuito de hotelería: una firma privada construye, emplea, atiende visitantes que llegan en vuelos conectados, recauda ingresos, incurre en costos y puede cerrar. El 5% de ventas se transfiere a la ciudad; los pasajeros siguen separados de residentes. Las llegadas derivan del sistema aeroportuario de fase 24. El turismo general sigue parcial: no se agregaron temporadas/eventos, otras vías de llegada, valor de patrimonio/naturaleza, presión en alquileres ni impactos de distritos. Próximo: iniciar fase 26 con balances físicos básicos y conexión de agua/energía en lugar de más pulido visual.


Alfa 0.41 inicia fase 26 en Online y Offline. Cables y tuberías se extienden sobre calles conectadas; el suministro asigna capacidad limitada a usos con prioridad, contempla pérdidas/fugas y estacionalidad, y registra costos de mantenimiento. Las plantas agregan capacidad al conectarse a ambas redes. Cobertura insuficiente afecta servicios, aprobación y producción privada; el aeropuerto/hotel requiere niveles mínimos. La fase continúa parcial según las brechas tabuladas.


Alfa 0.42 extiende la fase 26 con colectores cloacales independientes, caudal proporcional al agua servida, capacidad de tratamiento limitada y descarga sin tratar medible. Los cortes sanitarios afectan servicios, aprobación y actividad privada; la planta depuradora es una obra de 90 días con empleo, costo operativo y dependencias físicas. Online y Offline comparten la regla. La fase sigue parcial según las brechas de la tabla.


## Alfa 0.43 · drenaje pluvial (fase 26, parcial)

Se añadió un sistema de escorrentía que distingue lluvia, superficie impermeable de calles y edificios, conexión pluvial y elevación aproximada. Los colectores tienen capacidad de base y por tramo; la lluvia no conectada y los excedentes generan agua acumulada en parcelas. Tormentas severas pueden deteriorar edificios y caminos, descontar costos de caja, bajar servicios y afectar aprobación si comprometen servicios cívicos o a una parte relevante de hogares. El panel Servicios incluye caudal, capacidad, cobertura, conexiones, anegamientos y reparación estimada. La capa azul del mapa identifica red y parcelas anegadas.

La fase 26 sigue parcial: residuos, gas, telecomunicaciones, reparación efectiva, redundancia y bombeo avanzado están pendientes.


## Alfa 0.44 · residuos (fase 26, parcial)

La recolección ahora depende del tonelaje generado y de camiones/capacidad diarios. El relleno tiene cupo finito, y se puede construir una nueva celda sanitaria con cinco etapas. Si se agota el cupo o no alcanza la flota, queda basura acumulada y se vuelve visible sobre las calles; umbrales proporcionales y un mínimo absoluto causan pérdidas mensuales de servicios y, en crisis más grandes, aprobación. La ciudad paga operación y tarifas según el tonelaje recogido. La capacidad ampliada permite recuperar el retraso. Online y Offline comparten la mecánica.

La fase 26 sigue parcial: contenedores, turnos y recorridos de recolección detallados, transferencia, reciclaje, gas, telecomunicaciones, reparación, redundancia, respaldo e interrupciones de servicios permanecen pendientes.


## Alfa 0.45 · recuperación de residuos (fase 26, parcial)

Se puede licitar una planta de reciclaje de $14.800 y 88 días base, con 16 puestos, demanda de electricidad/agua, capacidad de 1,25 t/día y recuperación de hasta 35% de la recolección. El material recuperado genera ingreso municipal por ventas y reduce el ingreso al relleno. Online y Offline comparten la mecánica y esquema 30. Faltan tipos de materiales recuperados, separación doméstica, contenedores, centros de transferencia y empresas privadas de reciclaje.


## Alfa 0.46 · redes de gas y telecomunicaciones (fase 26, parcial)

Implementado: trazados de gas y fibra con conectividad física por calle, demanda diferenciada por tipo de edificio, capacidad incremental por tramo, mantenimiento, actividad productiva condicionada por suministros, panel de balance y capas 3D. Compatible con guardados anteriores y ambos modos de partida. Pendiente dentro de fase 26: cortes y reparación, redundancia, fuentes de red construibles, contenedores y transferencia de residuos, mercados privados de reciclaje y modelado más detallado de operadores.


## Alfa 0.47 · averías y reparación de redes (fase 26, parcial)

Implementado: una inundación puede inutilizar un tramo conectado físicamente; el corte recalcula continuidad y suministro. Una cuadrilla municipal repara el segmento con costo por tipo de red y plazo de tres días. El estado persiste en guardados, el informe identifica causa y ubicación, y la vista 3D resalta la avería. Online/Offline comparten la mecánica. Pendiente: fallas por desgaste, prevención, redundancia y respaldo crítico (bombas/hospitales), contenedores, transferencia y logística de reciclables.


## Alfa 0.48 · transferencia de residuos (fase 26, parcial)

Contenedores viales y almacenamiento/expedición de residuos en depósitos municipales conectados ya están implementados en Online y Offline. Capacidad física, despacho diario y saturación afectan el volumen procesado y la basura acumulada; no son solo indicadores de UI. Quedan pendientes rutas de camiones individualizadas, clasificación separada en origen y mercado material regional para reciclables.


## Alfa 0.49 · respaldo eléctrico (fase 26, parcial)

Centros de salud municipales, potabilizadoras y depuradoras pueden instalar un grupo electrógeno limitado por su demanda, hasta 75 kW. El depósito inicial sostiene tres días a potencia plena; el faltante de la red activa respaldo, que se agota por día y necesita repostaje. La inversión cuesta $2.800, combustible $0,12/kWh y mantenimiento $70/mes. Online/Offline comparten balances, acciones y estado; los generadores tienen representación 3D. Se mantiene pendiente la redundancia de líneas, operación hidráulica detallada y rutas de camiones.


## Alfa 0.50 · rutas físicas de recolección (fase 26, parcial)

Los camiones municipales y de depósitos calculan circuitos sobre calles conectadas, visitan contenedores alcanzables y terminan en transferencia o disposición. Se asignan paradas por rutas viables; la capacidad por camión y parada limita retiro. Los contenedores guardan hasta 2 t; los aislados se llenan y desbordan a basura urbana. Los vehículos 3D recorren el camino calculado y Servicios reporta circuitos, carga y acceso. Implementación Online/Offline; esquema 35. Pendientes: elección manual de turnos, rutas separadas por reciclaje y flota diferenciada.


## Alfa 0.51 · pronóstico y preparación ante tormentas (fase 27, parcial)

En la costa templada del mapa, una tormenta de 18 mm se pronostica cinco días antes. El cálculo identifica escorrentía y sectores expuestos según suelo, urbanización y drenaje actual. El registro compara áreas previstas y anegamiento real. Con riesgo moderado/alto se pueden gastar $850 en limpieza de sumideros y bombas móviles, que aportan 25% de capacidad durante el episodio y pueden reducir inundaciones y daños de servicios. Online/Offline. Verificación en el escenario inicial: 1.202 → 228 m³ de agua acumulada y 13 → 3 parcelas afectadas con preparación. Pendiente: mapas editables de exposición, riesgos regionales adicionales y reconstrucción completa.


## Alfa 0.52 · inspección y contratos de recuperación (fase 27, parcial)

Las inundaciones que afectan calles y activos municipales generan expedientes distintos. La inspección cuesta $150 y demora un día de juego; el informe abre tres ofertas de constructoras con costos y plazos propios. La adjudicación paga el trabajo, ocupa una cuadrilla de cuatro empleados, reserva capacidad empresarial y restaura la condición al terminar tras 3–5 días. Los casos y contratos persisten en guardados y funcionan Online/Offline. La cobertura no incluye seguros privados, reconstrucción total ni ola de calor/sequía.


## Alfa 0.53 · olas de calor y sequía (fase 27, parcial)

La región ahora tiene dos episodios anuales programados. El calor aumenta el consumo de electricidad/agua y proyecta enfermedad por exposición; refugios cívicos con personal, electricidad y acceso vial reducen los casos. La sequía reduce 45% la fuente por 30 días; protocolos comerciales y cisternas modifican el balance hídrico con costos y consecuencias. En las pruebas del mapa inicial, la preparación de refugios redujo los casos de 45 a 13; consumo térmico subió de 535 a 653 kW y de 100 a 117 m³/día. Restricciones redujeron el consumo medido de agua; cisternas restituyeron 30 m³/día. Online/Offline, esquema 38. La fase 27 sigue parcial: falta variabilidad geográfica de amenazas, inundaciones prolongadas, incendios y reconstrucción integral.

La pantalla Ciudad > Clima se verificó en Chromium a 390×844 y 1440×900. Conserva scroll vertical dentro del panel, botones dentro de sus límites y no produce overflow horizontal ni errores JavaScript. No se validó conexión LAN física ni despliegue en Vercel.


## Alfa 0.54 · capacidad sanitaria territorial (fase 28, parcial)

Las vacantes cívicas requieren habilidad Salud y la formación de seis residentes durante dos ciclos cuesta $840. El centro tiene 12 puestos; nuevos centros ya construibles tienen 16. Cada trabajador aporta capacidad primaria y urgente diferente, reducida por electricidad/agua/cloacas. Los hogares se asignan por ruta de calle y límite de 45 minutos; lo que excede capacidad forma lista de espera con resultados por barrio. El agua entregada y la depuración de aguas residuales actúan como proxy de seguridad sanitaria: un promedio móvil de 30 días demora el cambio en demanda; la ola de calor aumenta urgencias. Insumos sanitarios y nómina pública impactan el balance. Online/Offline, esquema 39. Sin personal cualificado, la capacidad comprobada es cero. La fase sigue parcial: no existen camas, ambulancias, diagnóstico, grupos etarios, escuelas ni policía funcional.

Chromium verificó Ciudad > Salud en móvil (390×844) y escritorio (1440×900): controles dentro del modal, scroll vertical y sin errores JavaScript ni overflow horizontal. No se probó LAN física ni Vercel.


## Alfa 0.55 · educación pública operativa (fase 28, parcial)

Una escuela es una obra pública cotizada a $9.600 y 68 días base, con trabajadores, etapas y contratista; Online consume materiales. Offline conserva contrato y plazo, pero no compra/entrega insumos. Al habilitarse abre cuatro aulas (96 plazas), 12 puestos docentes y mantenimiento mensual de $820. Niños y adolescentes simulados (5–17) viajan por rutas reales, hasta 40 minutos; la cantidad atendida queda limitada por aulas, docentes con habilidad Educación ≥48 y servicios de energía, agua y cloacas. Esperas, falta de acceso y costo por estudiante aparecen en Ciudad > Educación. Cada alumno atendido cuesta $0,35/mes en insumos; 12 ciclos de asistencia suman habilidad laboral. Un curso de Educación municipal forma candidatos docentes. Online/Offline, esquema 40. No incluye educación inicial, niveles separados, transporte escolar ni ampliación de aulas.

Chromium comprobó Ciudad > Educación a 390×844 y 1440×900. El contenido puede desplazarse verticalmente; botones y tarjetas quedan dentro del panel, sin desbordes horizontales ni errores de JavaScript. No se verificó LAN física ni Vercel.


## Alfa 0.56 · bomberos y emergencias urbanas (fase 28, parcial)

El cuartel se licita por $11.200 y 74 días base. Al habilitarlo, suma 12 empleos cualificados (Bomberos ≥48), hasta tres grupos de cuatro y $950/mes de mantenimiento; hay nómina municipal por cada puesto ocupado. Una revisión el día 10 de cada mes usa un hash estable para determinar si la ciudad presenta un incendio: la presión aumenta según inmuebles habitables, ola de calor y sequía; solo existe un incidente en curso. El inmueble afectado se escoge de manera reproducible. Las estaciones con cuatro empleados, dotación libre y ruta conectada compiten por tiempo de llegada (5 min + 2,5 min por tramo); se elige la más rápida y queda ocupada dos días. El tiempo de llegada modifica el daño (1–18 puntos de condición), que también reduce caja privada en hogares/comercios. Sin acceso o personal, el edificio empeora 2 puntos diarios; tras cinco días el incidente termina sin respuesta y servicios/apoyo caen. Ciudad > Bomberos informa cobertura por calle, dotaciones, gastos e historial; modelo 3D de cuartel, marcador activo y camión en recorrido. Online y Offline; migración 41.

Las regresiones confirmaron despacho en ambas modalidades: 35 minutos y siete puntos de daño con personal; cinco días sin equipo deterioran el inmueble y apoyo. También se verificó el contrato Offline, los puestos y el gasto. Chromium revisó Ciudad > Bomberos a 390×844 y 1440×900: contenido legible, scroll vertical, sin desborde horizontal ni errores JS. No se verificó red LAN física ni Vercel. Offline aún no compra ni entrega materiales. Fase parcial: no hay ambulancias ni hospitalización, equipos por especialidad, múltiples niveles educativos, policía o programas de protección social.


## Alfa 0.58 · crédito municipal y proyección de caja (fase 29, parcial)

Online y Offline permiten contratar créditos de $5.000, $10.000 o $20.000 cuando el límite de solvencia y la cuota lo permiten. La tasa fija es 12% anual, con amortización mensual y plazos de 24 o 48 meses. El efectivo ingresa a tesorería al firmar; la cuota reduce caja al cierre de mes. Los impagos quedan registrados. Hacienda separa saldo de deuda y servicio mensual, y muestra proyecciones de caja a 12 y 48 meses manteniendo constantes las bases actuales, con ese supuesto declarado. Guardados migran al esquema 42.

Verificado en servidor Online y adaptador Offline: $5.000 acreditados, cuota mensual de $132 a 48 meses; el primer pago separó $50 de interés y $82 de capital, saldo $4.918. La interfaz añade Hacienda dentro de Economía y suministros para no ampliar las categorías de Ciudad. Pendiente: escenarios, reservas, presupuestos por programa, refinanciación y compromiso de contratos futuros. No se validó LAN física ni Vercel.


## Alfa 0.59 · impuestos sobre caja y actividad (fase 29, parcial)

Se pueden ajustar impuestos inmobiliarios (0,20–1,40% anual) y comerciales sobre ventas (0–5%). La base inmobiliaria simulada es $2.400 por residente; el tributo comercial usa ventas registradas por cada negocio abierto. Al cierre mensual, los hogares y las empresas pagan desde su caja actual; el monto impago permanece como deuda tributaria del activo. La recaudación efectiva, no la facturada, aumenta la caja municipal. Menor efectivo doméstico limita compras; menor caja comercial limita insumos y operación. La confianza baja un punto cuando la mora alcanza al menos 35% de hogares ocupados. Hacienda informa tasas, base, cargos, pagos y mora. Online/Offline y guardados esquema 43.

Regresiones: diez residentes facturan $12; pagaron $12 desde el efectivo del hogar. Una tienda con $1.000 de ventas facturó $20; con $5 de caja pagó $5 y dejó $15 de mora. Repetir la liquidación del mes no vuelve a cobrar. El adaptador Offline cerró el ciclo y debitó $17 combinando vivienda y comercio. Chromium revisó Hacienda en 390×844 y 1440×900, sin errores JavaScript ni desbordes horizontales; el contenido largo mantiene scroll vertical. Fase 29 aún requiere presupuestos por programa, escenarios variables, compromisos plurianuales y refinanciación. LAN física/Vercel sin validar.


## Alfa 0.60 · reserva para servicio de deuda (fase 29, parcial)

Hacienda permite apartar o retirar $500, $1.000 o $2.500 desde la tesorería. Los aportes solo salen de caja libre después de contratos en curso; la reserva se conserva separada y el registro mantiene hasta 24 movimientos. Al cierre, si ingresos y caja libre no alcanzan para gastos más cuotas, el fondo de deuda puede cubrir la diferencia completa del servicio mensual. No realiza pagos parciales de cuotas: si falta dinero incluso con el fondo, se conserva el impago y se aplican las consecuencias de caja existentes.

La vista de Hacienda distingue caja libre y saldo protegido, e incluye la reserva al proyectar el patrimonio de tesorería a 12/48 meses. Online y Offline migran al esquema 44. Prueba de integración: aportar y retirar no crea dinero, un contrato vigente impide apartar su saldo, y un fondo suficiente cubre el faltante exacto de las cuotas sin generar mora. Chromium en 390×844 y 1440×900: controles visibles dentro del panel, sin overflow horizontal; el contenido largo usa scroll vertical y no se observaron solapamientos. LAN física y Vercel no se validaron.
