# Auditoría del roadmap · Alfa 0.84

Esta revisión compara la implementación presente con las 34 fases del roadmap. “Parcial” indica que existe un circuito jugable comprobado en alguna entrega, pero faltan criterios de aceptación de la fase. No se asignan porcentajes porque faltan pesos estables por sistema y criterios finales para toda la obra.

| Fases | Estado comprobable | Brecha principal |
|---|---|---|
| 0–5 | Parcial: terreno, calles, zonificación, obras, hogares y actividad privada básica | Mapas extensibles, catastro, promotores y necesidades de hogares más profundas |
| 6–10 | Parcial: servicios resumidos, comercio, empleo, finanzas y buses | Redes físicas de servicios, educación, seguridad y ambiente causal |
| 11–15 | Parcial: estado compartido LAN y UI; aprobación básica | Elecciones, destitución, roles municipales, crisis y metas equilibradas |
| 16–20 | Parcial en empresas y cadenas de comercio; resto pendiente | Derecho de suelo, industria, licitaciones complejas y alquileres |
| 21 | Parcial: perfiles, migración con cohorte de edad, habilidades, búsqueda y cursos | Desigualdad territorial, movilidad social e ingresos a largo plazo |
| 22 | Parcial: viajes a pie/auto/bus, flotas, paradas, cocheras físicas, rutas, transbordos, tarifa integrada y regreso separado con capacidad por sentido | Viajes de ocio, integración multimodal, trenes, metro, carga, accidentes y capacidad vial detallada |
| 23 | Parcial: terminal en obra por etapas, exportaciones comerciales por camión, patio limitado, buque visible, tasa e inserción laboral; Online/Offline | Importaciones, tipos de carga, calado/dragado, grúas y atraque, ferrocarril, competencia y pérdidas operativas |
| 24 | Parcial: contrato por etapas, capacidad de terminal/pista, empleados, demanda, viabilidad de ruta, pasajeros, gasto visitante, tasas e integración Online/Offline | Rutas persistentes/múltiples, horarios, carga aérea, demoras meteorológicas, ruido zonal, emergencia y viajes terrestres dedicados |
| 25 | Parcial: hotel privado con inversión/obra por etapas, empleo, huéspedes derivados de vuelos, ocupación, tarifas, costos, impuestos y cierre causal en Online/Offline | Eventos/temporadas, atractivos, otros orígenes, impactos de vivienda/congestión/servicios y análisis distrital |
| 26 | Parcial: redes físicas de electricidad, agua, cloacas y drenaje; residuos por actividad, flota, cupo finito de relleno, basura pendiente y reciclaje con venta de recuperados | Transferencia, contenedores, clasificación de materiales, mercados privados, gas, telecomunicaciones, reparación, redundancia, respaldo y fallas/cortes detallados |
| 27 | Parcial: tormentas, recuperación, calor y sequía con respuestas operativas | Climas/regiones múltiples, incendios, inundaciones prolongadas y reconstrucción total |
| 28 | Parcial: salud primaria/urgente y agua diferida; escuela con docentes/aulas/viajes/espera; cuarteles con dotaciones cualificadas, despacho por ruta/tiempo, daños y costo, en ambos modos | Hospitalización, ambulancias, jardines y niveles educativos diferenciados, ampliaciones, seguridad y protección social |
| 29 | Parcial: créditos, amortización, proyección base, impuestos cobrados con mora, reserva de deuda y presupuestos operativos por programa con mora y efectos sobre servicios, redes/residuos y buses | Escenarios comparables, compromisos plurianuales, refinanciación y control más detallado de gasto |
| 30 | Parcial: patrimonio y rehabilitación; locales cerrados sin deudas pueden convertirse en vivienda privada con permiso, inversión, cuadrilla, etapas, inspección, alquiler y migración condicionada | Evolución arquitectónica por épocas, protección de alquileres y desplazamiento social medido |
| 31 | Parcial: calles, edificios públicos y redes técnicas con condición, mantenimiento, averías y contratos; calles críticas cierran rutas; tres clases de planta pierden capacidad por desgaste y reciben inspecciones programadas cada 180 días | Calendario preventivo para otras clases de activos, restricciones de planta durante obra, puentes, activos privados, rehabilitación mayor y reemplazo |
| 32 | Parcial: mandatos, elecciones, objetivos, reclamos con evidencia territorial y acuerdos de seguimiento con vencimiento | Navegación/reparación directa desde evidencia, transparencia completa, padrón demográfico y consultas vecinales |
| 33 | Parcial: edades, nacimientos condicionados, deterioro/reforma privada, balance barrial y competencia por demanda externa finita | Escenario de 30 años, ciclos económicos e inversión/apertura empresarial, proyectos entre mandatos y escenarios regionales |

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


