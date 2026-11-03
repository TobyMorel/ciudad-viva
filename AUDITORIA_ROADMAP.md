# Auditoría · Alfa 0.159 · servicios públicos inmediatos

Cambio de flujo solicitado: salud, policía y bomberos se colocan con pago inmediato en lugar de entrar en una obra. Mantienen dependencias de plantilla, redes y calles para servir realmente. No se atribuye aumento de progreso de fase porque son servicios existentes cuyo flujo se simplifica; fase 4=60%, fase 7=95%, fase 9=75%. Progreso global no estimable por falta de pesos verificables de las 34 fases.

# Auditoría · Alfa 0.158 · río continuo

Se corrige la geografía visual y lógica del cauce, sin completar una fase nueva. El río deja terreno en ambas orillas y sigue hacia norte/sur; falta construir puentes para conectar la red vial de la ribera oriental. Se mantienen fase 4=60%, fase 7=95%, fase 9=75%. Progreso global no estimable por falta de pesos comunes y criterios de aceptación verificables para las 34 fases.

# Auditoría · Alfa 0.157 · crecimiento de población

Se elimina el tope inicial de migración por puestos y se acumula demanda residencial a diario. Con vacantes, un caso probado supera 44 personas tanto Online como Offline. El capital privado recibe aportes de migrantes; aún falta estrés de ciudad extensa y balance económico de décadas para subir la fase 4. El buzón permite descartar/ocultar sin cerrar la incidencia. Global no estimable; fases 4=60%, 7=95%, 9=75%.

# Auditoría · Alfa 0.156 · duración del día y farolas

Se amplió cuatro veces la duración del día sin cambiar reglas económicas ni los horarios de noche y tráfico. El reloj Offline y LAN usan la misma tasa. La escena reduce farolas a tramos alternos. Los porcentajes de fase no cambian; el total continúa sin estimarse por falta de pesos verificables de las 34 fases.

# Auditoría · Alfa 0.154 · sesión offline, paneles y acceso

No cambia la estimación: fase 7 sigue 95%, fase 4 60% y fase 9 75%. Se corrigen controles ya existentes; el global permanece sin estimar por falta de pesos verificables comunes a 34 fases. Test offline cubre Play/Pausa y panel Ciudad, además de construcción, respuesta LAN tardía y visibilidad del túnel corto.

# Auditoría · Alfa 0.153 · reparación de render y construcción

Esta entrega corrige regresiones de presentación/flujo y conserva el progreso por fase: fase 7=95%, fase 4=60%, fase 9=75%. No se atribuye avance porcentual por reparar visualización. Tests Chromium cubren render local, construir local, carreras de modo, catálogo con previews y el túnel de 8,4 unidades. LAN física sigue pendiente; la UI heredada de inspección de taxi conserva un timeout. El progreso total sigue sin estimar por falta de pesos verificables comunes para 34 fases.

# Auditoría · Alfa 0.152 · catálogo 3D y transporte

La fase 7 se mantiene en 95% (estimación anterior; esta entrega mejora la interfaz de las acciones ya existentes, no agrega por sí sola cobertura completa de pasajeros). La bandeja agrupa y filtra el catálogo, usa miniaturas de modelos 3D generados en WebGL y lista costos/características del objeto seleccionado. Los accesos de paradas seleccionan una cochera o depósito y pasan al diseñador vial existente; las tarifas por parada siguen siendo $350 para colectivo y $220 para taxi. La entidad de pasajeros en taxi y el abordaje continúan pendientes.

Se corrigió la previsualización vial: la baldosa verde ocupa casi todo el tramo de calle y el cambio de ubicación del cursor refresca solo esa capa, sin reconstruir tráfico ni restablecer orientación de vehículos.

El global no se calcula: faltan ponderaciones comparables verificables para las 34 fases. Fases 4/7/9 conservan 60/95/75%.

# Auditoría · Alfa 0.151 · crecimiento y actividad industrial

La fase 4 mantiene el 60%: ahora la demanda residencial puede iniciar obra privada zonificada en el ciclo diario y la cohorte de 36 residentes puede alojarse al habilitarse sus viviendas. Una prueba confirma creación de proyecto en `tick_one_day`; otra del flujo Offline confirma disparo automático sin pedidos. Esto verifica la mecánica inicial, no la economía/comportamiento completo de las fases de empresas.

Las construcciones dejaron de bloquearse por materiales y las escenas viejas migran ese estado. Se conservaron materias primas para las cadenas industriales. Los excedentes reales de fábrica se despachan por carretera, puerto o aeropuerto; solo el transporte terrestre tiene pruebas de integración en ambos motores en esta entrega.

La fase 7 sigue 95%: semáforos orientados a entradas de calle, farola por tramo, túnel y exportación amplían actividad representada, pero no completan taxis con pasajeros, subte, cruceros ni red aeroportuaria. Fase 9 queda 75%. Global permanece no estimable: faltan ponderaciones y criterios homogéneos para las 34 fases.

# Auditoría · Alfa 0.150 · taxi con recorrido manual

La movilidad existente ofrecía vehículos y líneas de corredor generadas automáticamente, pero no permitía elegir el camino y las paradas desde un depósito. Se agregó el flujo completo con ruta vial ordenada, 2–12 paradas, una sola línea manual por depósito, flota facturada y paso de pasajeros por la ruta directa y transbordos compartidos. La UI muestra paradas mientras se diseña y señales en el mundo. Los motores online/offline y pruebas de navegador cubren guardado y puesta en marcha.

Fase 7 permanece en 95% por taxi, subte, accesibilidad/multimodalidad restante; cargueros existentes no equivalen a cruceros. Aeropuerto conserva simulaciones de vuelos básicas, con viajes y conexiones por completar. Fases 4 y 9 no cambian (60%, 75%); total no estimable sin pesos y criterios homogéneos verificables.

# Auditoría · Alfa 0.148 · mensajería de incidencias existentes

La nueva bandeja muestra en la pantalla principal los avisos accionables que ya produce la simulación; cada mensaje tiene remitente real cercano, solicitud y foco de cámara. Se validó en móvil y escritorio con Chromium, sin solapamiento ni popup. No se agregó ninguna fuente de incidentes ni se cambió la cobertura funcional de servicios; por eso se conservan fase 4 al 60% y fase 9 al 75%. El avance global permanece sin estimación: no hay pesos de aceptación comunes verificables para las 34 fases.

# Auditoría · Alfa 0.141 · servicios funerarios (fase 9)

