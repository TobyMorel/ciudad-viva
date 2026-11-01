# Continuidad de desarrollo para otra IA

Este documento es el punto de relevo de Ciudad Viva. Léelo junto con `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md`, que sigue siendo la especificación principal, y con `ESTADO_DESARROLLO.md`, `AUDITORIA_ROADMAP.md`, `DECISIONES_TECNICAS.md` y `SIGUIENTE_ENTREGA.md`.

## Cómo continuar con el mismo criterio

- Priorizar mecánicas nuevas y circuitos jugables de extremo a extremo. El usuario pidió explícitamente no dedicar muchas versiones a pulir detalles mientras falten sistemas del roadmap.
- Las decisiones deben tener causas, recursos finitos, costos, tiempos, actores y efectos visibles en la ciudad. No sustituir una mecánica por una barra sin consecuencia.
- Toda regla central nueva debe funcionar en los dos modos: `server.py` (estado autoritativo online/LAN) y `offline.js` (motor local del navegador). Evitar duplicar cálculos de UI como si fueran reglas de simulación.
- La construcción existente proporciona el circuito común: parcela, contratista, capacidad de cuadrilla, fondos, materiales, etapas, avance, inspección y activación. Reutilizarlo cuando corresponda.
- Mantener una causa verificable y persistente en el estado, migraciones explícitas del esquema y una explicación accesible desde los paneles existentes.
- No declarar completa una fase porque tenga un prototipo. Mantener los porcentajes de fase conforme al criterio de cobertura documentado en `release_notes.json` y la auditoría. El avance global permanece sin estimar: no hay una matriz global de ponderaciones verificable.
- El usuario requiere subir cada entrega completa a `main` y comprobar el resultado. El commit debe llevar un email real válido de autor, nunca el valor `0`. No reemplazar una rama remota más nueva ni afirmar publicación sin comprobar el SHA.
- Empaquetar cada entrega completa en un ZIP que incluya esta guía y los documentos de estado.
- Probar los cambios con comprobaciones proporcionales al alcance. Para cambios de interfaz verificar escritorio y móvil, textos legibles, scroll utilizable y ausencia de solapamientos/overflow. Indicar si LAN física o Vercel no se comprobaron.

## Arquitectura actual

- `index.html`: interfaz principal y carga del cliente. Sigue siendo una página estática usable en Offline; Online/LAN requiere el anfitrión con `server.py`.
- `game.js`: cliente, herramientas, paneles emergentes, selección de parcelas/actores, peticiones y renderizado de UI. Usa modo offline mediante el adaptador, o modo online contra el estado del servidor.
- `world3d.js`: escena Three.js isométrica, edificios/terreno/actores visibles y proyección del puntero a entidades seleccionables. La escena de cada actualización se reconstruye desde el estado compartido.
- `server.py`: fuente autoritativa de simulación Online/LAN, acciones serializadas, guardados y migraciones. Las peticiones LAN no dependen de servicios externos.
- `offline.js`: simulación/persistencia local. Mantener paridad funcional con el servidor.
- `style.css`: estilos adaptables y paneles. Comprobar anchos cercanos a 390 px y escritorio para contenido nuevo.
- `release_notes.json`: historial de versiones y datos de la guía visual de fases. Actualizar la versión y los cambios de la interfaz con cada subida.
- Documentación: auditoría, estado, decisiones y próxima tarea deben concordar con código y pruebas.

## Estado histórico al cerrar Alfa 0.78

- Roadmap: hito F; fase activa 33, parcial (40%). La fase 21 está al 60% tras enlazar migración y perfiles de personas. Estos son porcentajes por fase, no del juego completo. El avance global permanece “sin estimar” por falta de pesos globales basados en criterios verificables.
- Estado de partida: el servidor inicia/salva en esquema 59; el adaptador Offline completa los campos y eleva el guardado local a 59. `offline_seed.json` conserva el valor legado 21, se normaliza al iniciar y no debe editarse solo para cambiar ese número. Versión de cliente: Alfa 0.76. La mecánica de migración no añade campos persistentes nuevos.
- Mercado exterior de fase 33 tiene volúmenes y presupuestos finitos. La oferta cambia de acuerdo con trabajadores, precio, condición, servicios y acceso.
- Si queda demanda regional sin atender, hay una parcela comercial libre conectada, existe capital privado y reserva, el permiso cabe en caja municipal y una constructora tiene cupo y siete trabajadores, se crea una sola propuesta privada de comercio. La oferta expira a 90 días. Rechazarla no gasta fondos ni reserva parcela y activa una espera de 90 días.
- Aprobar exige el ID vigente de la oferta y la misma parcela/contratista; se cobra solo el permiso y el proyecto usa la tubería ya existente de construcción por etapas, materiales, cuadrilla e inspección. La propuesta no abre un local instantáneamente.
- Al inspeccionar una vivienda, el panel muestra residentes, edad, empleo, empleador, ingresos y posesión de vehículo si está disponible. Actores seleccionables muestran su tipo, ruta/actividad y datos de pasajeros vinculados. La densidad y cantidad visible varían según los perfiles simulados; no todos los autos ambientales tienen perfil individual.
- Las categorías de Ciudad forman una tira horizontal desplazable en móvil y escritorio. La categoría activa se lleva a vista cuando cambia el panel.
- Alfa 0.76: cada nueva mudanza agrega una persona con edad de cohorte y etapa de vida; los elegibles tienen habilidades de trabajo y pueden encontrar vacantes por el sistema existente. Al emigrar, una persona específica se elimina, ocupación/padrón quedan sincronizados y su empleo puede liberarse. Se aplica tanto al migrar como al irse y no da ingresos/empleos gratuitos.

## Verificaciones registradas para esta entrega

Estado comprobado de Alfa 0.76:

- Sintaxis de Python/JavaScript y JSON del registro: correcta. Guardados cargados Offline se elevan a esquema 59 durante la inicialización; la semilla histórica `offline_seed.json` conserva versión 21 y se normaliza al crear la partida.
- Oferta y aceptación Online: verificada, incluyendo costo de ambas cajas, siete trabajadores y rechazo de duplicado.
- Oferta y aceptación Offline: verificada en guardado de prueba al primer cierre mensual; costos $432/$3.168, siete trabajadores y propuesta causada por demanda no atendida.
- Chromium a 390×844 y 1440×900 comprobó documento sin overflow horizontal, etiquetas de la tira legibles y categorías accesibles mediante desplazamiento. La tira restaura su posición al repintarse el resumen. Captura móvil revisada.
- Python: siete llegadas con padrón/ocupación sincronizados, edad y habilidades; cinco salidas retiran perfiles y reducen población por el mismo número. Offline Chromium: siete llegadas al cierre mensual y padrón/ocupación de 627.
- El ZIP y la publicación `main` de Alfa 0.76 se verifican antes de entregar.
- LAN entre dos computadoras físicas y publicación/ejecución en Vercel: no probadas en esos entornos.

## Siguiente tarea exacta

Continuar la fase 33 con simulación reproducible de varias décadas. Hacer pruebas de al menos 30 años en ambos motores y observar si demanda finita, inversión, obras, materiales, empleo, migración con registros personales, envejecimiento, caja y elecciones forman un ciclo estable. Encontrar y corregir bucles de generación/destrucción de capital; registrar ciudades que se vacían, se estancan o crecen sin soporte. Después ampliar la propuesta privada a los tipos de empresa que realmente permitan los mercados/cadenas ya simulados y ejecutar los escenarios pequeño, metropolitano, portuario y turístico que enumera el roadmap. Hacer una sola mecánica de contenido significativa por entrega y actualizar porcentajes solo con evidencia.


### Alfa 0.77 (actual)

- La fase 33 queda al 35%: delegación municipal opcional para propuestas comerciales con tope configurable. El anfitrión aplica la política en Online; Offline sigue la misma condición. Una contratación crea proyecto estándar, descuenta permiso de la caja, inversión del capital privado y abona anticipo de contratista; asigna siete trabajadores. Online incluye el abastecimiento por materiales; Offline aún permite avanzar sin inventario y eso debe corregirse en una entrega de mecánica, no de detalle.
- Prueba comprobada Online: permiso $432, capital $3.168, anticipo $634, siete trabajadores. Tope $0 deja oferta pendiente sin crear obra. Chromium comprobó Ciudad > Puerto en móvil 390×844 y escritorio 1440×844, sin overflow horizontal ni errores JS.
- Antes de dar el sistema por verificado en Offline, reproducir la misma propuesta bajo el motor local y probar topes $0/$500. Próximo contenido: escenarios largos de la fase 33, comenzando por 30 años en los perfiles básico y metropolitano; no invertir entregas sucesivas solo en UI.
- Versión en index y notas: Alfa 0.77. Esquema persistente sigue en 59; sin migración.