## Alfa 0.61 · presupuestos municipales por programa (fase 29, parcial)

Hacienda permite asignar 0–200% del costo mensual a tres programas: servicios públicos, redes y residuos, y transporte. Las asignaciones cambian en pasos de 10 puntos porcentuales. Al cierre mensual cada programa paga hasta su tope y la caja disponible; el saldo impago queda como obligación persistente. Una asignación superior al costo puede amortizar obligaciones anteriores.

Los recortes tienen efecto operativo: la cobertura de salud y educación y la confianza responden a fondos de servicios; el mantenimiento insuficiente reduce capacidad de electricidad/agua y la recolección responde a presupuesto de residuos; el transporte financiado escala la capacidad efectiva de buses. El panel Hacienda muestra asignación, costo, pago, saldo adeudado y resumen del último cierre, dentro de un desplegable para mantener compacta la vista inicial. Online/Offline y guardados esquema 45. Pruebas funcionales verificaron pago parcial, mora, efectos operativos y prioridad de la reserva para completar deuda tras liquidar programas. Chromium a 390×844 y 1440×900: sin overflow horizontal ni solapamientos; contenido vertical desplazable. La fase 29 continúa parcial. No se validó LAN física ni Vercel.


## Alfa 0.62 · patrimonio y rehabilitación (fase 30, parcial)

Se inventarían ocho inmuebles iniciales de los barrios Centro y Estación. Cada edificio guarda año de construcción, época/arquetipo, uso original, reformas, conservación, relevancia patrimonial y ocupación; los guardados existentes reciben estos datos al migrar al esquema 46. La protección parcial e integral conservan el uso, suman identidad cultural y reducen el deterioro anual de 3 a 2 puntos. Los edificios protegidos pueden rehabilitarse por contrato: una de tres constructoras, cuatro trabajadores, presupuesto y materiales consumidos del proveedor seleccionado por disponibilidad/costo. La entrega tarda 1–9 días y la obra 20–30 días; el progreso pasa por refuerzo, instalaciones/accesibilidad y restauración/inspección. Al finalizar, se registra la reforma y la calidad de conservación depende de la constructora. Online/Offline comparten reglas.

Verificado: proteger y rehabilitar Mercado Central en Online y Offline; consumió materiales y $4.937, completó los 20 días de obra tras entrega, recuperó conservación a 100% y registró la reforma. Chromium móvil 390×844 y escritorio 1440×900: ocho fichas, controles dentro del modal, scroll vertical, sin overflow horizontal ni errores JavaScript. La fase 30 sigue parcial: faltan barrios de varias épocas, reconversión residencial/industrial, permisos de alteración, protección de alquileres y medición temporal de desplazamiento. No se validó LAN física ni Vercel.


## Alfa 0.63 · mantenimiento vial (fase 31, parcial)

Los tramos viales guardan condición y carga estimada a partir de edificios adyacentes y conectividad. Un plan ajustable de 0–200% define el gasto preventivo mensual; el costo se incorpora al programa Redes y residuos y la ejecución depende del presupuesto realmente pagado y de la caja disponible. Al cierre, el uso produce desgaste diferenciado y la financiación recupera parte de la condición. Si 35% de la red queda por debajo de 45%, cae un punto el nivel de servicios municipales. Ciudad > Mantenimiento expone condición, tramos prioritarios, costo y ejecución. Online/Offline y esquema 47.

Fase 31 sigue parcial: no hay inspección de puentes/edificios, cierre por seguridad, programación de obras, activos privados ni reemplazo. La fase 30 sigue pendiente en reconversión y desplazamiento.


## Alfa 0.64 · mantenimiento y rehabilitación correctiva (fase 31, parcial)