La fase 9 aumenta de 70% a 75%: las edades avanzan anualmente, la mortalidad natural es estable por identidad/edad, los fallecidos dejan el hogar y se registra su disposición. Cementerio limita a 120 tumbas, crematorio a 24 cremaciones por año; ambas instalaciones cuestan, emplean, requieren acceso por calle y declaran capacidad/espera en la UI. Pruebas de ambos motores verifican fallecimiento, plaza liberada, cementerio agotado y fallback a cremación. `test_funeral_ui.mjs` verifica el panel a 390×844/1440×900, y `test_ui_layout.mjs` actualiza los conteos y categorías del catálogo.

La fase continúa parcial: faltan servicios escolares y especialización de personal, escena/recorrido/resolución de robo por patrulla, y cobertura integral de todos los servicios. Global permanece no estimable por ausencia de pesos comunes verificables.

# Auditoría del roadmap · Alfa 0.133

## Cambio de alcance de construcción

La licitación elegida manualmente se retiró del flujo interactivo a pedido del usuario. El cliente muestra costo/plazo estimados y asigna automáticamente una empresa compatible; los contratos y sus consecuencias económicas, materiales y temporales siguen activos. Fase 2 permanece parcial en 75%; fase 28 sigue como siguiente sistema de contenido. Pruebas y revisión responsive de esta versión pendientes de ejecución.

# Auditoría del roadmap · Alfa 0.132

## Revisión de alcance · Alfa 0.132

### Fase 28 · evacuación de residentes existentes y retorno a su hogar

La atención temporal se amplía desde migrantes sin casa a hogares ya establecidos. Inundación intensa o repetida e incendio estructuralmente grave trasladan la misma cohorte de residentes a la lista municipal, sin modificar el padrón. Tienen prioridad en refugios sobre las nuevas llegadas, pero siguen sujetos a capacidad física, personal, conectividad, redes y fondos. El lote permanece reservado siete días; tras limpieza/revisión, el primer cierre mensual posterior devuelve a la familia a su casa si la condición es habitable. La lista de migración y las vacantes cuentan sin tratar como recién llegado a quien está evacuado. Economía revela cuántos residentes fueron desplazados.

Se verificaron las transiciones Online y Offline: evento causal, pérdida de ocupación temporal, identidad/censo constantes, protección del lote y retorno. Pasaron 92 pruebas Python, 62 Node Offline, stress de 30 años × cuatro perfiles y Playwright para marcadores, Economía, servicios, previsión y anexos escolares en 390×844/1440×900; el indicador de desplazados quedó dentro del panel. Esta entrega no implementa todavía reparación integral de casa arrasada, refugios móviles, ni atención geriátrica y formación técnica. Fase 28: 85% orientativo. Progreso global sin estimar por falta de pesos comunes verificables para 34 fases. LAN física pendiente.

# Auditoría del roadmap · Alfa 0.131

## Revisión de alcance · Alfa 0.131

### Fase 28 · refugio temporal conectado a vivienda, empleo y presupuesto

El refugio público es una obra cívica por etapas, con empresa, materiales, plazo, inspección y operación. Capacidad máxima de 30 camas, limitada por dotación (tres plazas por empleado), electricidad, agua, cloacas, acceso vial y presupuesto financiado de Servicios. El costo mensual ($1.180) entra a la contabilidad municipal. La migración sin hogar permanente puede ocupar una plaza; al quedar vivienda disponible, se realoja a la misma persona antes de nuevas admisiones. La UI de Economía informa capacidad, ocupación, lista de espera, admisiones/realojamientos y costo.

La cobertura protege demanda nueva no alojada; todavía no recoge hogares existentes desplazados por emergencias ni incorpora necesidades diferenciadas de adultos mayores. No se declara cerrada la fase. Pruebas dedicadas verifican equivalencia Online/Offline, cuello de botella por personal, financiación, redes y ruta, y realojamiento sin duplicación. Playwright revisa catálogo y panel en móvil 390×844 y escritorio 1440×900.

Fase 28: 83% orientativo (78% en Alfa 0.130); progreso global no estimable por falta de pesos comunes comprobables para las 34 fases. LAN física pendiente.

# Auditoría del roadmap · Alfa 0.130

## Revisión de alcance · Alfa 0.130

### Fase 28 · asistencia de alquiler con costo y hogares elegibles

La primera política de protección social ya cuenta con cupo mensual modificable por el gobierno, hogares elegibles por mora y orden de prioridad por ingreso por residente. El programa propone una renta mensual pendiente por vivienda, limita su alcance al presupuesto y a Servicios financiados y transfiere directamente al propietario. Las casas actualizan mora e ingreso de alquiler; el informe conserva solicitudes, pagos, beneficiarios y saldo sin cubrir. Online/Offline, cierre mensual. No crea efectivo al hogar.

Pruebas funcionales: 89 Python y 59 Offline; stress 30 años × cuatro perfiles. La interfaz de Economía cambió; `test_ui_layout.mjs` ahora mide la tarjeta en 390×844 y 1440×900. Fase 28: 78% orientativo, quedan refugio, desplazados, mayores, educación técnica y cobertura longitudinal. Avance global no estimable sin pesos verificables para las 34 fases.

## Revisión de alcance · Alfa 0.129

### Fase 9 · ampliación escolar recibida en ambos motores

El anexo contratado por `expandSchool` ya se probó desde anticipo hasta inspección usando los ciclos diarios Online y Offline. El proyecto consume la receta de áridos, hormigón, acero, madera y componentes, certifica cuatro hitos con pagos y habilita aulas/vacantes solo después de completar. La inspección conserva balance material, calidad, costo y capacidad en el edificio y agrega la garantía de obra. En Offline se corrigió el fallo terminal de `quality` sin definir y la calificación ahora respeta el contratista. El corte de ruta/stock sigue deteniendo una obra hasta reanudación; las regresiones estables usan stock conectado y sin incidentes para recorrer la recepción completa.

Pruebas: 86 Python, 58 Node Offline y ciclo completo de la mecánica en ambos motores. La pantalla no cambió; su verificación móvil/escritorio ya está en el commit Alfa 0.128. Falta probar la contratación docente y la cobertura en una partida poblada. Fase 9: 70%. Progreso global no estimable sin pesos comunes verificables. Próximo sistema de alcance: protección social conectada con hogares y presupuesto.

## Revisión de alcance · Alfa 0.128

### Fase 9 · capacidad educativa ampliable

Una escuela municipal habilitada puede contratar un anexo de dos aulas, sujeto a tope de seis aulas adicionales y a no tener otra ampliación activa. El contrato requiere calle conectada y fondos libres después de compromisos, paga anticipo y crea proyecto con constructor, trabajadores, materiales y cuatro etapas. La obra no incrementa matrícula al iniciar. La recepción añade aulas, puestos docentes y gasto de operación; el siguiente paso sigue siendo contratar docentes reales y depende de redes/financiación al atender estudiantes. Online/Offline comparten la acción y el registro de historial.