### Alfa 0.78 · anterior

- Proyecto estándar registra `contractedMandate` y `contractedDay`. Gobierno muestra cartera activa, pagos/saldos municipales y privados, etapa y cuadrilla, con etiqueta de obra heredada. La instantánea de la cartera se anota en cada elección; una victoria no reinicia pagos ni proyectos.
- Online, contrato escolar heredado por $10.000, pagado $4.000 y saldo $6.000; tras la elección renovada conservó el mismo proyecto. Offline, una elección en día 1.440 renovó del mandato 2 al 3, guardó el saldo $5.885 tras el pago diario y mantuvo proyecto/etapa activos. UI revisada en Chromium 390×844 y 1440×844; sin errores JS o desborde horizontal.
- Límite: cartera cubre proyectos estándar, no centraliza contratos especiales, deuda y mantenimiento. Fase 33 al 40%; ejecutar escenarios de 30 años sigue siendo la prioridad. Esquema 59.


### Alfa 0.79 · entrega anterior: zonificación por permisos y promotores autónomos

- Cliente con herramientas residencial verde, comercial azul e industrial amarilla. Arrastrar pinta un lote de parcelas y cada franja se aplica como acción atómica al estado Online. Las zonas requieren calle adyacente, no pisan parcelas ocupadas, y pueden cambiar de color. Las parcelas no edificadas comienzan sin permiso.
- `housingDemand.unmet` conserva candidatos a migrar hasta que cada uno entra a una vivienda; empleo y capacidad de casas limitan la llegada. Las casas que termina una constructora quedan vacías hasta que el proceso de migración las ocupa.
- `advance_zoned_development` crea proyectos privados en parcelas residenciales permitidas al llegar a 12 candidatos y compra déficit de materiales a proveedores con cargo al capital privado. Requiere permiso municipal, capital restante, cuadrilla y materiales. La oferta comercial no cubierta y una parcela azul generan una inversión comercial automática con materiales pagados.
- Las fábricas de bienes básicos (parcela amarilla) son negocios privados con 20 puestos. Capacidad depende de mano de obra asignada y acceso a energía, agua y cloacas. El producto se agrega a proveedores con origen vial, inventario, precio y plazo; las tiendas lo compran por su flujo de procurement ya existente, reduciendo importación de producto terminado. Cadena de materias primas y transformación detallada sigue pendiente.
- Funciona en `server.py` y `offline.js`. Limitación conocida: las construcciones Offline no consumen materiales de obra (la ruta vieja tiene materiales en cero), aunque las obras automáticas sí aplican capital, permisos, tiempo, constructor y etapas.
- Estado actualizado al guardado esquema 60 con campos retrocompatibles `housingDemand` y `localIndustry`. Fases: 1=70%, 4=55%, 5=65%, 16=20%, 17=55%, 18=50%, 20=50%, redondeo por saltos documentados de 5 puntos. Global sigue sin estimación por falta de pesos del roadmap.
- Pruebas de esta entrega: acción HTTP de pintura en lote/recoloreo atómica; sin zona no hay casa automática; promoción residencial Online compra materiales; hogar baja demanda solo tras mudanza; fábrica Online: 16 producidas y 15 suministradas a comercios; Offline: vivienda autónoma con demanda pendiente y fábrica produce/vende 25 unidades con servicios y personal completos; Chromium 390×844 y 1440×900 sin overflow horizontal ni errores JS. Físico LAN/Vercel no probados.

**Siguiente punto exacto:** validar construcción Online hasta inspección y llegada posterior de residente; auditar el agotamiento/margen de fábrica con múltiples cierres mensuales; completar consumo de materiales de obra en Offline y probar comercio/fábrica bajo escasez y competencia; luego retomar los escenarios de 30 años de fase 33.


### Alfa 0.81 · crecimiento privado autónomo (actual)

- Se conserva el sistema de permisos verde residencial, azul comercial y amarillo industrial. El arrastre aplica el permiso a una franja de parcelas; parcelas vacías nuevas siguen sin zonificar y cambiar el color revoca el uso anterior.
- La demanda residencial queda acumulada mientras haya candidatos sin vivienda. Cada casa privada se construye en una parcela residencial conectada por calle, consume capital/permiso/materiales, usa contratista y cuadrilla, y solo descuenta demanda al llegar un hogar real.
- Fábricas privadas visibles requieren permiso industrial, cuadrilla, capital, materiales, empleo y servicios. Producen insumos con trabajadores y servicios disponibles; los comercios priorizan el proveedor local por precio y ruta, lo que reduce la compra externa. La cadena de materias primas y el agotamiento de insumos aún no están simulados.
- Disponible en Online y Offline; guardado esquema 60. La limitación Offline de consumo de materiales en obras generales sigue abierta.
- **Siguiente punto exacto:** probar la secuencia Online hasta inspección y llegada de residente y los ciclos mensuales de fábrica con competencia/escasez; cerrar consumo de materiales en obras Offline; después retomar pruebas de 30 años de fase 33.

### Alfa 0.81 · promotores autónomos y equipo abierto (actual)

- El usuario pidió que no tenga que construir viviendas, mercados o fábricas manualmente. Las parcelas pintadas habilitan a promotores privados; sus obras comienzan automáticamente cuando hay demanda, empleo o escasez comercial y se encuentran permisos, capital privado, contratista, cuadrilla, acceso y recursos. La pintura no produce edificios instantáneos. Los servicios públicos e infraestructura siguen en manos de jugadores.
- Se agregó activación de nuevas tiendas por demanda doméstica local además de ventas regionales; la industria puede iniciar automáticamente cuando comercios activos ya venden o compran insumos. Offline mantiene su limitación conocida de no consumir materiales en obras.
- La instrucción explícita del usuario es que todos los jugadores invitados puedan hacer todo. Las carteras municipales son rótulos voluntarios, se pueden reasignar y no autorizan ni bloquean acciones.
- Revisar y ejecutar escenarios para verificar inicio residencial/comercial/industrial en ambos motores, condiciones de capital/cuadrillas y demanda. La UI de parcela requiere comprobación responsive.
- El progreso global no puede estimarse con rigor: el roadmap no asigna pesos entre sus 34 fases. Avances por fase estables: 1=70, 4=60, 5=70, 16=20, 17=60, 18=55, 20=55, redondeados a múltiplos de 5.


### Alfa 0.82 · cadena regional de alimentos (actual)

La procesadora compra grano finito a una cooperativa regional, paga con caja empresarial, espera preparación y ruta vial, produce solo con insumo real y vende stock de alimentos a comercios por el mercado existente. La ficha informa pedidos, inventario, faltantes y ventas; los camiones 3D pueden seleccionarse. Verificado Online y Offline con llegadas y producción.

**Próximo punto:** implementar las cadenas áridos→hormigón→obra y madera→aserradero→materiales, y hacer que el abastecimiento de fábricas compita por cuotas bajo escasez. Después avanzar fase 19 (licitaciones y dirección de obras); continuar gobierno electoral del hito E más adelante. Conservar las acciones abiertas a invitados y documentar las diferencias Offline conocidas. El global continúa no estimable sin pesos de fase.


### Alfa 0.83 · cumplimiento contractual con efecto real (actual)

Fase 19: el riesgo de demora ya afecta calendario y avance en Online/Offline. `assess_contract_delay()` en `server.py` y `assessOfflineContractDelay()` en `offline.js` revisan ciclos de 30 días. La probabilidad depende de confiabilidad y saturación de capacidad; el resultado es reproducible por coordenadas/ciclo/empresa. La obra guarda `lastRiskReviewCycle`, `delayDays` y `lastDelayReason`; la tarjeta de obra los muestra. Mantener ambas fórmulas iguales al modificarlas y probar un caso de demora y otro sin demora. No hay multas, orden de cambio ni reclamos todavía. Siguiente: agregar pagos por hitos físicos y retenciones o la garantía técnica; evitar ampliar detalle visual aislado.


### Alfa 0.84 · pago por certificado de etapa (actual)