El plan de mantenimiento de Alfa 0.63 ahora cubre centros cívicos, escuelas, bomberos, depósitos, plantas de servicios, puertos y aeropuertos, con condición mensual según puestos y ocupación. El gasto preventivo se incorpora a Redes y residuos y el factor realmente liquidado determina cuánto se evita el desgaste. Una calle bajo 45% o un edificio público bajo 60% crea un expediente con causa, condición y costo estimado. La inspección cuesta $150 y espera un día; después se adjudica una constructora, se pagan los fondos, se ocupa cuadrilla de cuatro trabajadores y la reparación restaura a 82%. Ambos tipos de necesidad usan el mismo flujo que los daños de tormenta, sin duplicar bienes ni fondos. Online y Offline, esquema 48.

Prueba de ciclo completo en Online y Offline: Municipalidad a 60,1% con política sin financiación, caída a 59,8%, expediente de desgaste, inspección completada, oferta de Sur Obras de $900, cinco días, cuatro trabajadores y condición final 82%. Chromium 390×844 y 1440×900: subpestañas de calle/edificios dentro del modal, scroll vertical, sin overflow horizontal, textos solapados ni errores JavaScript. Fase 31 permanece parcial: no hay deterioro individual de redes técnicas/puentes ni cierres temporales.


## Alfa 0.65 · desgaste y averías de redes (fase 31, parcial)

Electricidad, agua, cloacas, drenaje, gas y fibra incorporan condición persistente por tramo. El uso del entorno acelera deterioro y la financiación efectiva del programa Redes lo mitiga. Al cruzar el umbral crítico se registra una avería, el tramo se excluye del grafo de conexión y se ofrece reparación por cuadrilla con costo asociado a severidad y tres días de trabajo. Servicios expone condición media y activos críticos. Online/Offline, esquema 49. Sigue pendiente el mantenimiento de puentes, cierre preventivo por inspección, sustitución y activos privados.


## Alfa 0.66 · cierres y desvíos por seguridad (fase 31, parcial)

La condición vial bajo 25% cierra el tramo a enrutamiento. Viajes laborales, vehículos de residuos y colectivos usan la red alternativa; si no la hay, el destino queda sin acceso. El panel prioriza cierres y el mapa 3D los marca con barreras. Tras diagnóstico y rehabilitación contractual, inspección final restablece el activo a 82% y lo abre. Online/Offline, esquema 50. Los puentes quedan pendientes de incorporar geografía de cruces de agua, inexistente hoy en el mapa.

Alfa 0.67 integra la condición de las tres clases de planta a los balances de capacidad: al 82% entregan su salida de diseño, y al deteriorarse aportan menos electricidad, agua potable o tratamiento cloacal. Mantenimiento expone capacidad efectiva. Online/Offline, esquema 51; las inspecciones siguen siendo reactivas y la fase 31 continúa parcial.

Alfa 0.68 incorpora inspección preventiva de centrales, potabilizadoras y depuradoras. Vencido el ciclo de 180 días, un expediente se abre en el cierre mensual; inspección pagada de $150/1 día aprueba operación sin obra o habilita contrato si la capacidad bajó. Online/Offline, esquema 52. Chromium 390×844 y 1440×900 verificó los paneles y acción visible sin desbordes ni errores JS.


## Alfa 0.69 · reconversión de locales a vivienda (fase 30, parcial)

Un local comercial cerrado conserva la parcela y solo puede reconvertirse si se pagaron sus deudas y no está catalogado como patrimonio. El promotor aporta $4.200, la ciudad cobra permiso de $200 y una constructora asigna cuatro trabajadores durante 20–30 días. Desmontaje, refuerzo, instalación de servicios e inspección habilitan 24 plazas residenciales. La migración existente llena plazas según vacantes, empleo y aprobación; cada residente paga alquiler después de 30 días en la vivienda y los impagos acumulados pueden bajar el apoyo ciudadano. Online/Offline, esquema 53. UI plegable comprobada a 390×844 y 1440×900.

Fase 30 queda parcial: no hay protección de inquilinos, desplazamientos, reconversión de vivienda a comercio ni cambios de arquitectura por década. El siguiente sistema prioritario es fase 32, elecciones y derrota cooperativa.


## Fase 32 · Alfa 0.70 (parcial)

**Implementado:** ciclo ordinario de mandato de cuatro años; evaluación por Oeste, Centro y Puerto; indicadores explicables de empleo, vivienda, servicios y aprobación; escrutinio por distrito; renovación de mandato; derrota cooperativa, pausa y observación persistente; disponible en Online/Offline, guardado 54.