Pruebas: `test_school_expansion.py` y `test_school_expansion_offline.mjs` verifican contrato, material requerido, presupuesto, rechazo de anexo simultáneo y efecto de inspección; `test_school_expansion_ui.mjs` verifica panel, acción y geometría en móvil/escritorio. Falta completar el ciclo de avances y materiales dentro de la simulación de días y comprobar impacto de la capacidad nueva en asistencia y cobertura distrital. Fase 9: 67%. Progreso global no estimable sin pesos comunes verificables.

## Revisión de alcance · Alfa 0.127

La fase 8 avanza de 95% a 97% orientativo: la municipalidad ahora puede ordenar los pagos de servicios, redes/residuos y transporte cuando falta caja. La deuda impaga conserva su mora y la cobertura afecta sistemas físicos existentes. Verificado Online/Offline, con asignación limitada sin duplicación y panel responsive. No cierra la fase: falta medir una crisis recuperable integral y continuidad de los cinco servicios. El progreso global sigue sin porcentaje por falta de pesos comunes verificables para las 34 fases.

# Auditoría del roadmap · Alfa 0.110

## Revisión de alcance · Alfa 0.110

La entrega amplía el sistema visual de la fase 15 de 75% a 80% mediante modelos 3D procedurales integrados, variación ambiental y validación básica de pantallas. No agrega mecánicas del roadmap ni cierra la fase. El progreso global sigue sin estimarse porque no existe ponderación estable y comprobable para las 34 fases. Hito actual F; siguiente paso F, tráfico autoritativo y accidentes.


## Revisión de alcance · Alfa 0.109

La entrega de las trece referencias avanza la fase 15 (experiencia de juego) de 70% a 75%. No cierra fases de simulación: faltan tiempo semafórico autoritativo, accidentes, muchos sistemas profundos y validación LAN física. La cobertura global no se convierte en porcentaje porque las 34 fases carecen de pesos de aceptación comparables y estables. Hito actual F; próximo paso dentro de F: tráfico y respuesta a incidentes.


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


### Alfa 0.96 — fase 17 (75%), fase 18 (90%)

Se comprobó un sistema central de producción y economía: las construcciones de inversores privados ya no fabrican insumos en la parcela al pagar, sino que contratan camiones sujetos a stock comercial, distancia, rutas, costos, espacio de descarga y tiempos de viaje. La entrada al inventario se registra al recibir. Las empresas privadas también amplían o achican vacantes según desempeño financiero, invierten caja real en equipamiento y desocupan personas identificables. La industria metalúrgica dispone de capacidad incremental con equipos y puestos ocupados. Quedan pendientes contratos a plazo con garantías y contingencias, planificación comercial avanzada, control real de alquiler, logística ferroviaria/portuaria total y estrés multidecenal; por eso fase 17 avanza solo cinco puntos y fase 18 se conserva. No existe progreso global cuantificable.


### Alfa 0.97 — fase 17 (80%), 18 (90%)

Los proveedores privados ya celebran contratos de suministro a plazo para la cadena cantera→hormigonera. La materia reservada sale de la oferta disponible, pero el comprador solo recibe inventario al descargar cada remesa; la caja retenida se libera por entrega o se devuelve si el plazo expira. La liquidez empresarial, precio, ubicación y acceso vial determinan los acuerdos. Los estados y saldos quedan auditables por contrato en Economía. Es mecánica B2B verificable pero acotada a áridos: otros sectores, garantías adicionales, sanciones y comercio a largo plazo siguen pendientes, así como partidas de 30 años. No se extrapola a porcentaje global.

### Alfa 0.98 — fase 17 continúa al 80%

El contrato B2B de áridos agrega negociación pagada ante cortes viales, con conservación de lotes, dinero en custodia y la posibilidad de incumplimiento si persiste el corte. Se prueban los dos motores, una sola prórroga, rechazo sin ruta bloqueada, recepción tardía, cajas y ausencia de duplicación. Es una ampliación acotada de cantera→hormigonera: no eleva la cobertura de fase 17, la fase 18 conserva 90% y el avance global sigue no estimable.

## Alfa 0.99 · descarga siderúrgica compartida

En ambos motores, el cupo diario `unloadingCapacity` de un puerto se comparte entre **todos** los embarques de acero que llegaron al mismo muelle: si dos barcos traen 5 y 8 unidades y el puerto solo admite 7 al día, se entregan 5+2 el primer día y las 6 restantes al siguiente. La regla conserva el tiempo de navegación, la necesidad de puerto operativo, el acceso vial y los costos ya pagados. `lastUnloadedUnits` guarda el volumen diario por remesa y evita superar el límite en reintentos o al reabrir un guardado. Para remesas heredadas sin volumen diario registrado, el motor utiliza una estimación conservadora, sin migración obligatoria del esquema.

Se añadieron regresiones Online y Offline con dos cargamentos en el mismo puerto y comprobaciones de idempotencia; el workflow `validation.yml` incorpora el nuevo test Offline. Se corrigió el escenario responsive de prórrogas: la orden tenía un proveedor ausente y se cancelaba por insolvencia ficticia; ahora tiene comprador y vendedor existentes, materia identificable y corte de calles real. El CI debe confirmar el resultado después de publicar. Se conserva fase 33 en 40% y fase 17 en 80%; el progreso global sigue sin estimación verificable. Las verificaciones LAN física y Vercel no se realizaron.

**Próximo trabajo:** verificar el resultado CI de Alfa 0.99; completar contratos industriales a plazo en otras cadenas y ampliar observabilidad anual del estrés de 30 años para detectar pérdidas de capital, migración extrema y cuellos de botella portuarios.

## Alfa 0.100 · eventos turísticos con circuito económico completo

Se priorizó una **mecánica nueva de fase 25** frente al pulido de sistemas ya existentes. El municipio puede contratar para el próximo cierre mensual una feria ($1.200, hasta 110 visitantes), festival ($3.500, hasta 320) o congreso ($5.200, hasta 190), siempre con fondos no comprometidos por obras. Solo cabe una actividad programada por mes; la organización se paga una vez y no se reembolsa si el recinto o los accesos fallan al celebrarla. Requisitos: centro cívico y 1–2 comercios abiertos con ruta; congreso además hotel abierto accesible.

Al realizarse, servicios efectivos de agua/energía/saneamiento, cantidad de comercios y presupuesto real de limpieza limitan asistentes. Cada visitante cuesta $3–$5 de limpieza según evento; se cargan costo público, agua y residuos previstos. Los visitantes son **externos y temporales**, sin alterar por esa causa el padrón. Pueden aportar ocupación real a hoteles con servicios y ruta aunque no haya aeropuerto, y comprar producto físico restante en tiendas: se debitan unidades de `business.inventory`, se acredita solo el dinero de esas ventas a `business.cash` y se registra ingreso y resultado. La liquidación de venta es idempotente por evento, sin crear inventario infinito ni duplicar gasto. No se presentan las presiones calculadas de agua/residuos como consumos reales de red: aún falta enlazarlas a las capacidades físicas.