Fase 19 suma pagos por hitos físicos en `server.py` y `offline.js`: anticipo del 20%, 80% dividido por etapas; sin avance de caja entre hitos. `certificationHistory` guarda los hitos y `paid` el acumulado. El control de tesorería ocurre antes de consumir insumos/avanzar. Tarjeta Obras muestra hitos y pagos. Evitar duplicar certificados en guardados heredados: el hito inicial deriva del progreso anterior si falta el campo. La prueba cubrió caja insuficiente y el ciclo completo. Próximo avance de fase 19: retención final con período de garantía y reparación/reclamo atribuible a calidad; preservar presupuesto reservado y responsabilidades del contratista al diseñarlo.


### Alfa 0.85 · garantías de obra (actual)

Online/Offline: los contratos públicos nuevos retienen 10% en escrow y siguen pagando 20% de anticipo más 70% por hitos. Exigir el saldo del certificado y el fondo de garantía de forma atómica antes del último avance. Guardados previos (sin `retentionPct`) y proyectos privados mantienen 0% de retención. `contractGuarantees` persiste recepción provisional, revisión día +30, contratista, riesgo congelado, defecto, reclamo y reparación. Una falla reduce 12 puntos de calidad. Acción `repairContractGuarantee` compromete tres trabajadores durante cinco días; al cumplirse restaura calidad y paga escrow una sola vez. `release_notes.json` reporta fase 19 = 45%; global continúa nulo/no estimable.

Verificado: Python expuso certificado final de 90%, reclamo, reparación y pago idempotente. Chromium Offline completó obra nueva con retención $100 y suspendió obra con caja insuficiente sin avanzar. La acción de reclamo creó plazo de cinco días. Obras se revisó en viewports móvil/escritorio sin overflow horizontal y con tarjeta legible. Probado también: una garantía defectuosa quedó en reclamo con calidad −12; tras cinco días asignados restauró calidad y liberó $100 una sola vez. Siguen pendientes disputa/orden de cambio, LAN física y Vercel.


### Alfa 0.86 · órdenes de cambio (actual)

La incidencia se revisa una vez por obra pública al alcanzar 20%; está persistida por `changeOrderReviewed`. El status `cambio_pendiente` pausa la cuadrilla. Resolver con `approveContractChange` o `rejectContractChange`: aprobar verifica caja después de compromisos, añade costo y plazo conservando progreso, rechazar aplica `qualityPenalty`; las decisiones se guardan en `contractChangeHistory`. Mantener el roll Python/JS idéntico. Pruebas incluidas: HTTP de aprobación/rechazo/fondos insuficientes/duplicado; Chromium Offline de aprobación persistente. Fase 19 = 50%. Próximo sistema amplio: completar cadena áridos-hormigón en fase 18.

### Alfa 0.87 · cantera de áridos (actual)

Cambios Online en `server.py`/`game.js`: primer factory conserva procesado de alimentos; el siguiente factory terminado toma `industryType: quarry`. `advance_local_quarries` produce en ciclo mensual a partir del personal efectivamente asignado y el menor factor electricidad/agua/saneamiento, con reserva finita y stock de proveedor 360. `orderMaterials` para `Cantera local` sale desde la coordenada física de planta, usa ruta, tráfico, descarga, caja del contratista; la empresa recibe venta y reduce `aggregateStock`. Los proveedores regionales siguen como sustitutos. `localIndustry.materialProduced/materialSold` guarda el balance agregado. Ver pruebas HTTP/API y Chromium documentadas en `ESTADO_DESARROLLO.md`. La oferta de materiales no funciona aún Offline porque ese adaptador no tiene órdenes; no copiar el botón Online sin implementar su ciclo completo. Próximo sistema: hormigonera local que convierta áridos y venda hormigón que consuma la obra. Fase 18=65%; global null.

**Notas para retomar Alfa 0.87:** el capital operativo de la cantera se reserva desde capital privado en ambos contratos industriales: $4.200, no se debe inicializar un saldo libre mayor al fondo comprometido. La capacidad útil es `min(48, round(personal*1,5*servicios))`; separá capacidad potencial de salida efectiva para que faltas de red/personal aparezcan como faltantes y causa, no como producción cero sin explicación. La compra local cuesta $28,88 por unidad antes de flete (por diez unidades, $289), el ingreso va a la firma y las rutas guardan `source=[x,y]`; el tick de reparto respeta ese origen. Testear fondos insuficientes sin debitar, stock agotado, calle cortada, patio lleno, descargador ocupado e insolvencia antes de dar fase 18 por cerrada. No llamar completa la cadena: todavía no hay hormigonera ni consumo de hormigón en obra. Cambios recientes pendientes de publicar en esta sesión: rama `main`, Alfa 0.87. El ZIP debe incluir esta guía.


### Alfa 0.88 · hormigonera (histórico)

Online en `server.py` y Economía en `game.js`. Orden de especialidad para nuevas fábricas privadas: alimentos → cantera → hormigonera → alimentos. La planta vive en `business.industryType="concrete"`; `advance_local_concrete_plants(workplaces, employees)` opera en el ciclo mensual, gasta nómina/costo mensual, escala con trabajadores y mínimo de electricidad/agua/saneamiento, usa patio local de 240 hormigones y mantiene `concreteStock` sincronizado con el proveedor. Compra áridos desde `Cantera local`, limita por stock, reserva/caja, paga al productor, guarda `source`, ruta y fecha de recepción; `process_market_orders()` deposita el insumo cuando llega. Regla 2:1; `settle_concrete_sale()` reduce el inventario de firmas y les paga. Las recetas en `MATERIAL_NEEDS` tienen nueva clave `concrete`; cambiar recetas conserva demanda total aproximada de agregado+concreto. `ensure_supply_state()` migra stocks viejos con cero. Compras de obra usan el endpoint existente `orderMaterials`; agrega proveedores locales y origen real de planta.

Verificado local: 30 áridos producidos/trasladados, entrega por carretera de 4 tramos, 15 hormigones producidos, pago correcto por 3 unidades, casa demanda 7 y migración. Popup de Economía probado en 390×844 / 1440×900. La acción HTTP `orderMaterials` ya vende desde Hormigonera local y rechaza un pedido mayor al stock sin débito; `missing_materials` detecta el bloqueo de concreto por etapa. Queda probar una obra/tick end-to-end que se detenga, reciba el camión y reanude; implementar Offline completo (actualmente el adaptador no ofrece stock/pedido de obra); probar descuentos/ruta/insolvencia de planta; seguir con madera/acero, no quedarse puliendo detalles. No declarar probado en Vercel ni LAN físico. Fase 18=70%; global null. Referencias: `ESTADO_DESARROLLO.md`, `DECISIONES_TECNICAS.md`, `SIGUIENTE_ENTREGA.md`, `AUDITORIA_ROADMAP.md`.


### Alfa 0.89 · compras y materiales de obra Offline (histórico)

`offline.js` ya da paridad básica para materiales de construcción: migración de todas las existencias heredadas, inventarios por proveedor/contratista/depósito, costos unitarios y producción/reposición mensual finita, compra accionada desde Obras, caja de contratista, capacidad por destino, ruta vial, ETA, recepción y consumo por etapa. La obra se suspende si falta el siguiente lote y el bucle vuelve a intentar al recibir existencias. Las viviendas y comercios autónomos financian materiales antes de cargar permiso/proyecto, en vez de aparecer gratis. `game.js` expone Pedir materiales también Offline; `style.css` mantiene la confirmación sticky en modal largo móvil/escritorio. Verificado con Chromium: orden de 6 hormigones, pago $372, entrega y uso en una calle de prueba; modal 390×844 y 1440×900, sin errores JS, botón visible. Node syntax/diff checks pasan.

**No declarar verificado:** el escenario específico suspensión por escasez → entrega → reanudación en ambos motores aún no se ha cubierto deliberadamente; no se probó conexión LAN física ni Vercel. Siguiente: agregar el test de tick/continuación en Online y Offline; después producir madera en aserradero y acero en una cadena industrial, con insumo finito, puestos/servicios, logística real, ventas a constructoras y receta visible. Evitar reducir caja privada por debajo de cero al sumar materiales; `offlinePrivateMaterialCost()` participa en las comprobaciones de capital de promoción. Actualizar roadmap JSON y guía al cierre. Fase 18=75%, global sigue no estimable: las 34 fases no tienen un peso comparable auditado.


### Alfa 0.90 · aserradero y madera local (actual)