**Pendiente:** plan municipal medible, promesas y seguimiento, reclamos localizados conectados con incidentes/servicios, transparencia y registro de acuerdos, diferencias de participación/voto por composición vecinal, crisis prolongadas con aviso y recuperación, destitución extraordinaria. No declarar completa la fase.


### Fase 32 · Alfa 0.71: plan, reclamos y crisis (parcial; ampliada en 0.72)

**Nuevo:** tres metas de mandato medidas mensualmente; reclamos automáticos por distrito con evidencia y resolución causal; penalización temporal de apoyo; alerta al segundo cierre y destitución tras tercer mes de crisis simultánea; recuperación posible antes del desenlace.

**Pendiente en 0.71:** enlazar los reclamos con expedientes/averías y plazos reales; confianza y voto según composición demográfica; consultas vecinales; transparencia y acuerdos. La alfa 0.72 añade acuerdos y vínculos informativos; sigue pendiente completar los criterios de toda la fase.


### Fase 32 · Alfa 0.72: evidencia y acuerdos (parcial)

**Implementado:** cada reclamo enlaza entidades de su distrito existentes en hogares, residentes sin empleo, comercios cerrados, redes averiadas, recuperación municipal, calles deterioradas o mora tributaria. El equipo registra acuerdos de seguimiento con autor y plazo; la resolución causal los cumple y el vencimiento genera consecuencias en apoyo y resultado electoral. Online y Offline, guardado esquema 56.

**Pendiente:** convertir vínculos informativos en navegación/intervención directa sobre expediente; ampliar consultas ciudadanas, transparencia y padrón demográfico.

### Criterio del panel de progreso por fase

Cada barra es una estimación orientativa de cobertura de los sistemas centrales y dependientes enumerados para esa fase, redondeada a 5 puntos. Se registra qué circuitos ya existen y cuáles faltan en `release_notes.json`; las fases permanecen parciales y ninguna se marca al 100% sin verificar todos sus criterios de aceptación. No se infiere progreso global como promedio: el roadmap tiene fases de alcance desigual y dependencias entre ellas. Los pendientes se muestran dentro de cada fase para permitir revisar y corregir la valoración con evidencia futura.

### Próximo objetivo

Continuar la fase 33: ejecutar escenarios reproducibles de 30 años y conectar los ciclos económicos, la oferta regional finita y las inversiones de largo plazo con envejecimiento/demografía ya implementados.

### Fase 33 · Alfa 0.73: edades, desgaste y renovación privada (parcial)

**Implementado:** envejecimiento anual de perfiles residentes; incorporación al mercado laboral a los 18 y jubilación a los 67; nacimientos cada cuatro años si el hogar dispone de adulto de 24–40 años, capacidad y $180. Las viviendas, comercios y hoteles privados de más de 20 años pierden condición. Bajo 70% aparece necesidad por distrito; una constructora con cuadrilla y lote disponible puede ejecutar la rehabilitación financiada con capital privado, permiso municipal, cuatro trabajadores, inventario y 24–36 días de obra. La inspección recupera condición/calidad, suma plazas residenciales y cambia el estilo del inmueble. Se refleja en Ciudad > Evolución y en andamios/condición del mapa 3D. Online/Offline, esquema 57.

**Pendiente / no verificado:** escenario continuo de 30 años; ciclos económicos, oferta regional finita e inversión competidora; trayectorias pequeña, metropolitana, portuaria y turística; contratos y deuda que cruzan mandatos sin explosión/duplicación de recursos. Por eso la fase sigue parcial (20% orientativo), no completada.

**Verificación de Alfa 0.73:** pasó compilación Python/JavaScript; prueba de transiciones, desgaste, transacción de materiales/capital/permiso, plazo, inspección, plazas y nacimiento en motor Online; acción HTTP del anfitrión y arranque de renovación Offline en Chromium. Revisada UI de Evolución en 390×844 y 1440×900: sin overflow horizontal ni errores JS, contenido vertical navegable hasta las acciones. La corrida de treinta años sigue pendiente; por eso no se acepta aún el criterio central de la fase.


Alfa 0.74 agrega mercados de exportación mensuales finitos en Online y Offline. El reparto por comercio pondera personal, precio, condición, servicios y ruta a salida vial/puerto; volumen y presupuesto comprador limitan ventas e ingresos. Persistencia en esquema 58; fase 33 pasa de 20% a 25% orientativo. Verificación de esta entrega documentada en ESTADO_DESARROLLO.md.