Reglas equivalentes en `server.py` y `offline.js`; Ciudad > Turismo incorpora la programación y un registro de estado, gastos, aforo, alojamiento y consumo. Nuevas regresiones Online/Offline de contratación, prohibición de duplicación, ejecución y cancelación sin reembolso; `tests/test_ui_layout.mjs` verifica los tres controles del panel Turismo en 390×844 y 1440×900, sin sobrepasar el ancho. El workflow de GitHub Actions empaqueta Alfa 0.100. **No afirmar CI aprobado sin confirmación de la ejecución final**; LAN física y despliegue Vercel siguen sin prueba.

Fase 25 pasa de 30% a **40%**, sin estimación global por falta de pesos comunes. Pendiente: eventos estacionales, seguridad y presión territorial, infraestructura turística especializada, derrame al transporte y vivienda, programación a varios meses y estrategia turística. En próximos sistemas priorizar hospitales/ambulancias, educación avanzada, trenes/carga y otras fases de baja cobertura, en vez de gastar versiones en detalles de esta feria.

## Alfa 0.101 — sistema de hospitalización y ambulancias · fases 9 y 28

Nuevo sistema jugable integrado a la red de centros cívicos de salud. El jugador puede equipar una sala de 12 camas por $7.200, ampliar de ocho en ocho por $4.600 hasta 36 camas y comprar hasta tres ambulancias a $2.800. La operación requiere acceso vial y financiación municipal **libre después de reservar obligaciones de obra**. Las inversiones se guardan en `building.hospitalWard` (compatible con partidas anteriores sin este campo), sin duplicar pagos. Cada centro tiene médicos de `workplaces`; una sala separa hasta cuatro trabajadores para atención básica y asigna los restantes a internación, descontando dos por dotación activa de ambulancia. Esa reasignación reduce las consultas primarias posibles: no hay personal ficticio.

El informe `healthReport.hospital` agrega demanda agregada de internación por barrio, camas con ocupación/rotación modelada en tres días, admisiones, espera, hasta dos traslados diarios por ambulancia dotada, y recorridos de hasta 45 minutos por calles transitable. Los barrios cercanos pueden acceder directamente en hasta 25 min; los lejanos necesitan ambulancia operativa. Agua, cloacas, electricidad, factor de financiación y personal reducen capacidad, y calor y agua no segura elevan demanda. La espera persistente se registra una sola vez por día en `state.health.hospitalBacklog`. El gasto fijo mensual por camas y ambulancias y suministros variables se suma efectivamente al programa municipal de servicios; hospital vacío sin personal sigue costando dinero. No se simulan diagnósticos clínicos individuales.

El panel **Ciudad > Salud** presenta indicadores hospitalarios, lista de espera, barrios desatendidos y botones de inversión. CSS con controles flexibles y etiquetas de varias líneas; `tests/test_ui_layout.mjs` prueba controles visibles, sin superposición y sin overflow en 390×844 y 1440×900, con nombre hospitalario largo. Tests Online y Offline cubren inversiones, personal ausente, reasignación desde clínica, falta de rutas, fondos reservados, ambulancia y repetición de informe sin doble cola. `.github/workflows/validation.yml` incluye tests Offline. Conservar como **una entrega de mecánica grande** (no generar nuevas versiones por pulido). La fase 9 se documenta en 50% y fase 28 en 60%, ambas parciales; global sin ponderación confiable.

**Siguiente sistema recomendado por cobertura y dependencia:** policía y protección social (fases 9, 13, 28), o formación secundaria y técnica (fase 28) y progresión por objetivos (fase 14). Falta hospital independiente en obra, ambulancias ocupadas durante misiones multidiarias y ciclos de alta hospitalaria; no afirmar que estas partes ya existen. CI, LAN física y Vercel deben comprobarse por separado.

## Alfa 0.102 · seguridad urbana y patrullaje (fases 9, 13 y 28)

Se agregó un **sistema jugable nuevo** en Online y Offline. Cada centro cívico municipal habilitado y con acceso vial puede equipar una base de seguridad por $4.000, que incluye un vehículo; cada móvil adicional cuesta $2.500, máximo tres. Las inversiones se pagan de caja **no comprometida por obras**. Se guarda en `building.policeUnit`, compatible con partidas antiguas sin esa propiedad. Las patrullas solo funcionan con electricidad/agua y financiación suficiente. Cada vehículo activo ocupa **tres trabajadores municipales** y el centro conserva hasta cuatro para atención primaria; la disponibilidad de personal para clínica e internación se reduce efectivamente y los móviles comprados sin dotación no prestan servicio. La prioridad puede cambiar entre mixta, residencial y comercial sin costo instantáneo.

Al cierre mensual se simulan incidentes deterministas de convivencia y comercio según localización, comercio, calles deterioradas y cortes de electricidad; no se usan atributos personales protegidos ni se atribuye delito a colectivos. El móvil solo interviene si existe camino con hasta 40 minutos de viaje y dispone de cupo (máximo dos intervenciones mensuales por patrulla). El enfoque reduce riesgo donde corresponde. Los incidentes sin respuesta pueden retirar hasta tres unidades reales del inventario comercial y, si se acumulan, erosionar aprobación/servicios. No se crea dinero ni inventario. El cierre se marca con `police.lastProcessedMonth` para evitar repetir pérdidas o intervenciones ante múltiples lecturas/reintentos. Costos fijos $390 por móvil y $70 por intervención atendida se imputan al programa municipal de **Servicios**; sin unidad no se cobran gastos ficticios. `policeReport` presenta cobertura por inmueble, atendidos/no atendidos, asignación de trabajadores, recursos y últimos incidentes. Es un primer nivel municipal de seguridad, no un cuerpo policial profesional independiente, que queda pendiente.

La sección **Ciudad > Seguridad** permite equipar, reforzar y configurar enfoques y muestra resultados económicos y sociales. Los botones se adaptan al ancho y admiten nombres largos; `tests/test_ui_layout.mjs` valida pantalla de 390 y 1440 px sin solapamiento, recorte u overflow. Se añadieron `tests/test_police_online.py` y `tests/test_police_offline.mjs`, incluidos en el CI. **No declarar pruebas concluidas antes de leer el último workflow**; la misma Alfa 0.102 agrupa todos los ajustes de esta mecánica. Fase 9: 55%, fase 13: 35%, fase 28: 65%; no asignar porcentaje global inventado. LAN real y Vercel aún no se verificaron.