La fase 18 ahora incluye un `sawmill` tras la cantera/hormigonera en Online. `advance_local_sawmills()` integra nómina, costos, límite de servicios, reserva forestal/regeneración, capacidad y stock; madera sale como `Aserradero local`, ordenable en obras desde el origen real, con pago e inventario sincronizados. La segunda fábrica Offline se especializa en aserradero; la producción mensual usa puestos, servicios, reserva y capacidad, y la venta local acredita caja del negocio. `game.js` muestra stock, reserva, producción y estado en Economía. Cambiar de proveedor actualiza la sugerencia de materiales a lo que tiene ese proveedor, evitando intentar pedir áridos/hormigón cuando se eligió madera local.

Verificado: test de motor Online produjo 25 tablas usando 50 troncos y pagó $690 por venta de 10; Chromium Offline pidió 4 tablas desde el aserradero, pagó $276, redujo inventarios y acreditó al negocio; panel Economía en 390×844/1440×900 sin overflow ni errores. `python -m py_compile server.py`, `node --check` y JSON validan. No declarar completa la fábrica por menú; falta flujo UI de obra industrial y prueba de producción offline con trabajadores asignados. Siguiente: testear obra suspendida al faltar madera y retoma tras entrega, y luego añadir cadena de acero/importaciones realistas. Hacer contenido nuevo, evitar pulido aislado. Fase18=80%; progreso global sigue no estimable sin peso común auditable para 34 fases.

## Alfa 0.91 · continuación de la cadena industrial

La metalúrgica implementa acero regional → componentes de construcción: `industryType=metalworks`, proveedor `Metalúrgica local`, orden industrial de acero desde Corralón con ruta/ETA, inventario de materia prima y producción condicionada por personal, servicios, caja y espacio. `settle_metalworks_sale` reduce stock privado y acredita la firma en Online; Offline usa `advanceOfflineMetalworks`, entrega vial y venta al pedir materiales. El orden industrial objetivo queda alimentos → cantera → hormigonera → aserradero → metalúrgica. El próximo trabajo debe verificar una obra suspendida por escasez de componentes, pedir a la metalúrgica, recibir, reanudar y no duplicar inventario/pago en ambos motores. Revisar tarjeta Economía en Chromium (390×844, 1440×900), actualizar progreso y registrar prueba real. No gastar otra entrega en detalles de cantera ni atribuir pruebas LAN/Vercel que no se hayan hecho.


## Alfa 0.92 · paridad industrial y regresiones (actual)

El mercado mensual Offline ya excluye cantera, hormigonera, aserradero y metalúrgica de la producción de alimentos, como Online. La misma planta no debe registrar una segunda nómina ni producir stock alimentario ficticio. Se agregaron pruebas automatizadas que fuerzan una obra a suspenderse por componentes, encargar a una metalúrgica local, esperar camión/descarga, recibir y consumir el material una sola vez, inspeccionar la obra y no duplicar el pago. Un test adicional verifica que la metalúrgica no aparece como procesadora alimentaria. En el workflow de GitHub Actions se completaron con éxito sintaxis/JSON y los tests Online/Offline (run 41260659327).

Fase 18 permanece al 85%; avance global sin estimación. No se hizo prueba LAN física, Vercel ni visual con Chromium en esta entrega. Estas pruebas usan una fábrica y una obra controladas, no acreditan todo el ciclo de permiso, obra industrial y habilitación.

**Próxima tarea:** comprobar la cadena completa de metalúrgica nacida de un permiso y contratista, luego inspección, puestos, servicios, acero regional, producción real, pedido y consumo por una obra. Revisar y corregir diferencias de secuencia de especialidades industriales Online/Offline. Luego escasez entre meses y escenarios de 30 años.


## Alfa 0.93 · cantera → hormigón también Offline (actual)

Se implementaron las dos especialidades industriales que faltaban en Offline: cantera con reserva geológica finita, trabajadores, servicios, costos y stock; hormigonera con compra de áridos reales a cantera por ruta, costo contra caja privada, pedido industrial, entrega diferida y receta de conversión 2:1. El hormigón producido se ofrece como proveedor local a la construcción y el cobro acredita a la planta; compras desde Obras usan la posición real del proveedor. La simulación mensual ahora procesa cantera → hormigonera → aserradero → metalúrgica, y el mercado de alimentos excluye estas cuatro ramas.

La especialidad `industryType` se fija **al contratar** una fábrica, también cuando la construye automáticamente un promotor. Online y Offline consideran fábricas activas y proyectos ya adjudicados para escoger alimento, cantera, hormigonera, aserradero o metalúrgica, evitando que dos contratos simultáneos cambien de destino al abrir. La fábrica nueva reserva $4.200 de caja privada. En Online ya se aplicaba este descuento al contratar; Offline manual ahora lo paga y la caja al habilitar procede de la reserva. Los proyectos legados sin `industryType` conservan fallback.

Pruebas nuevas: Python verifica reserva de especialidades, extracción, compra vial, entrega y producción 2:1; Node verifica contratación de tres plantas con capital privado, producción con residentes empleados, abastecimiento y conversión real en la segunda mensualidad. Regresiones anteriores de obra con componentes siguen activas. La suite de Chromium en GitHub Actions verifica 390×844 y 1440×900, sin sustituir prueba LAN física/Vercel. Fase 18=90%; global no estimado.

**Siguiente tarea:** ampliar fase 17 con competencia y reasignación de trabajadores bajo insolvencia industrial, órdenes y proveedores ante precios rivales, recuperación/reutilización de plantas cerradas; después ensayar escasez/contratos con décadas en los cuatro perfiles de fase 33. Evitar gastar versiones en retoques de tarjetas. Verificar la ejecución más reciente del workflow y su ZIP.


## Alfa 0.94 · recuperación autónoma de plantas privadas (actual)

Nueva mecánica de fase 17 en Online/Offline: al cerrar por insolvencia una fábrica especializada se marca fecha de quiebra y su inventario vendible sale del proveedor; deja de ofrecer los 20 puestos. Un empresario puede recuperar ese edificio a partir de 90 días cerrado si mantiene zonificación industrial, hay demanda de proyectos/comercios, calle accesible, electricidad/agua/saneamiento >=65%, capital privado y cupo de constructor con cinco trabajadores. Se reserva una inversión privada real de $5.300: $4.200 se mantienen como caja inicial del nuevo operador, $900 van a la empresa de obra, $200 se cobran como permiso. Durante siete días la planta sigue cerrada y ocupa la cuadrilla; si la inspección final falla por acceso o servicios, no reabre hasta resolver la causa. Al aprobarse se crea nueva firma con identidad y caja distintas, 20 puestos por cubrir, sin inventar producto ni restaurar reservas geológicas agotadas. Se conserva historial y causa legibles desde Economía/ficha de planta. Las nuevas órdenes no recuperan insumos del titular anterior.

Pruebas automáticas: `tests/test_industrial_recovery_online.py` (demanda, capital, cupo, tiempo, bloqueo e idempotencia), `tests/test_industrial_recovery_offline.mjs` (espera, capital, puesto nuevo, identidad y ausencia de inversión sin demanda). La validación móvil 390×844 y escritorio 1440×900 cubre Economía y el popup. Fase 17=65%, fase 18=90%; global sigue no estimado.

**Siguiente punto:** competencia entre múltiples proveedores industriales, contratos reales de exportación/compra en almacenes y ajuste de empleo a demanda; después simulaciones de 30 años en los perfiles pequeño, metropolitano, portuario y turístico del hito F. No hacer entregas para detalles aislados. LAN física/Vercel no probados; actualizar estado después de ver resultados CI reales.


## Alfa 0.95 · competencia material real (actual)

Se entregó un mercado competitivo de insumos industriales en Online/Offline. Una categoría local (Cantera local, Hormigonera local, Aserradero local, Metalúrgica local) puede incluir varias instalaciones abiertas y conectadas: la obra elige la fábrica individual con un lote completo y menor costo de mercadería + flete vial. Las órdenes registran `vendorId`, `vendorName`, `source`, `route`, `productCost`, `freight` y `quotedFactor`. El vendedor pierde físicamente su inventario y gana exactamente el valor de producto; el costo logístico entra en `supply.logisticsCash` sin crear doble pago. No se permite combinar dos inventarios parciales en un solo camión. La hormigonera compra sus áridos a la cantera mejor cotizada con ruta y caja disponibles; ya no mezcla ruta de una planta con mercadería de otra. `materialPriceFactor` se adapta cada mes a ventas realmente acumuladas (`industrialSalesSincePricing`) y stock inmóvil, acotado entre 0.8 y 1.35 de la base.