### Fase 33 · Alfa 0.75: inversión privada condicionada (parcial, 30%)

A la demanda externa finita se suma una oferta para abrir un comercio si hay ventas regionales sin cubrir, parcela zonificada conectada, presupuesto privado y reserva, permiso municipal y cuadrilla libre. Aprobar crea una obra con contratista, siete trabajadores, costo y plazo; el comercio solo abre tras el flujo de materiales, construcción e inspección existente. La oferta expira o puede rechazarse sin gasto. Implementado en Online y Offline, esquema 60. Sigue sin verificar el ciclo de 30 años y escenarios de la fase. Verificaciones específicas de código e interfaz se anotan en `ESTADO_DESARROLLO.md`.


### Fase 21 · Alfa 0.76: migración y padrón vinculados (parcial, 60%)

Llegadas limitadas por aprobación, vivienda vacante y empleo potencial añaden perfiles con identidad, edad, etapa de vida y elegibilidad laboral reproducible; salidas retiran individuos de hogares y liberan empleo. Esto mantiene vinculados ocupantes y residentes para empleo, escuela y envejecimiento en Online y Offline. Pendiente: desigualdad, movilidad social y efectos de ingreso/educación a largo plazo.


### Fase 33 · Alfa 0.77: delegación opcional de inversiones (parcial, 35%)

Automatización de una tarea administrativa rutinaria con un tope de permiso definido por el jugador. Solo contrata cuando se satisfacen demanda no cubierta, parcela conectada, caja municipal, capital privado y disponibilidad de cuadrilla. La obra resultante consume recursos reales y avanza por la cadena contractual existente. El tope y la decisión se guardan en el estado compartido; Online y Offline implementan la regla. El resto de la fase sigue pendiente: escenarios de décadas y especializaciones urbanas, herramientas de previsión comparativa y pruebas de aceptación a 30 años.


### Fase 33 · Alfa 0.78: registro de contratos heredados (parcial, 40%)

La aprobación de una obra guarda el mandato de origen. El panel de Gobierno presenta los contratos activos, su etapa, contratista, trabajadores, pagos, saldo público/privado y si se heredaron de otra gestión. El acta electoral incluye la cartera financiera a la fecha de elección; renovar el mandato no interrumpe el proyecto ni reembolsa pagos. Probado en Online y Offline con una obra de escuela y elecciones que renuevan al gobierno. El reporte cubre los proyectos estándar; la contabilidad conjunta de todas las rehabilitaciones, deuda y mantenimiento de largo plazo y los escenarios de décadas aún necesitan validación.


## Alfa 0.79 · permisos y crecimiento por demanda

**Implementado:** pintura continua de permisos residenciales/comerciales/industriales; residencia privada por demanda persistente; comercio automático si la parcela comercial pintada responde a demanda regional sin atender; producción fabril vendida a comercios por el mercado de insumos local. El edificio industrial tiene modelo 3D y empleo registrado.

**Prueba mecánica Online:** se inició una vivienda residencial tras comprar materiales y asignar cuadrilla; sin parcela zonificada no se crea proyecto; el contador solo descuenta residentes que realmente llegan. En simulación de mercado, una fábrica produjo 16 unidades y proveedores locales vendieron 15 a tiendas.

**Pendiente:** paridad de consumo de materiales en Offline, contratación automática comercial Offline sin política de delegación, prueba de interfaz en dispositivos, entrada de hogares tras terminación y comprobación LAN/Vercel. Las fases 1/4/5/16/17/18/20 pasan a 70/55/65/20/55/50/50%; no son porcentaje global.


## Alfa 0.81 · zonificación, promotores y producción local

El circuito de fase 4 combina permisos pintados con demanda: el uso residencial acumula candidatos, el uso comercial habilita una inversión condicionada por ventas no atendidas y el uso industrial permite que una empresa fabrique bienes que las tiendas compran. La fábrica necesita ruta, personal y servicios; produce al límite de capacidad y stock, paga nómina y costo operativo, cobra ventas locales y cierra si no puede financiar costos. La migración no reduce presión residencial hasta asignarse a una vivienda.