**Siguiente gran mecánica recomendada:** protección social (hogares desplazados, vulnerabilidad y ayudas con cupos, presupuesto y consecuencias), seguida de educación secundaria/técnica y/o seguridad profesional con edificios, formación y turnos. Priorizar sistemas nuevos sobre microajustes, pero no sacrificar validación UI/CI.

## Alfa 0.103 · edificios de servicios obligatorios, categorías y cobertura 3D

**Decisión vinculante del usuario:** ninguna atención médica, policía, autobomba ni basurero debe surgir gratuitamente del edificio de la Municipalidad. El jugador **debe construir** instalaciones específicas, varias si la ciudad crece. Cada base tiene una cobertura **máxima** medida por caminos viales conectados (no distancia euclidiana); las calles inhabilitadas no cuentan. Seleccionar edificio terminado/proyecto o previsualizar una tipología debe colorear **verde las calles efectivamente alcanzadas en la ciudad 3D**. Mantener actores 3D concretos (ambulancia, policía, autobomba, camiones) y reflejar su operación real. Las construcciones avanzadas cuestan más, tardan más, consumen más materiales y ofrecen mayor personal, equipamiento y alcance.

Se incorporaron **12 variantes de servicio**, elegibles desde Construir agrupadas por familias y licitadas por las constructoras existentes (Online/Offline): Salud = consultorio barrial ($8.000, 6 tramos, 12 puestos), policlínico ($14.200, 10, 24), hospital general ($25.500, 16, 40, 36 camas y 2 ambulancias); Seguridad = puesto de vigilancia ($9.200, 6, 12), comisaría distrital ($16.500, 11, 22, 2 móviles), central de seguridad ($28.700, 16, 36, 3); Bomberos = destacamento ($11.200, 7, 12, 1 autobomba), cuartel ($19.800, 12, 22, 2), comando ($33.000, 17, 36, 3); Residuos = base ($5.600, 6, 8, 1 camión), centro de transferencia ($12.000, 11, 14, 2), complejo de higiene urbana ($22.200, 17, 26, 3). Costos de referencia antes del multiplicador de la constructora; radio expresado en tramos de ruta. Las instalaciones de policía se construyen con tipo base `civic` pero `serviceModel` policial, segregadas de los centros sanitarios. Las instalaciones anteriores compatibles mantienen sus atributos y las que carecen de modelo se asocian al nivel básico cuando realmente son servicios, nunca a Municipalidad. Esta última puede seguir siendo sede municipal y centro de eventos, **no clínica, comisaría ni base de residuos**.

Servidores: `SERVICE_MODELS` y `service_model`/`offlineServiceModel`, `service_route_within`/`offlineServiceRoad`, radio aplicado a admisiones, internaciones, incidentes policiales, bomberos, rutas a contenedores y hogares cubiertos por camiones. Recolección ya no tiene camión ficticio desde el punto central ni capacidad de calle independiente de las bases. Los inmuebles mayores exigen incrementos proporcionales de las cinco clases de materiales y todo el costo contractual. En Three.js se diferencian policías, cuarteles y depósitos de niveles superiores; `coverageRoads` ilumina verde solo la red dentro del límite del edificio/obra seleccionada. Pruebas `test_service_models_online.py`/`test_service_models_offline.mjs` y UI en 390/1440 px verifican catálogo, proyectos, ausencia de cobertura gratuita y superposición; prueba de vehículo 3D exige redes energéticas y agua conectadas. **No confundir un vehículo estacionado por falta de servicios con fallo gráfico**.

La prioridad siguiente es extender la tipología escalonada a **escuelas (jardín, primaria, secundaria, universidad), industria, electricidad, agua, vivienda y comercios**, sin romper obras/contratos existentes; edificios especializados independientes pueden sustituir gradualmente el uso compartido de `civic`. No declarar terminadas todas las categorías construibles todavía. Continuar respetando la secuencia Alfa `0.103 → 0.104` y reservar números nuevos para mecánicas grandes. Confirmar CI final antes de afirmar aprobación completa; LAN/Vercel requieren prueba externa.

## Alfa 0.104 · jardín, primaria, secundaria y universidad con educación efectiva

Se agregaron cuatro obras municipales en Construir, con licitación y recursos materiales realmente proporcionales: jardín ($6.200, 52 días, 8 vacantes, radio 5 tramos, 5–6 años), primaria ($9.600, 68 días, 12 vacantes, radio 8, 7–12), secundaria ($17.800, 100 días, 18 vacantes, radio 12, 13–17), y universidad ($32.000, 145 días, 30 vacantes, radio 17, 18–24). Las bases tienen aulas y operación mensual $580/$820/$1.550/$3.200 más nómina e insumos por inscripto. La simulación de Online y Offline toma un residente identificable, una edad compatible y un máximo de ruta por calles abiertas; si una sede se llena, busca otra accesible. Los cupos dependen de profesores cualificados efectivamente empleados, aulas, electricidad, agua, saneamiento y presupuesto. Tras doce meses realmente asistidos por nivel, se registra la formación y aumentan las competencias laborales según ciclo, sin acreditar nada por informes repetidos o edificios vacíos. Las partidas antiguas con edificios u obras school sin serviceModel conservan su funcionamiento previo para edades 5–17.

La escena 3D distingue jardines y edificios mayores, y muestra en verde sobre calles transitables el radio del establecimiento seleccionado o previsualizado. Se incorporan regresiones Online/Offline y se actualiza el empaquetado CI. Los estudiantes todavía no se mueven individualmente por las calles de Three.js; tampoco existen carreras universitarias completas ni oferta técnica especializada. Fase 28 queda parcialmente en 75%, progreso global no cuantificable. CI se verificará después de publicar; LAN física y Vercel siguen sin comprobar.

**Siguiente gran mecánica sugerida:** protección social por hogar con elegibilidad objetiva, presupuesto y cupos mensuales realmente acotados y efectos comprobables. Seguir la serie Alfa 0.N: 0.105 → 0.106.


## Alfa 0.105 · interfaz rosa minimalista, avisos físicos y construcción comprensible (histórico)

La interfaz pasa a rosa empolvado/crema, superficies blancas, controles con jerarquía y navegación simplificada sin ocultar el simulador. En el muelle inferior hay **Avisos** y **Ayuda**. El módulo cityGuide.js obtiene alertas de datos calculados por las simulaciones Online/Offline: policía, incendios, ambulancias, basura visible, contenedores casi llenos, tramos dañados y obras pausadas. Cada aviso tiene identificador, posición real y texto accionable; la proyección de la cámara coloca botones 2D sobre el edificio o la calle (giro y zoom incluidos). Pulsar una alerta abre descripción y permite inspeccionar parcela. No se fabrican incidentes sin causa simulada. Los eventos resueltos solo se ven por un período limitado; los incidentes sin respuesta no se confunden con los atendidos. Los avisos son lectura y localización de hechos existentes, no despacho municipal manual.