Economía muestra por planta el stock, la tarifa industrial y las ventas; el pedido advierte que la oferta agrupada no equivale a un lote único y limita la cantidad sugerida a la existencia máxima en una planta. Se agregaron tests `test_industrial_competition_online.py` y `test_industrial_competition_offline.mjs`, e inyección de dos rivales para validar la UI en 390×844 y 1440×900 con Chromium. Las compras automáticas de materiales de promotores privadas anteriores siguen usando una selección y entrega simplificadas: convertir esas compras en órdenes con rutas y competencia es un próximo objetivo, no declararlo completado.

**Siguiente mecánica prioritaria:** contratos comerciales a plazo entre privados y compras de promotores con transporte real, y sistema de expansión/reducción de plantillas por rentabilidad. Después probar la fase 33 en partidas de 30 años. Mantener 17=70%, 18=90% y global no estimado. LAN física y Vercel no probados en esta entrega.


## Alfa 0.96 · logística de promotores + empleo adaptable (actual)

La fase 17 incorporó dos sistemas jugables en ambos motores:

**Construcción privada sin materiales ficticios.** `advance_zoned_development` Online cotiza `plan_private_construction_deliveries` y contrata `commit_private_construction_deliveries`; en Offline `fundOfflinePrivateMaterials` genera órdenes de transporte, no inyecta stock al contratista. Las compras cuentan contra `privateCapital` y se materializan en `supply.orders` con ruta, día de preparación, comprador, vendedor individual de industria cuando existe, destino, flete y costo del producto. Se valida capacidad libre real, incluso reservas de pedidos en tránsito; el almacén destino debe estar conectado también a la obra. El inventario vendedor baja al adjudicar, pero el de la constructora no crece hasta la descarga. Una compra a fábrica local acredita su propia caja y separa el flete en logística. Si no hay lote entero, ruta, espacio o capital, el proyecto autónomo no inicia. También quedan cubiertas las obras comerciales delegadas Offline. Guardados existentes siguen disponibles, pues las nuevas propiedades son opcionales.

**Empleo privado adaptable.** Después de liquidar actividad y salarios, `rebalance_private_staffing` / `rebalanceOfflinePrivateStaffing` evalúan pedidos/ventas, inventario, caja, beneficio y plazas realmente ocupadas. Abren una vacante con equipamiento comprado a proveedor regional ($150 comercio, $240 industria) o, tras dos cierres malos de demanda, reducen hasta dos. Los residentes efectivamente excedentes se desasignan por su identidad y buscan trabajo; el total de vacantes se ajusta sin emitir puestos mágicos. La metalúrgica mejora su capacidad instalada si tiene vacantes nuevas ocupadas. Hay tests Online para expansión, despidos y ventas industriales no reutilizadas; en Offline se prueba baja real de vacantes industriales. La modelización de convenios, alquileres empresariales y expansiones de instalaciones físicas sigue pendiente.

**Pruebas:** `tests/test_private_construction_supply_online.py`, `tests/test_private_construction_supply_offline.mjs`, `tests/test_private_staffing_online.py` y `tests/test_private_staffing_offline.mjs`; se mantienen las regresiones anteriores y Chromium móvil/escritorio. Fase 17=75%, 18=90%, global no estimable. Próxima tarea: contratos a plazo y reservas entre privados, competencia minorista/rentas, luego partidas de treinta años. No dedicar versiones a cosmética. LAN física y Vercel pendientes.


## Alfa 0.97 · contratos privados cantera → hormigonera (actual)

La fase 17 incorpora negociación y ejecución de acuerdos privados a plazo para áridos, Online y Offline: `sign_aggregate_forward_contract` / `signOfflineAggregateForwardContract` seleccionan una cantera individual con producción real, almacén, vía conectada, precio y comprador solvente. La firma reserva stock del vendedor y del proveedor agregado sin aumentar stock comprador; el capital se retira de su `business.cash` a `supply.tradeContracts[*].escrow`, sin ingreso inmediato de venta. En cantidades de nueve o más áridos hay tres remesas semanales, cada una en `supply.marketOrders` con preparación, ruta, plazo contractual, cantidad, precio y flete. El procesamiento diario autoriza entrega real tras el trayecto y liquida solo esa remesa: dinero al vendedor, flete a logística, material a inventario físico de hormigonera. Si el comprador cierra o se supera plazo, se cancela la remesa pendiente, se devuelve su pago y se recupera mercancía en cantera todavía abierta; con firma desaparecida se registra pérdida explícita, sin fabricar existencias. Cada línea se liquida una sola vez con `contractSettled`; el contrato termina `cumplido` o `incumplido` y conserva su cierre.

Se agregó visibilidad en Economía para los contratos activos/incumplidos y remesas recibidas, importe pagado, devuelto y saldo en custodia; visual verificado en resoluciones 390×844 y 1440×900 por Chromium en CI. Nuevos tests `tests/test_forward_contracts_online.py` y `tests/test_forward_contracts_offline.mjs` cubren reserva y cobro al llegar, corte vial y devoluciones, insolvencia de comprador y falta de capital. Tests previos de cantera→hormigonera fueron adaptados a tres remesas y objetivos de compra condicionados a plantilla.

**Siguiente mecánica:** ampliar acuerdos de suministro con reserva y custodia a otras industrias y clientes, penalizaciones económicas y negociación de vencimientos; después stress real de 30 años bajo cuatro perfiles (fase 33). Fase 17=80%, 18=90%, total global no estimable. LAN física y Vercel pendientes; no declarar equivalencia entre pruebas automáticas y validación de red real.

## Alfa 0.98 · prórroga privada ante interrupción vial (actual)

Los contratos cantera→hormigonera permiten la acción `renegotiateTradeContract` desde Economía si existen remesas vigentes detenidas por ausencia real de ruta. Ambas empresas deben operar y la compradora abona al proveedor una compensación del 5% del valor original (mínimo $20). El pago va de caja privada a caja privada, fuera del escrow. Solo los plazos de remesas pendientes crecen 14 días; no cambia material reservado, pagos ya liquidados ni inventarios. Se registran `renegotiatedDay`, `extensionDays` y `extensionFeePaid`; una segunda prórroga se rechaza.

Hay regresiones Online/Offline de caja, inventario, extensión y entrega tras el vencimiento original; la revisión Chromium está incluida en CI. Fases 17=80% y 18=90%; global sin estimar. **Siguiente sistema:** contratos con reserva y custodia en otras cadenas B2B y compradores, competencia comercial y partidas de 30 años bajo cuatro perfiles. LAN física y Vercel no verificados.


## Continuación · incumplimiento económico B2B

Los contratos de áridos entre cantera y hormigonera ahora penalizan una remesa vencida mientras ambas firmas siguen abiertas: el proveedor transfiere al comprador hasta un 5% del producto no entregado, limitado por su caja. La devolución del depósito permanece separada de esta indemnización; `defaultPenaltyPaid` se registra por remesa y contrato y la liquidación idempotente evita cobros repetidos. Misma regla en Online y Offline. Pruebas específicas de vencimiento incorporadas; comprobar CI. Próximo: ampliar contratos a otras cadenas y escenarios de 30 años. Porcentajes sin cambios; LAN/Vercel pendientes.


## Continuación · quiebra del proveedor en contrato B2B

Si una cantera proveedora cierra mientras mantiene remesas reservadas para una hormigonera, el procesador diario Online/Offline cancela todas las pendientes de inmediato, sin esperar al vencimiento. Restituye desde escrow el importe pagado por cada remesa al comprador y anota `lostReservedUnits` si el inventario del proveedor insolvente no se puede recuperar. Una línea `contractSettled` no se liquida dos veces. La causa `Proveedor insolvente` permanece en las órdenes y el contrato termina incumplido. La multa por plazo vencido no se cobra a una firma ya cerrada. Pruebas para ambos motores añadidas; validar CI. No hubo modificaciones visuales. Fases y estimación global sin cambios. Siguiente contenido: acuerdos de otras cadenas B2B y simulaciones de décadas.


## Continuación · competencia minorista adaptativa