La fase 17 subraya las empresas y empleos de la nueva fábrica; fase 18 la cadena inicial proveedor local→tiendas; fase 20 el promotor de vivienda sobre parcela permitida. No se elevan porcentajes respecto del Alfa 0.79 porque las cadenas todavía son parciales: no hay materias primas industriales, cartera de promotores ni mercado de alquiler integrado.

## Alfa 0.81 · activación de promotores y permisos cooperativos abiertos

- Fases 4, 5, 17, 18 y 20 avanzan con demanda doméstica de comercio, inicio autónomo de obra en suelo permitido y fábrica privada activada cuando el comercio registra ventas o compra de insumos. Una parcela pintada no hace aparecer inmediatamente una construcción: crea permiso; el promotor espera demanda, acceso, fondos, personal y capacidad.
- La interfaz de parcela expone los tres usos con códigos de color y explica qué inicia el crecimiento. Las viviendas no generan residentes hasta que una mudanza ocurra. Comercios y fábricas se vuelven edificios visibles tras terminar las obras por etapas.
- La cooperación presenta referentes voluntarios y deja todas las herramientas y controles de juego disponibles a los invitados, incluidos velocidad, pausa, nueva partida, guardado y carga. El proceso servidor permanece autoritativo.
- Verificado en Online y Offline: vivienda ante demanda; sin vivienda con demanda cero; fábrica al existir actividad comercial; tienda al quedar compras domésticas sin atender; permisos, contratista y capital aplicados. API de sala: invitado pudo hacer gestión, tiempo, nueva partida y guardado/carga. Chromium móvil/escritorio sin errores ni overflow horizontal. No se probó LAN física. Global no estimable por falta de ponderación entre las 34 fases.


## Alfa 0.82 · primera cadena industrial de fase 18

La procesadora importa grano de cuota regional limitada por camión, descuenta la compra de su caja, espera ETA, consume inventario en producción condicionada a empleo/servicios y ofrece alimentos como proveedor local. Los comercios compran esos productos y abonan a la fábrica. La ficha del edificio y los camiones 3D muestran el ciclo. Una primera cadena está verificada; permanecen pendientes los otros tres circuitos del roadmap, depósitos y mermas.

La fase 18 sube a 60%. Offline comparte insumo/producción pero conserva sus diferencias: pedidos con ETA simplificada y obras sin consumo de materiales. El global permanece sin cálculo verificable porque no hay ponderaciones entre fases.


## Alfa 0.83 · segunda evidencia para fase 19

El historial de confiabilidad de las constructoras deja de ser solo informativo: cada ciclo de 30 días evalúa un riesgo de demora por empresa y ocupación de capacidad. Cuando se concreta, agrega días al calendario contractual, omite avance esa jornada y conserva motivo y conteo en Online y Offline. Fase 19: 35% (ofertas/capacidad + riesgo de calendario). Pendiente: hitos, alcance, multas, disputas, garantías, inspección de defectos y rescate. No se estima el avance global sin pesos comunes.


## Alfa 0.84 · evidencia de fase 19

Las constructoras cobran un 20% de anticipo y el saldo en certificados cuando el avance físico cruza cada hito del proyecto. El certificado registra importe y avance; si el municipio no puede pagarlo, la obra queda suspendida sin avanzar ni consumir insumos. Verificado en ambos motores y mostrado en la tarjeta. Fase 19: 40%. Aún faltan retenciones y garantías, órdenes de cambio, multas/disputas, tareas dependientes y pruebas de defectos. No se estima el progreso global.


## Alfa 0.85 · fase 19, garantías posteriores a recepción

Evidencia nueva: el contrato municipal reserva 10% en escrow después de la inspección provisional. Caja insuficiente para certificado + retención bloquea el último avance. Revisión día +30 es reproducible, modifica la calidad del activo ante defecto y bloquea pago; reclamo compromete tres trabajadores por cinco días y libera escrow al reparar sin duplicación. Online y Offline comparten el flujo. UI de Obras revisada en Chromium móvil y escritorio. Fase 19: 45% por el salto verificable del sistema. Se mantienen pendientes órdenes de cambio, disputas y penalidades, riesgos técnicos y rescate integral. Prueba Offline de cinco días completada: calidad restaurada y escrow pagado una vez. No elevar global, porque los 34 sistemas no tienen pesos comparables.


## Alfa 0.86 · fase 19, órdenes de cambio