Los cubos junto a calles corresponden a **contenedores de residuos**, **bolsas de basura no recogida** o **barreras de calzada deteriorada**, no a bloques de construcción. Al tocar la parcela se identifican con cantidad/capacidad o condición y medidas de solución. Las zonas amarillas son **permisos industriales, no fábricas terminadas**. Al tocarlas se puede elegir especialidad, o hacerlo en Construir: procesadora de alimentos, cantera, hormigonera, aserradero y metalúrgica. Los dos motores validan y guardan la especialidad elegida, sin cambiar la asignación automática de inversiones zonificadas y partidas anteriores sin selección explícita.

**Cómo conseguir hormigón:** en Obras → Pedir materiales, elegir proveedor con hormigón físico en stock, ruta para camión, destino con espacio y caja del contratista. Para producir localmente: dos parcelas industriales conectadas; construir primero cantera (áridos), después hormigonera. La receta del juego consume *dos áridos físicos por unidad de hormigón*, además de necesitar personal, electricidad, agua, saneamiento, capital privado y cadena logística. No afirmar que se modela cemento por separado. Las obras no terminan al pintar suelo: la guía explica etapas, certificados, esperas, causas y materiales aún por consumir, diferenciados de stock entregado o en tránsito.

Three.js añade detalles decorativos y diferenciación a todas las familias, patios, señalética, jardineras, fachadas, cubiertas, instalaciones industriales y luminarias, además de iluminación más cálida; se mantiene como base el modelado procedural previo, sin importar modelos CAD externos. En móvil se omiten adornos adicionales costosos. **Pendientes**: efectos activos de humo/llamas, tutorial con pasos validados, remodelación total de cada activo con malla de alta calidad, despacho manual de emergencias y mejoras adicionales de rendimiento. No declarar esos sistemas completos. Las regresiones cubren clasificación de avisos, fuentes, guía de materiales, especialidad industrial Offline y UI responsive. Verificar CI después de publicar; red LAN física y Vercel requieren comprobación separada.

**Próxima etapa:** emergencias con decisiones y respuesta municipal sobre el mundo; después optimización visual y tutorial por objetivos persistente.

La fase 13 avanza del 35% al 40%. En el panel Ciudad → Servicios, una avería permite contratar reparación normal al costo base y tres días, o despachar una cuadrilla prioritaria por el doble y un día. La respuesta urgente verifica conectividad vial y caja municipal libre después de compromisos de obra; las acciones repetidas se rechazan. El corte aparece en Avisos con causa, ubicación, afectados y opciones. La ruta y el estado de la cuadrilla persisten y Three.js presenta un vehículo seleccionable durante el trabajo y hasta un día después de restablecer la red. Online y Offline usan el mismo costo, plazo y requisitos. Tests: `test_utility_response_online.py`, `test_utility_response_offline.mjs`, `test_city_guide.mjs` y revisión UI responsive.

**Pendiente:** responder con opciones específicas a enfermedades, accidentes y otras crisis; completar el catálogo causal de fase 13. La UI integral queda como etapa posterior a esta tanda mecánica, según la instrucción del usuario. El progreso global sigue sin estimarse: el registro de roadmap no define pesos verificables comunes para ponderar las 34 fases. Fase 13: 40%.

**Siguiente entrega:** ampliar fase 13 con respuesta sanitaria y movilidad ante accidentes, e integrar sus efectos persistentes. A continuación iniciar el rediseño visual integral solicitado. Mantener controles sin límites para invitados.

## Alfa 0.107 · rediseño integral Atlas municipal

La interfaz adopta una dirección cartográfica propia: azul petróleo, papel cálido, acento terracota y verde de acción. `design.css` concentra el nuevo sistema para pantalla de inicio, barras superiores, indicadores, mapa, dock, ventanas, catálogo, formularios, avisos y paneles de ciudad. El archivo se sirve también por el anfitrión LAN. Se corrigió la cuadrícula heredada: como los paneles laterales están en ventanas, el mapa ocupa todo el ancho de escritorio; en móvil ocupa toda la altura entre indicadores y pie. Los controles y textos largos permiten envolver y desplazar contenido. La navegación y mecánicas siguen disponibles. Comprobar visualmente 390×844 y 1440×900, además de las pruebas de interfaz existentes.

Fase 15 sube de 60% a 65% por coherencia visual y legibilidad comprobables. Progreso global aún no estimable: faltan pesos comunes verificables para las 34 fases. Pendientes: sesiones de usabilidad con personas y revisión de accesibilidad. Próxima entrega: respuestas sanitarias y viales de fase 13.

## Alfa 0.108 · movilidad y lectura de la ciudad (2026-11-01)

- El mapa dibuja estrés vial con viajes ya simulados, señales visuales en intersecciones, vehículos en carril derecho y giros de orientación suavizados. Los semáforos detienen visualmente los actores; la espera semafórica aún no entra en el cálculo autoritativo de tiempos.
- Se ampliaron geometrías y detalles de árboles, coches, buses, casas y fábricas. Se aumenta el zoom a 4×. En móvil se reduce la cantidad de árboles decorativos para sostener el rendimiento.
- Avisos reutilizados entre actualizaciones, pulso suave y ubicación baja para basura/calles. El panel de aviso conserva causas y acciones.
- Construir tiene grupos visibles; Economía separa producción, Hacienda y mercado; Ciudad muestra un menú vertical. Tema claro/oscuro guardado localmente. Sonido ambiental procedimental tras interacción.
- Al cambiar ventanas, los nodos de controles regresan a sus contenedores originales. La lista LAN consulta `/api/rooms` si existe un iniciador y muestra sesiones anunciadas. En Vercel no es posible descubrir máquinas LAN desde un sitio estático bajo HTTPS; se ofrece estado vacío y unión manual, sin simular salas.
- Verificación: sintaxis JS, pruebas Python 52/52, inspección visual móvil y escritorio de Construir, Ciudad, Economía y Tráfico. La prueba completa de Playwright terminó correctamente en 390 y 1440 px tras evitar el render 3D detrás de ventanas; también pasó la prueba visual de respuesta de servicios. Se verificaron por navegador la lista vacía LAN, el panel flotante de tráfico y el tema oscuro. Pasó también el stress económico de 30 años con cuatro perfiles y 360 cierres mensuales por perfil. La prueba entre dos computadoras físicas sigue pendiente.
- Progreso global: no cuantificable todavía. El método por fase usa incrementos de 5 puntos con evidencia, pero no hay pesos estables y verificables para agregar las 34 fases. Fases 7 y 15: 70% cada una, ambas parciales. Hito actual F; próximo: completar simulación vial con tiempos autoritativos, accidentes y otros sistemas pendientes de F.