Nueva mecánica de fase 17 en ambos motores: tras las ventas mensuales los comercios ajustan su precio hasta un peso por mes en respuesta al volumen vendido, inventario, demanda y beneficio reales. Con ventas suficientes y existencias bajas pero no agotadas pueden subir; con stock inmóvil o margen negativo bajan. Banda inicial $8–$36. Los compradores ya ponderan precio y distancia en el siguiente período, por lo que la decisión modifica competencia y caja futura, pero no crea dinero inmediatamente. Cada empresa registra `lastPriceChangeDay` y `lastPriceCause`; hay eventos verificables. Pruebas unitarias Online agregadas; validar integración Offline y resultados CI antes de dar por probada esa ruta. Interfaz no modificada; porcentajes sin cambios. Próximo: contratos entre otras cadenas y campañas de 30 años.


## Continuación · alquiler comercial operativo

Comercios abiertos asumen una renta mensual según localización y `monthlyRent` opcional; el costo reduce caja/beneficio y puede llevar a cierre por insolvencia. Los pagos efectivamente cubiertos quedan en `supply.propertyRentalCash` como recaudación de propietarios, no ingreso del municipio ni capital generado. Se implementó en Online y Offline sin modificar UI; Online eliminó además el ajuste minorista anterior duplicado para mantener una sola decisión de precios por cierre. Pendiente validar resultados de CI y ajustar pruebas de rentas en escenarios largos. Fases sin cambiar; próximo sistema: contratos B2B ampliados y escenarios de 30 años.


## Continuación · mercado regional de acero y pruebas

El Corralón del Puerto aplica cotización por existencias al abastecer metalúrgicas: multiplicador 1,5 bajo 20 unidades, 1,25 bajo 60 y 1 desde 60. Online/Offline calculan costo antes de reservar lote y deducen efectivo y acero físico; la producción posterior aún requiere llegada por carretera, trabajadores y servicios. Se registra `lastSteelPriceFactor` en el proveedor; tests nuevos Online miden precio, caja y stock. No se alteró la interfaz. Se revisaron dos fallos de CI previos: vencimientos escalonados del test Offline y remesa ficticia desconectada del test responsive. Revalidar ejecución CI; porcentajes sin cambios. Próximo: completar contratos entre otras materias primas y pruebas de décadas.


## Continuación · accesibilidad comercial real en Offline

La asignación de demanda minorista de hogares utiliza ahora `offlineRoadRoute`, con conectividad y calidad vial, en lugar de una distancia Manhattan que admitía compras a través de barrios incomunicados. Solo comercios alcanzables compiten por precio y distancia efectiva de ruta; un corte puede suprimir ventas, ingresos y, en cierres posteriores, provocar reducción de empleos o insolvencia. Online ya exigía `route_between` y conserva la misma condición. Nueva regresión Node compara demanda con calles conectadas frente a una red completamente retirada, incluida en CI. No hubo cambio de interfaz. Siguiente tarea: escenarios largos de fase 33 y contratos B2B restantes; no aumentar porcentajes sin resultados CI.


## Continuación · negociación automática de alquileres comerciales

Los comercios privados abiertos renegocian la renta mensual en los dos motores antes de liquidar ventas: con demanda efectivamente atendida y beneficios suficientes sube $5 hasta $180; con hasta dos ventas y pérdidas cae $5 hasta $30. No mueve dinero al renegociar; la renta efectiva sigue pagándose mediante el costo operativo existente y las entradas en `supply.propertyRentalCash`. Persisten `monthlyRent`, `lastLeaseReviewDay` y `lastLeaseCause`, sin migración obligatoria. La ubicación conserva el precio inicial. Se agregó prueba Online y se mantiene pendiente comprobar CI para integración Offline. Sin modificación de interfaz ni porcentajes. Próximo: contratos industriales adicionales y escenarios de 30 años.


## Continuación · reserva regional finita de acero

La reposición mensual de acero de los tres proveedores regionales consume ahora `supply.regionalSteelReserve` (reserva inicial de 30.000 unidades en partidas que aún no tienen ese campo), tanto en Online como Offline. Cuando se agota el mineral, la región deja de reponer acero sin materia prima; el stock ya producido sigue existiendo y puede circular por las órdenes tradicionales. La distribución por proveedor respeta el orden previo y el límite de reservas. La cadena metalúrgica queda afectada por escasez estructural durante partidas de décadas, además de la variación de precio que ya dependía del stock. Se agregó regresión Python para reserva cero; integración CI pendiente. Interfaz sin cambios, porcentajes por fase sin modificar. Prioridad siguiente: recuperación de reservas mediante reciclado/importaciones bajo costo físico y simulaciones 30 años para comprobar balance.


## Continuación · recuperación de acero desde chatarra municipal

El sistema de residuos acumula `waste.scrapSteelTons` a razón de 0,2 toneladas de chatarra separable por tonelada reciclada efectivamente. Cada cierre mensual, ambos motores pueden transformar hasta dos unidades de acero por tonelada de chatarra a costo municipal de $12 por unidad, solo con caja disponible y espacio en el stock del Corralón del Puerto. Se descuentan la masa recuperada y el dinero, se agrega acero físico al proveedor y se registra `supply.steelRecyclingSpend`. Esta fuente de acero complementa la reserva regional finita y puede sostener industria durante partidas largas sin recursos mágicos; sin plantas de reciclaje y recolección no hay insumo nuevo. Prueba económica Online incorporada; CI pendiente. Interfaz sin modificaciones. Prioridad posterior: comprobación 30 años y contratos industriales adicionales.


## Continuación · abastecimiento marítimo de acero

El stock del Corralón del Puerto por debajo de 30 unidades permite una compra marítima extraordinaria de hasta 60 unidades por mes **solo si existe un puerto operativo con ruta hasta el depósito**. Cada unidad importada cuesta $280 municipales (divisas y flete); se descuentan fondos efectivos y se registran `supply.steelImportSpend` y `supply.steelImportedUnits`. El acero físico aparece en el proveedor regional, donde las metalúrgicas deben comprarlo y recibirlo mediante su logística ordinaria. No se utiliza la reserva mineral regional ni se duplica chatarra. Implementado Online/Offline; nueva regresión Python de importación. Validar CI. Interfaz intacta. Siguiente: escenarios largos de fase 33 y control de balances.


## Continuación · límite logístico a importaciones de acero

El acero marítimo requiere ahora capacidad física adicional del puerto: el lote mensual está limitado por `shipCapacity` y por el espacio libre `cargoCapacity - cargoStored`, además de stock, fondos y conectividad. Se agrega capacidad de puertos operativos conectados; sin espacio portuario no hay importación. Online y Offline implementados, prueba de límite de 4 unidades incorporada. Se corrigió el día de cierre mensual en dos regresiones Online y se amplió el diagnóstico del test responsive, que aún se investiga; no afirmar CI aprobado hasta verificarlo. Sin modificaciones de interfaz. Siguiente prioridad: ensayos largos de 30 años e integración con el transporte portuario.


## Continuación · prospección siderúrgica finita

El capital privado puede financiar prospección de mineral de hierro cuando la reserva regional operativa cae por debajo de 900 unidades: cada campaña cuesta $4500 y acredita 300 unidades desde `supply.unexploredSteelOre`, un yacimiento restante que inicialmente dispone de 12000 unidades, sin creación infinita de recursos. Se contabiliza `geologicalExplorationSpend`; el nuevo mineral se usa en reposiciones mensuales posteriores. Online y Offline implementados; prueba Online de caja y conservación agregada. El CI anterior confirmó el motor pero falló la comprobación responsive de la prórroga de contratos, pendiente de corregir. No hubo cambios de interfaz. Prioridad próxima: validación larga de 30 años y reparación del escenario UI.


## Continuación · stress mensual de 30 años por cuatro perfiles

Agregado `tests/stress_30_years.py`: ejecutable manualmente mediante `python tests/stress_30_years.py`, recorre 360 cierres mensuales para pueblo, metrópolis, puerto y ciudad turística, con capital/población/reservas distintos. Controla no negatividad de mineral, chatarra y stock siderúrgico, además de ausencia de NaN en caja privada. Se trata de una **prueba de cierres mensuales con salto de días**, no una simulación íntegra de 10.950 ticks diarios ni verificación de transporte LAN. Falta ejecutar y validar resultados, expandir métricas anuales y cubrir tráficos portuarios. También se agregó espera del panel contractual al test responsive anterior; no darlo por resuelto sin CI. Interfaz sin cambios.


## Continuación · estrés 30 años integrado a CI