Verificado: al primer 20% de obra municipal, un riesgo técnico reproducible puede detener avance y presentar causa, impacto económico/plazo y penalidad. Aceptar comprueba tesorería libre después de obligaciones, rebasea progreso/plazo sin retroceso y registra decisión; rechazar conserva precio y plazo, pero reduce calidad final y riesgo de garantía. Online (ruta HTTP) y Offline (persistencia local). Fase 19: 50%. Pendiente: disputas formales, multas/terminación, dependencias entre contratos y cobertura de pruebas largas. No se estima global.

## Alfa 0.87 · fase 18, cantera y materiales de obra

Evidencia: fábrica industrial privada adicional puede abrir como cantera. Extracción nominal ≤48/ciclo depende del menor factor de personal y tres servicios; una reserva geológica de 2.400 unidades y patio de 360 limitan salida/stock. Compra de árido local en un contrato paga a la empresa, descuenta su inventario y recorre ruta vial y descarga normal. Pruebas de capacidad, agotamiento parcial de reserva e integración HTTP, más UI Online en móvil/escritorio. Fase 18: 65%. Incompleto: transformación a hormigón, madera/acero, pedidos Offline y comercio exterior completo. Global no estimable.


## Alfa 0.88 · fase 18, hormigón local y recetas de construcción

Evidencia verificada mediante funciones del motor: cantera con personal/servicios produjo 30 áridos; la planta pidió stock a su ubicación física; el pedido recorrió cuatro tramos y entregó el insumo; 30 áridos generaron 15 hormigones; tres unidades vendidas al sistema sumaron exactamente $169 a la caja de la empresa y bajaron su stock; casa requiere siete unidades de hormigón; una partida antigua recibe la clave nueva con inventario cero. UI Economía de 390×844 y 1440×900 dentro del viewport, sin nodos ocultos ni errores de página. Python, JavaScript y JSON validan. El test funcional confirmó que `missing_materials` marca el hormigón por hito y que la compra HTTP sale de la planta, paga y rechaza faltantes sin debitar. Sigue pendiente el test de un tick/contrato completo suspendido → entrega → reanudación. Fuera de alcance verificado: Offline, LAN físico, madera/acero local. Fase 18: 70%; progreso global no estimable sin pesos comunes.


## Alfa 0.89 · abastecimiento de materiales Offline en fase 18

El adaptador Offline inicializa inventarios de áridos, hormigón, acero, madera y componentes para proveedores, constructoras y depósitos heredados. Las órdenes descuentan caja y stock al confirmarse, exigen camino al destino, reservan capacidad y llegan después del plazo del proveedor y viaje; al entregarse aumentan el inventario asignado a la constructora. Cada tipo de obra guarda receta e inventario consumido con el avance por etapas; la falta de materiales suspende el proyecto y deja causa, y el tick retoma la obra cuando hay stock suficiente. La reposición mensual limitada devuelve producción a los tres proveedores. Promotores automáticos de viviendas y comercios compran lotes industriales antes de financiar e iniciar, contabilizando materiales además de inversión/reserva.

**Verificado:** Chromium Offline realizó un pedido de 6 hormigones al Corralón por $372, registró la orden en tránsito, entregó por ruta vial y consumió hormigón en una obra; ventanas 390×844 y 1440×900 con confirmación visible y lista interna desplazable; cero errores JS. `node --check` en `offline.js`/`game.js` y `git diff --check` pasan. **Pendiente:** comprobar en ambos motores un proyecto detenido específicamente por falta de material y su reanudación tras entrega; prueba LAN física y despliegue Vercel no realizados. Fase 18: 75%; global no estimable por ausencia de ponderación común entre fases.


## Alfa 0.90 · madera local en fase 18

El siguiente emprendimiento industrial posterior a cantera y hormigonera puede especializarse como `sawmill`. El aserradero paga nómina y costo fijo con caja empresarial; capacidad nominal ≤30 tablas/ciclo escala por personal y mínimo de energía/agua/saneamiento. Dos troncos consumidos de una reserva forestal finita producen una tabla, hasta 240 en stock de proveedor; el bosque regenera 18 troncos al mes con límite de 2.400. Los pedidos `Aserradero local` salen de coordenadas físicas del molino, pasan por los pedidos/camiones habituales y acreditan ventas al negocio que entrega tablas. Offline crea el aserradero como segunda fábrica, produce por ciclo mensual y usa la misma cuenta de proveedor/empresa al vender material de obra. Economía incorpora una tarjeta con stock, reserva, producción y causas.