## Alfa 0.134 · fase 28, acompañamiento a mayores

Se añade `elderCare` a `SERVICE_MODELS` y a Offline: centro de acompañamiento domiciliario municipal con obra, personal de salud, costo operativo, radio y cupo. `update_older_adult_care` / `updateOfflineOlderAdultCare` seleccionan residentes 75+, ordenan primero a 80+, y asignan una visita a hogares dentro de ruta vial según plazas reales (cuatro por empleado), servicios y presupuesto. La tarjeta de Economía detalla elegibles, atendidos, en espera y centros. Regresión Online verifica edad, prioridad, plantilla, financiación, agua y ruta; 93 pruebas Python, 63 Node Offline, estrés 30 años × cuatro perfiles y Playwright responsive (390×844/1440×900) pasan en esta versión. Fase 28 orientativa: 88%, aún parcial; falta movilidad y cuidados por dependencia, asistencia a desplazados/otros grupos y evaluación longitudinal. Global no estimable: no existe ponderación común comprobable para 34 fases.


## Alfa 0.135 · refinanciación municipal (fase 29)

El crédito activo se puede refinanciar una sola vez si quedan más de tres cuotas y se reduce la cuota mensual. Se agregan saldo y mora al principal, con nueva tasa fija 18% anual y plazo 72 meses; no se acredita dinero. La UI de Economía muestra el costo pendiente actual y total de la nueva oferta en un desplegable y exige una acción confirmatoria. El registro `refinancingHistory` persiste préstamo, fecha, saldo, mora, cuota previa, cuota nueva y costo comparativo. Pruebas Online/Offline aseguran neutralidad de caja, menor cuota, costo superior, capitalización de mora y rechazo a repetición. Prueba UI en móvil/escritorio cubre descripción, medidas y acción.

Método orientativo de fase 29: promedio de cinco bloques de igual peso (20 puntos cada uno; bloque completo=100%, parcial=50%, faltante=0%): caja/compromisos/proyección 100%; auditoría de movimientos 50%; presupuesto plurianual/prioridades 50%; ciclo de vida 0%; escenarios 0% = 40%. Pruebas completas de esta build: 96 Python, 64 Node Offline, stress 30 años × cuatro perfiles y Chromium en 390×844/1440×900 para Economía y catálogo, sin errores de consola ni recortes en las áreas tocadas. La fase permanece parcial. Global no estimable por falta de pesos para agregar 34 fases.


## Alfa 0.136 · libro y conciliación neta de caja (fase 29)

Online y Offline inicializan `finance.cashLedger` sin fabricar el pasado de guardados viejos. En cada límite de operación/cierre con cambio de efectivo persisten día, importe neto, saldo previo/posterior y el último evento como referencia; ingreso y egreso se acumulan por separado, no-op no añade registro. La conciliación compara apertura + ingresos − egresos con caja actual y publica la diferencia. Hacienda despliega resumen y hasta 12 operaciones; se conservan 120 detalles y acumulados.

Pruebas: `test_municipal_cash_ledger_online.py` cubre entrada, salida, diferencia cero, idempotencia del snapshot y migración sin historia falsa; `test_municipal_cash_ledger_offline.mjs` comprueba depósito a fondo y salida de caja sin duplicación; `test_municipal_forecast_ui.mjs` mide el panel y una fila en 390×844 y 1440×900. Fase 29 sigue en 40% (bloques 100/50/50/0/0): esta versión registra netos por operación, pero faltan conceptos contables y origen/destino para considerar terminada la auditoría. Global permanece no estimable por ausencia de pesos comunes verificables.


## Alfa 0.137 · escenarios fiscales por sensibilidad (fase 29)

El panel Hacienda ejecuta tres previsiones de doce cierres con el mismo motor de caja: base (0% ingreso/gasto), favorable (+10% ingreso, −5% gasto) y adverso (−15% ingreso, +10% gasto). Cada proyección conserva proyectos, pagos por hitos, orden de programas, reservas, préstamos, mora y el comportamiento de déficit ya implementado. Informa cierre, caja libre, mora de programas/deuda, primer faltante y primer impago. Ningún escenario escribe al estado de la partida. La UI explica que se mantienen población, impuestos, contratos y condiciones del resto del modelo; es un contraste, no una predicción.

Tests: `test_municipal_forecast_online.py` y `test_municipal_forecast_offline.mjs` validan supuestos, orden relativo de resultados y neutralidad de caja; `test_municipal_forecast_ui.mjs` comprueba tres tarjetas, supuestos, desbordes y solapamientos en móvil 390×844 y escritorio 1440×900. El resultado se cachea hasta cambiar datos de entrada. Fase 29 queda en 50% (bloques 100/50/50/0/50): este comparador parcial no alcanza horizonte de 1/4/10/20 años. No incluye aún inflación, crecimiento demográfico ni empleo futuro. Global no estimable sin pesos comunes verificables.


## Alfa 0.138 · estimación preliminar de ciclo de vida (fase 29)

La ficha de obra pública separa inversión inicial, operación mensual conocida y reserva anual de mantenimiento (2,5% de inversión) a horizontes acumulados de 1, 4, 10 y 20 años. Modelos con operación no definida quedan marcados como no cuantificados, no como costo cero. Las reservas se describen como supuesto y no alteran el presupuesto real. Siguen pendientes suelo, diseño, personal para todos los modelos, operación completa, inflación, renovación, cierre y financiamiento; por ello esta herramienta es una ayuda de planificación, no un costo total contable.

Fase 29: 60% según bloques iguales caja/compromisos 100%, auditoría 50%, presupuestos/prioridades 50%, ciclo de vida 50%, escenarios 50%. Se conserva el mismo criterio longitudinal documentado en `ESTADO_DESARROLLO.md`. Chromium responsive valida construcción en 390×844 y 1440×900, lectura completa al desplazar el modal y el comienzo real de una obra.


## Alfa 0.139 · importaciones marítimas visibles (fase 23)

Los pedidos de acero que abastecen el proveedor regional quedan enlazados a un viaje de importación marítima. En la escena 3D el buque se mueve con el reloj y es seleccionable; informa carga, salida y arribo. Al llegar queda en la terminal hasta que el cupo diario descarga unidades. La descarga modifica el stock de acero una vez, no al mostrar el viaje. Los guardados antiguos con remesas en curso reciben una entidad visual idempotente. El informe separa importación de exportación. Online/Offline verifican ruta, remesa, espera parcial y cantidad sin duplicados; Chromium 390×844/1440×900 verifica panel y selección sin texto recortado o solapado.

