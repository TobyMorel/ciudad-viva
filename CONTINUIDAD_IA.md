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


### Alfa 0.89 · compras y materiales de obra Offline (actual)

`offline.js` ya da paridad básica para materiales de construcción: migración de todas las existencias heredadas, inventarios por proveedor/contratista/depósito, costos unitarios y producción/reposición mensual finita, compra accionada desde Obras, caja de contratista, capacidad por destino, ruta vial, ETA, recepción y consumo por etapa. La obra se suspende si falta el siguiente lote y el bucle vuelve a intentar al recibir existencias. Las viviendas y comercios autónomos financian materiales antes de cargar permiso/proyecto, en vez de aparecer gratis. `game.js` expone Pedir materiales también Offline; `style.css` mantiene la confirmación sticky en modal largo móvil/escritorio. Verificado con Chromium: orden de 6 hormigones, pago $372, entrega y uso en una calle de prueba; modal 390×844 y 1440×900, sin errores JS, botón visible. Node syntax/diff checks pasan.

**No declarar verificado:** el escenario específico suspensión por escasez → entrega → reanudación en ambos motores aún no se ha cubierto deliberadamente; no se probó conexión LAN física ni Vercel. Siguiente: agregar el test de tick/continuación en Online y Offline; después producir madera en aserradero y acero en una cadena industrial, con insumo finito, puestos/servicios, logística real, ventas a constructoras y receta visible. Evitar reducir caja privada por debajo de cero al sumar materiales; `offlinePrivateMaterialCost()` participa en las comprobaciones de capital de promoción. Actualizar roadmap JSON y guía al cierre. Fase 18=75%, global sigue no estimable: las 34 fases no tienen un peso comparable auditado.