**Verificado:** test de motor Online: con 20 trabajadores, servicios completos y reserva inicial de 50, produjo 25 tablas tras regeneración, consumió 50 troncos y dejó 18; venta de 10 tablas agregó $690 a caja y dejó stock de 15. Chromium Offline: un pedido de 4 tablas desde aserradero a una obra costó $276, redujo stock de empresa/proveedor de 25 a 21 y acreditó ingresos. UI Economía revisada en viewports 390×844 y 1440×900: sin overflow horizontal ni errores JS. `py_compile`, `node --check`, JSON y diff check pasan. **Pendiente:** completar por interfaz adjudicación→terminación de fábrica; verificar producción desde empleo real/servicios en Offline, congelar/recuperar obra por escasez y equivalencia Online; validar LAN físico. La fase 18 sube a 80%; global no estimable por ausencia de pesos comparables.

## Alfa 0.91 · actualización de fase 18

Se suma el tramo acero regional → metalúrgica privada → componentes usados por las recetas de obra. El acero baja del stock del proveedor local al crear la orden industrial, viaja por carretera a la planta y pasa a materia prima al llegar. La producción fabrica hasta 24 componentes/ciclo según personal y servicios; los pedidos de obras venden existencias de la planta y acreditan su caja. Fase 18: 85%, siguiendo la misma granularidad de cinco puntos ya documentada. Pendiente validar recepción→consumo de componentes desde un proyecto real en ambos motores y comprobar visualmente el nuevo renglón de Economía en móvil/escritorio. No se afirma LAN entre equipos físicos.


### Alfa 0.92 — fase 18 (85%)

Separar las cuatro especialidades industriales del proceso alimentario Offline corrige doble contabilización de gastos y producción inexistente. Regresiones automatizadas Online/Offline confirman abastecimiento de componentes desde metalúrgica controlada a una obra detenida, transporte, consumo e inspección. No cubren habilitación desde una obra industrial ni todos los mercados/meses; sin nueva ponderación verificable no se altera el 85% de la fase ni se calcula un total global.


### Alfa 0.93 — Fase 18: 90%

Dos cadenas del roadmap pasan a funcionar también Offline (cantera geológica agotable → áridos, áridos comprados por carretera → hormigón físico 2:1 → suministro a obras). Los tests comprobaron compras, entregas y producción con mano de obra; se reserva el tipo de planta y la caja de operación en los contratos en ambos motores. Falta competencia más profunda entre suministradores, destinos logísticos alternativos, exportación industrial, quiebras con reorganización empresarial, escenarios de escasez sostenida y revisión plurianual. Por eso se incrementa solo 5 puntos de cobertura respecto del 85% anterior, sin atribuir avance global.


### Alfa 0.94 — fase 17 (65% de cobertura)

La quiebra de una fábrica ya no equivale a pérdida permanente de su edificio. Un promotor independiente puede rehabilitar y reocupar la instalación tras 90 días de inactividad, con demanda real, parcela industrial, acceso vial, mínimo de tres servicios, precio privado pagado, cuadrilla con cupo durante siete días e inspección final. Empresa nueva abre sin stock y debe contratar trabajadores. Reutiliza la geología restante sin recargarla. Se expone causa y presupuesto en Economía y parcela. Tests aseguran no reabrir gratis ni dos veces. Siguen pendientes competencia empresarial plena, expansión, reasignación laboral detallada, adquisición por competencia y escenarios de décadas. Se suman cinco puntos a la fase 17, no se estima progreso global.


### Alfa 0.95 — fase 17 (70%) y fase 18 (90%)

La competencia entre empresas de una misma rama industrial dejó de ser una abstracción: la compra a una industria local se adjudica por una oferta única con inventario, acceso vial, precio y flete concretos. La venta acredita a esa firma, no a una planta arbitraria; se registran los cargos logísticos y la identidad del proveedor. Las hormigoneras también eligen entre canteras rivales. El precio evoluciona por ventas y acumulación de inventario, no por bonificación global. Aún faltan competencia minorista avanzada, contratos privados a plazo, entregas físicas de promotores autónomos, expansión/reducción de plantillas y partidas de varias décadas; por eso la fase 17 se estima al 70%, la 18 permanece en 90% y el global sigue sin cálculo.