Fase 23: 45%, parcial. Para considerar completa la logística portuaria siguen pendientes importaciones distintas del acero, destinos/depósitos genéricos, cola de atraque, grúas, calado, ferrocarril, competencia, costos y mantenimiento.

## Alfa 0.140 · asentamiento vacío y crecimiento privado visible (fases 1, 4, 5 y 9)

Nueva partida Online/Offline limpia edificios, residentes, proyectos y zonas, pero conserva tesorería/servicios como bases de simulación. Una conexión vial exterior es el único activo municipal inicial; la continuación regional se dibuja fuera del mapa urbano. La demanda inicia con 36 familias y puede crecer antes de empleos locales; el límite de arranque es 120 solicitantes. Vehículos entrantes son actores 3D seleccionables y las personas solo se ubican en viviendas terminadas.

Promoción privada por parcela: viviendas, comercios y fábricas zonificados inician automáticamente con demanda correspondiente. Vivienda atiende la cola; comercio se habilita con población; fábricas aparecen después de ventas/actividad comercial. Los materiales están incluidos en el costo privado y no crean una orden municipal para la obra zonificada. Los permisos, inversión, trabajadores, cuadrillas, calendario y etapas continúan activos. Nuevas partidas Offline no sustituyen guardados existentes.

El fuego activo produce 11 llamas y 18 partículas de humo 3D por incidente. Las alertas ya existentes de seguridad y bomberos usan texto directo y abren detalles al tocarlas. Esto no cambia frecuencia de incidentes ni capacidad de despacho. Verificado: 103 pruebas Python, 68 Node Offline/compartidos, stress de 30 años × 4 perfiles y Chromium a 390×844/1440×900 para incendio/puerto; `git diff --check`, sintaxis y JSON.

Pendiente en esta solicitud: mortalidad natural/edades, cementerios y crematorios con cupo; escena del robo y desplazamiento visual de patrullas; farolas ligadas individualmente a cada calle; validar crecimiento sostenido más rápido. La fase 4 conserva 60%, la fase 5 70%, fase 9 70%. Progreso global no estimable por falta de pesos comunes verificables para 34 fases. LAN física aún pendiente.


## Alfa 0.145 · expansión pagada del terreno (fase 1)

La fase 1 sube de 70% a 75% por la compra de sectores contiguos de 8×8, precio por distancia, persistencia, acceso infinito por coordenadas y encuadre responsive del flujo de compra. En la partida nueva se habilita una región 16×16 junto al acceso regional. Verificación local: 114 pruebas Python, 74 pruebas Node/Offline, cuatro perfiles de estrés por 30 años, y Chromium de marcadores, layout general y expansión en 390×844/1440×900. Las pruebas se corrieron nuevamente de forma aislada para evitar competencia de navegador. Pendiente para fase 1: catastro y derechos de propiedad; falta estrés de mapa/cámara muy grande. No asignar porcentaje global sin pesos comunes verificables.
## Alfa 0.146 · respuesta audible y control de semáforos · fases 7 y 9

Los cruces de 3+ calles tienen semáforos modelados en 3D y guardan instalación/retiro por intersección. El override de estado es compartido en Online y persiste Offline; los cruces sin excepción nacen señalizados. La acción valida que la parcela sea vía y que el grado del cruce sea 3 o 4; la respuesta del viaje respeta la excepción.

Sirenas sintetizadas acompañan intervenciones recientes de policía/bomberos, incendios activos aportan crepitación y la congestión real de colas/demoras puede producir bocinas espaciadas. El control de audio común, la pausa y la pestaña oculta limitan la emisión. Los sonidos son generados localmente, sin dependencias remotas.

Pruebas: regresión Online de semáforo instalado/retirado/restaurado y cruce inválido; regresión Offline equivalente; Chromium de interacción/lectura responsive en 390×844 y 1440×900; sintaxis. Se añaden al workflow. Fase 7 continúa en 95% (pendiente alivio/fiabilidad del sistema en ciudades densas); fase 9 continúa en 75% (pendientes patrullaje físico, docentes/cobertura y otros criterios). No se infiere el progreso global por cantidad de funciones.

# Auditoría · Alfa 0.155 · guardados offline

La regresión `.map` del arranque offline quedó cubierta por inicialización/migración de colecciones ausentes y fallback en render 3D. Chromium verificó partida limpia, guardado heredado sin edificios/obras, escena visible, acciones locales y respuesta LAN tardía. CI repetirá la prueba en cada push. No cambia la estimación: fase 7=95%, fase 4=60%, fase 9=75%; total sin estimar por falta de pesos comparables verificables para las 34 fases.


## Alfa 0.201 - catastro y propiedad de parcelas (fase 1)

Se incorporan folios de sector y parcela, titularidad municipal/privada y separacion explicita entre dominio y permiso urbanistico. La compra de sectores registra fecha y costo; las partidas heredadas reciben su titulo sin asignar datos historicos desconocidos. El informe municipal de Suelo y la seleccion de cada parcela exponen titular, derecho, uso y folio.

Verificacion base: 12 regresiones Python del asentamiento; 6 regresiones Node Offline (alta privada, migracion, zonificacion y persistencia); 10.000 sincronizaciones de un registro sintetico de 1.600 sectores, 50.000 edificios y 10.000 obras en 0,043 s. Verificacion Chromium posterior: `test_land_expansion_ui.mjs` valida la compra y el desbloqueo contiguo en 390 y 1440 px; `test_distant_land_ui.mjs` compra cinco sectores consecutivos, construye una calle hasta la parcela 4,49, guarda y reanuda con 9 sectores y 40 tramos, sin errores JavaScript. El test usa una tesoreria de prueba ampliada para recorrer toda la expansion. Las dos pruebas de navegacion pasaron localmente. Fase 1: 90%; siguen pendientes compraventa/transferencia de inmuebles privados, gestion de barrios, costos de suelo diferenciados y planificacion vial por proyectos.


## Alfa 0.202 · compraventa de inmuebles privados (fase 1)

La ficha de una vivienda, comercio, fábrica u hotel privado permite adquirirlo para el municipio. La tasación usa el valor base de reposición y ajusta por estado; la compra se rechaza si la caja libre, descontados los contratos públicos, no alcanza. Se actualizan titular y derecho del folio, se registra vendedor/comprador/fecha/precio y la actividad privada sigue operando. Online y Offline comparten reglas; los guardados conservan transferencias ya registradas.

Validación focalizada: prueba Node Offline para débito, titularidad, registro de transferencia y rechazo de compra duplicada; sintaxis de JavaScript y compilación de Python. Fase 1: 93% orientativo. Quedan gestión de barrios, costos de suelo diferenciados y planificación vial por proyectos.