`validation.yml` ejecuta `python tests/stress_30_years.py` en cada push a main, tras las regresiones de motores: cuatro perfiles y 360 cierres mensuales por perfil con controles de inventario siderúrgico, reservas, chatarra, caja municipal, capital privado y gasto de importación/prospección/reciclaje. Este test automatizado no reemplaza 10.950 ticks diarios completos ni valida LAN real. No se modificó la interfaz. Confirmar resultado del último workflow, resolver el fallo responsive de botón de prórroga y continuar con mecanismos jugables pendientes.


## Continuación · viajes marítimos reales de acero

Las compras extraordinarias de acero ya no acreditan metal instantáneamente. Online/Offline descuentan el costo de importación al contratar, crean `supply.steelShipments` con puerto, cantidad, fecha y estado `en viaje`, y completan descarga no antes de 12 días. El puerto debe permanecer operativo y conectado al Corralón del Puerto; si se corta la conexión, el lote queda esperando sin duplicar stock ni repetir gastos. La reserva de capacidad y límite comercial descuentan cargamentos en tránsito. `steelImportedUnits` solo aumenta tras recepción. Se amplió regresión Online para verificar demora, llegada y ausencia de doble recepción. Interfaz no modificada. Siguiente: validar CI y corregir fallo responsive previo.


## Continuación · descarga portuaria parcial

Los embarques de acero importado ahora descargan hasta `unloadingCapacity` unidades por día (20 por defecto), con `deliveredUnits`, `lastUnloadedDay` y estado `descarga parcial` mientras quede carga. El Corralón recibe únicamente las unidades efectivamente descargadas. Cortes viales y puerto inhabilitado detienen la descarga; queda prohibida una segunda descarga el mismo día. Las unidades pendientes siguen contando como importación en tránsito para evitar pedidos superpuestos. Implementado Online/Offline y nueva prueba de tres días para un lote de 20 unidades con descarga diaria de 7. Pendiente CI. Sin cambios de interfaz.

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

## Convención invariable de versiones (decisión del usuario)

El juego mantiene la serie **Alfa 0.N**, con N entero decimal que puede tener tantos dígitos como sea necesario. **NO** saltar a `1.0`, `1.00` ni `1.01`. Secuencia oficial: `0.98 → 0.99 → 0.100 → 0.101 → 0.102 → ... → 0.999 → 0.1000 → ...`. Las versiones son **identificadores de texto**, no números decimales. Al incrementar, extraer la parte posterior a `0.` como un entero e incrementarla en uno (sin acotación de longitud). No usar comparadores de punto flotante ni semver para estos identificadores. Corregir `release_notes.json`, cabecera del juego, rango de historial, nombre del artefacto CI y menciones documentales en cada entrega grande. Alfa 0.100 corresponde a eventos turísticos; Alfa 0.101 a hospitalización y ambulancias. Evitar crear nuevas versiones por detalles aislados: la prioridad son sistemas jugables del roadmap.

## Alfa 0.102 · seguridad urbana y patrullaje (fases 9, 13 y 28)

Se agregó un **sistema jugable nuevo** en Online y Offline. Cada centro cívico municipal habilitado y con acceso vial puede equipar una base de seguridad por $4.000, que incluye un vehículo; cada móvil adicional cuesta $2.500, máximo tres. Las inversiones se pagan de caja **no comprometida por obras**. Se guarda en `building.policeUnit`, compatible con partidas antiguas sin esa propiedad. Las patrullas solo funcionan con electricidad/agua y financiación suficiente. Cada vehículo activo ocupa **tres trabajadores municipales** y el centro conserva hasta cuatro para atención primaria; la disponibilidad de personal para clínica e internación se reduce efectivamente y los móviles comprados sin dotación no prestan servicio. La prioridad puede cambiar entre mixta, residencial y comercial sin costo instantáneo.

Al cierre mensual se simulan incidentes deterministas de convivencia y comercio según localización, comercio, calles deterioradas y cortes de electricidad; no se usan atributos personales protegidos ni se atribuye delito a colectivos. El móvil solo interviene si existe camino con hasta 40 minutos de viaje y dispone de cupo (máximo dos intervenciones mensuales por patrulla). El enfoque reduce riesgo donde corresponde. Los incidentes sin respuesta pueden retirar hasta tres unidades reales del inventario comercial y, si se acumulan, erosionar aprobación/servicios. No se crea dinero ni inventario. El cierre se marca con `police.lastProcessedMonth` para evitar repetir pérdidas o intervenciones ante múltiples lecturas/reintentos. Costos fijos $390 por móvil y $70 por intervención atendida se imputan al programa municipal de **Servicios**; sin unidad no se cobran gastos ficticios. `policeReport` presenta cobertura por inmueble, atendidos/no atendidos, asignación de trabajadores, recursos y últimos incidentes. Es un primer nivel municipal de seguridad, no un cuerpo policial profesional independiente, que queda pendiente.

La sección **Ciudad > Seguridad** permite equipar, reforzar y configurar enfoques y muestra resultados económicos y sociales. Los botones se adaptan al ancho y admiten nombres largos; `tests/test_ui_layout.mjs` valida pantalla de 390 y 1440 px sin solapamiento, recorte u overflow. Se añadieron `tests/test_police_online.py` y `tests/test_police_offline.mjs`, incluidos en el CI. **No declarar pruebas concluidas antes de leer el último workflow**; la misma Alfa 0.102 agrupa todos los ajustes de esta mecánica. Fase 9: 55%, fase 13: 35%, fase 28: 65%; no asignar porcentaje global inventado. LAN real y Vercel aún no se verificaron.

**Siguiente gran mecánica recomendada:** protección social (hogares desplazados, vulnerabilidad y ayudas con cupos, presupuesto y consecuencias), seguida de educación secundaria/técnica y/o seguridad profesional con edificios, formación y turnos. Priorizar sistemas nuevos sobre microajustes, pero no sacrificar validación UI/CI.

## Requisito visual 3D obligatorio — intervención del usuario (Alfa 0.102, sin incrementar versión)

Toda mecánica de ciudad que tenga un actor físico debe representarse en el mundo Three.js, **no sólo en paneles**: vehículos, construcción, servicios, tráfico y labores visibles en tiempo real. La prioridad inmediata era hacer visibles **policía, bomberos y ambulancias**: las bases equipadas muestran coches policiales; los cuarteles exhiben autobombas; los hospitales, ambulancias. Con dotación activa, los patrulleros recorren calles conectadas; cuando hay incidente policial o incendio atendido, se reconstruye y anima la ruta de respuesta real, guardada por el motor. Los traslados de ambulancia se guardan en `health.ambulanceDispatches` (idempotentes por día, con origen, destino, pacientes y ruta) y se reproducen en el mundo cuando existen. Sin ruta transitable, el actor permanece estacionado, nunca atraviesa parcelas. Al seleccionar un actor móvil en Three.js, el panel describe su labor. No fabricar misiones visuales que no existen en la simulación.

El pipeline de render mantiene vehículos móviles en `trafficRoot`; `world3d.js` añade `makePoliceCar`, `makeAmbulance`, `spawnEmergencyActors`, búsqueda de ruta vial sin segmentos inhabilitados, patrullaje físico y reproducción temporal de incidentes. La función de diagnóstico `window.__ciudadViva3D()` expone la posición real de los actores Three.js para el test visual automatizado. `tests/test_ui_layout.mjs` cubre 390 y 1440 px, comprueba que las tres clases existen de verdad en el árbol de escena, tienen ruta y cambian de posición al transcurrir el tiempo. Esta validación corresponde a Alfa **0.102**, no crear 0.103 por una mejora de presentación de la misma mecánica.

**Norma futura:** diseñar cada sistema en tres capas simultáneas: estado/cálculo Online-Offline, interfaz informativa accesible y representación concreta en el mapa 3D. Una cifra en el panel no sustituye al actor físico. Las intervenciones históricas se muestran como reproducción visual de lo ocurrido, no como nuevas intervenciones reales; las unidades sin operación deben verse estacionadas. Faltan aún animaciones más profundas de entrada en edificios, evacuaciones, reparaciones y otras tareas urbanas; no declararlas hechas.

## Alfa 0.103 · edificios de servicios obligatorios, categorías y cobertura 3D

**Decisión vinculante del usuario:** ninguna atención médica, policía, autobomba ni basurero debe surgir gratuitamente del edificio de la Municipalidad. El jugador **debe construir** instalaciones específicas, varias si la ciudad crece. Cada base tiene una cobertura **máxima** medida por caminos viales conectados (no distancia euclidiana); las calles inhabilitadas no cuentan. Seleccionar edificio terminado/proyecto o previsualizar una tipología debe colorear **verde las calles efectivamente alcanzadas en la ciudad 3D**. Mantener actores 3D concretos (ambulancia, policía, autobomba, camiones) y reflejar su operación real. Las construcciones avanzadas cuestan más, tardan más, consumen más materiales y ofrecen mayor personal, equipamiento y alcance.

Se incorporaron **12 variantes de servicio**, elegibles desde Construir agrupadas por familias y licitadas por las constructoras existentes (Online/Offline): Salud = consultorio barrial ($8.000, 6 tramos, 12 puestos), policlínico ($14.200, 10, 24), hospital general ($25.500, 16, 40, 36 camas y 2 ambulancias); Seguridad = puesto de vigilancia ($9.200, 6, 12), comisaría distrital ($16.500, 11, 22, 2 móviles), central de seguridad ($28.700, 16, 36, 3); Bomberos = destacamento ($11.200, 7, 12, 1 autobomba), cuartel ($19.800, 12, 22, 2), comando ($33.000, 17, 36, 3); Residuos = base ($5.600, 6, 8, 1 camión), centro de transferencia ($12.000, 11, 14, 2), complejo de higiene urbana ($22.200, 17, 26, 3). Costos de referencia antes del multiplicador de la constructora; radio expresado en tramos de ruta. Las instalaciones de policía se construyen con tipo base `civic` pero `serviceModel` policial, segregadas de los centros sanitarios. Las instalaciones anteriores compatibles mantienen sus atributos y las que carecen de modelo se asocian al nivel básico cuando realmente son servicios, nunca a Municipalidad. Esta última puede seguir siendo sede municipal y centro de eventos, **no clínica, comisaría ni base de residuos**.

Servidores: `SERVICE_MODELS` y `service_model`/`offlineServiceModel`, `service_route_within`/`offlineServiceRoad`, radio aplicado a admisiones, internaciones, incidentes policiales, bomberos, rutas a contenedores y hogares cubiertos por camiones. Recolección ya no tiene camión ficticio desde el punto central ni capacidad de calle independiente de las bases. Los inmuebles mayores exigen incrementos proporcionales de las cinco clases de materiales y todo el costo contractual. En Three.js se diferencian policías, cuarteles y depósitos de niveles superiores; `coverageRoads` ilumina verde solo la red dentro del límite del edificio/obra seleccionada. Pruebas `test_service_models_online.py`/`test_service_models_offline.mjs` y UI en 390/1440 px verifican catálogo, proyectos, ausencia de cobertura gratuita y superposición; prueba de vehículo 3D exige redes energéticas y agua conectadas. **No confundir un vehículo estacionado por falta de servicios con fallo gráfico**.

La prioridad siguiente es extender la tipología escalonada a **escuelas (jardín, primaria, secundaria, universidad), industria, electricidad, agua, vivienda y comercios**, sin romper obras/contratos existentes; edificios especializados independientes pueden sustituir gradualmente el uso compartido de `civic`. No declarar terminadas todas las categorías construibles todavía. Continuar respetando la secuencia Alfa `0.103 → 0.104` y reservar números nuevos para mecánicas grandes. Confirmar CI final antes de afirmar aprobación completa; LAN/Vercel requieren prueba externa.

## Alfa 0.104 · jardín, primaria, secundaria y universidad con educación efectiva

Se agregaron cuatro obras municipales en Construir, con licitación y recursos materiales realmente proporcionales: jardín ($6.200, 52 días, 8 vacantes, radio 5 tramos, 5–6 años), primaria ($9.600, 68 días, 12 vacantes, radio 8, 7–12), secundaria ($17.800, 100 días, 18 vacantes, radio 12, 13–17), y universidad ($32.000, 145 días, 30 vacantes, radio 17, 18–24). Las bases tienen aulas y operación mensual $580/$820/$1.550/$3.200 más nómina e insumos por inscripto. La simulación de Online y Offline toma un residente identificable, una edad compatible y un máximo de ruta por calles abiertas; si una sede se llena, busca otra accesible. Los cupos dependen de profesores cualificados efectivamente empleados, aulas, electricidad, agua, saneamiento y presupuesto. Tras doce meses realmente asistidos por nivel, se registra la formación y aumentan las competencias laborales según ciclo, sin acreditar nada por informes repetidos o edificios vacíos. Las partidas antiguas con edificios u obras school sin serviceModel conservan su funcionamiento previo para edades 5–17.

La escena 3D distingue jardines y edificios mayores, y muestra en verde sobre calles transitables el radio del establecimiento seleccionado o previsualizado. Se incorporan regresiones Online/Offline y se actualiza el empaquetado CI. Los estudiantes todavía no se mueven individualmente por las calles de Three.js; tampoco existen carreras universitarias completas ni oferta técnica especializada. Fase 28 queda parcialmente en 75%, progreso global no cuantificable. CI se verificará después de publicar; LAN física y Vercel siguen sin comprobar.

**Siguiente gran mecánica sugerida:** protección social por hogar con elegibilidad objetiva, presupuesto y cupos mensuales realmente acotados y efectos comprobables. Seguir la serie Alfa 0.N: 0.104 → 0.105.


## Alfa 0.105 · interfaz rosa minimalista, avisos físicos y construcción comprensible

La interfaz pasa a rosa empolvado/crema, superficies blancas, controles con jerarquía y navegación simplificada sin ocultar el simulador. En el muelle inferior hay **Avisos** y **Ayuda**. El módulo cityGuide.js obtiene alertas de datos calculados por las simulaciones Online/Offline: policía, incendios, ambulancias, basura visible, contenedores casi llenos, tramos dañados y obras pausadas. Cada aviso tiene identificador, posición real y texto accionable; la proyección de la cámara coloca botones 2D sobre el edificio o la calle (giro y zoom incluidos). Pulsar una alerta abre descripción y permite inspeccionar parcela. No se fabrican incidentes sin causa simulada. Los eventos resueltos solo se ven por un período limitado; los incidentes sin respuesta no se confunden con los atendidos. Los avisos son lectura y localización de hechos existentes, no despacho municipal manual.

Los cubos junto a calles corresponden a **contenedores de residuos**, **bolsas de basura no recogida** o **barreras de calzada deteriorada**, no a bloques de construcción. Al tocar la parcela se identifican con cantidad/capacidad o condición y medidas de solución. Las zonas amarillas son **permisos industriales, no fábricas terminadas**. Al tocarlas se puede elegir especialidad, o hacerlo en Construir: procesadora de alimentos, cantera, hormigonera, aserradero y metalúrgica. Los dos motores validan y guardan la especialidad elegida, sin cambiar la asignación automática de inversiones zonificadas y partidas anteriores sin selección explícita.

**Cómo conseguir hormigón:** en Obras → Pedir materiales, elegir proveedor con hormigón físico en stock, ruta para camión, destino con espacio y caja del contratista. Para producir localmente: dos parcelas industriales conectadas; construir primero cantera (áridos), después hormigonera. La receta del juego consume *dos áridos físicos por unidad de hormigón*, además de necesitar personal, electricidad, agua, saneamiento, capital privado y cadena logística. No afirmar que se modela cemento por separado. Las obras no terminan al pintar suelo: la guía explica etapas, certificados, esperas, causas y materiales aún por consumir, diferenciados de stock entregado o en tránsito.

Three.js añade detalles decorativos y diferenciación a todas las familias, patios, señalética, jardineras, fachadas, cubiertas, instalaciones industriales y luminarias, además de iluminación más cálida; se mantiene como base el modelado procedural previo, sin importar modelos CAD externos. En móvil se omiten adornos adicionales costosos. **Pendientes**: efectos activos de humo/llamas, tutorial con pasos validados, remodelación total de cada activo con malla de alta calidad, despacho manual de emergencias y mejoras adicionales de rendimiento. No declarar esos sistemas completos. Las regresiones cubren clasificación de avisos, fuentes, guía de materiales, especialidad industrial Offline y UI responsive. Verificar CI después de publicar; red LAN física y Vercel requieren comprobación separada.

**Próxima etapa:** emergencias con decisiones y respuesta municipal sobre el mundo; después optimización visual y tutorial por objetivos persistente.
