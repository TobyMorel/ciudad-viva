# Estado de desarrollo · Ciudad Viva

**Entrega:** Alfa 0.49 · 31 de octubre de 2026
**Especificación:** [roadmap maestro](ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md), 34 fases (0–33). La base implementada continúa desde las alfas anteriores.

## Medición del progreso global

El porcentaje total del juego queda **sin estimar** por ahora. El repositorio no tiene una matriz estable de pesos y criterios de aceptación verificables que cubra las 34 fases completas del roadmap. Las entregas y funcionalidades listadas abajo describen evidencia funcional, pero no se convierten en un porcentaje por cantidad de versiones, archivos o pruebas. Para calcularlo hay que registrar y mantener una ponderación por alcance de fases y criterios de finalización; hasta entonces no corresponde publicar X%/Y%.

## Implementado

- Alfa 0.49 · Fase 26 (parcial): grupos electrógenos para centros de salud municipales, plantas potabilizadoras y depuradoras. Cuando la red no cubre la demanda crítica, el generador entrega hasta 75 kW según combustible disponible; se consume combustible por día, la reserva agotada detiene el respaldo y puede reponerse. Instalación $2.800 con tres días de autonomía, $0,12/kWh para repostar y $70/mes de mantenimiento. Generadores visibles en 3D; balances y acciones Online/Offline; migración al esquema 34. Esto no equivale aún a una simulación detallada de combustible, bombas o microredes.


- Alfa 0.48 · Fase 26 (parcial): contenedores municipales colocables en tramos viales por $350, con +0,15 t/día de capacidad por unidad y representación 3D. Cada depósito municipal operativo y conectado a la ruta central añade 12 t de almacenamiento de transferencia y despacho limitado a 1,5 t/día. La recolección que no cabe en las estaciones o no puede salir queda acumulada; la disposición final y el reciclaje procesan el flujo despachado según sus capacidades. Ciudad > Servicios informa capacidad, stock y despacho. Online y Offline migran al esquema 33.

- Alfa 0.19: Banco Cooperativo con $42.000 de liquidez y crédito por empresa limitado por dotación. Las tiendas pueden usarlo para nómina, gastos e insumos; cobran interés mensual, pagan desde excedentes y devuelven capital. Dos meses seguidos sin cubrir intereses llevan al cierre y liberan vacantes; los empleados afectados pasan a búsqueda laboral con registro de su anterior empleador. Migración de esquema 15 a 16. En Offline, la misma mecánica opera desde el navegador.
- Alfa 0.20: mapa a pantalla principal, herramientas y reportes en ventanas emergentes, dock compacto adaptativo y cronología paginada de 0.1 a 0.20. El código disponible conserva detalle desde 0.10; 0.1–0.9 aparecen con una nota explícita de archivo perdido. La ventana Cambios se actualiza desde `release_notes.json`.
- Alfa 0.21: el desempleo conserva inicio, causa y empleador previo; al contratar se registra la duración individual. Online y Offline reportan buscadores, vacantes y esperas con guardado esquema 17.
- Alfa 0.22: perfiles estables de comercio, administración y logística y salario mínimo esperado por residente. Los centros laborales publican salario y requisito; las vacantes solo aceptan candidatos cualificados, con salario aceptable y ruta. El informe cuenta a quienes buscan por falta de cualificación, salario o acceso. Offline usa el mismo filtrado con distancia aproximada. Guardado esquema 18. Esto implementa una primera capa de la fase 21, no educación formal ni desigualdad territorial.

- Alfa 0.23: cursos municipales de comercio, administración y logística asignan hasta seis residentes con habilidad insuficiente y ruta al aula. Se prepagan dos ciclos mensuales; cada ciclo mejora 18 puntos, registra costo y progreso, y los cursos pueden pausarse/reanudarse/cancelarse con reintegro del saldo sin gastar. Si el centro o acceso vial falla, se pausa y conserva saldo. Online y Offline; guardado esquema 19. Esta formación es una parte de la fase 21; no hay currículos, docentes, formación prolongada ni distribución de ingresos por barrio.

- Alfa 0.24: los residentes con una ruta laboral seleccionan caminar si el recorrido usa hasta tres tramos, y auto en distancias mayores. Cada viaje agrupa origen/destino, motivo, ventana horaria y minutos puerta a puerta separados en acceso, espera, recorrido y estacionamiento. Solo los autos ocupan capacidad vial; los peatones y autos se representan sobre rutas y el reporte estima vehículos y CO₂ diario. Offline usa BFS sin congestión dinámica. Migración a esquema 20. Fase 22 parcial: no hay transporte público, costo de propiedad, tarifa, tren/metro, carga ni horarios individualizados.

- Alfa 0.25: se pueden abrir líneas de bus en corredores laborales existentes, comprar 1–3 colectivos de 30 plazas y elegir entre bus/auto por tiempo, espera y tarifa. Las rutas transportan pasajeros de la relación origen–destino elegida; frecuencia depende de longitud y flota. Compra $700/vehículo, tarifa $0,25, operación $140/mes por unidad; el hogar paga desde caja disponible y la recaudación cubre parte del costo. Pausa/reanudación/retiro recuperando 50%, vehículos animados en la calle. Online y Offline; guardado esquema 21. Conductores como agentes, paradas intermedias y transbordos pendientes.

- Alfa 0.26: los corredores enumeran paradas en edificios situados junto a su recorrido. Una línea puede conectar hogares y empleos diferentes a sus extremos originales si están a distancia caminable, comparten la ruta en el sentido de marcha y el bus mejora el modo usado previamente (a pie o auto). El tiempo suma acceso caminando, espera, viaje en línea y tarifa; el aforo se comparte entre todos los pares servidos. Los puntos de parada se recalculan con el mapa y siguen la ruta al guardar/cargar, tanto Online como Offline. No son edificios construibles y no simulan conductores; estos, horarios por turno y transbordos siguen pendientes.

- Alfa 0.27: las paradas de bus son edificios públicos construibles desde una línea activa y una parcela libre adyacente al recorrido. Se licitan como obra con cuatro trabajadores, cinco etapas, plazo base de 18 días (ajustado por constructora) y materiales online (10 áridos, 5 madera, 2 componentes). Tras inspección se agrega un refugio 3D, el bus incorpora la estación a su ruta y el municipio paga $25/mes. La selección de parcela y asociación de línea se valida en Online y Offline; Offline replica costo/plazo/etapas, pero mantiene su modelo de materiales simplificado. Guardado/carga usa los proyectos y edificios existentes; sin migración de esquema.

- Alfa 0.28: menú LAN con creación local, unión por dirección/código y lista de salas anunciadas por UDP entre servidores de la red; el anfitrión conserva autoridad de tiempo y guardado. Ciudad divide su informe en cuatro subcategorías. Se agregaron señales sonoras Web Audio con silencio persistente y un modelo de colectivo 3D distinto al auto, además de mayor resolución de render. La sala sigue necesitando un servidor Python en el anfitrión; la conexión entre dos equipos físicos queda pendiente de prueba.

- Comercios conectados a tres proveedores mayoristas de mercancía con existencias finitas, costos, reposición mensual y tiempos de entrega. Las tiendas pagan compras desde su caja, conservan inventario de materia prima, envían pedidos por la red vial y esperan entrega antes de producir. El costo incorpora flete y demora; el proveedor recibe el pago y pierde stock. Los hogares distribuyen su presupuesto entre locales según distancia y precio; las tiendas reaccionan a rotación/stock ajustando precios, y también venden excedentes al mercado regional. Guardados previos migran a esquema 15 con stock inicial de insumos.
- Menú de inicio con modos Offline y Online LAN. Offline carga ciudad inicial estática, guarda/carga en localStorage y permite calendario, zonificación, licitaciones básicas y construcción por etapas sin backend; Online comprueba la API antes de abrir para evitar reintentos engañosos. Vercel permite jugar Offline. Pedidos logísticos y rescate aún requieren servidor.


- Interfaz HTML y servidor local con iniciadores de doble clic. Three.js 0.171.0 y su licencia se incluyen en `vendor/`; no hay CDN, npm ni conexión a Internet al jugar.
- Cámara WebGL ortográfica en escena 3D, movimiento, zoom y giros, luz direccional, sombras de escritorio, suelo procedural, costa, paseo, árboles, calles, edificios residenciales/comerciales/cívicos detallados y obra por etapas. Cada hogar guarda residentes con identidad estable y condición laboral. La simulación asigna un empleador único a cada trabajador hasta cubrir vacantes accesibles; calcula rutas entre casa y trabajo, viajes y cobertura por centro laboral. Los salarios privados pasan de la caja comercial a la del hogar y las compras locales descuentan dinero familiar; la nómina pública se paga desde el presupuesto municipal. Cada sitio informa trabajadores asignados, nómina y puestos efectivos. Dos pesos fiscales mensuales por puesto privado cubierto ingresan a la tesorería. Cada comercio conserva caja, inventario, trabajadores, producción, compras de insumos, ventas y nómina; compra la demanda de hogares alcanzables y puede quebrar si su saldo cae bajo cero. Los locales en quiebra pierden puestos y se ven cerrados. La escena muestra las rutas más utilizadas con autos animados; son flujos agregados, no agentes individuales.
- Ciudad inicial poblada con 22 edificios y 620 plazas residenciales ocupadas que coinciden con la población de 620.
- Servidor anfitrión autoritativo, invitados por dirección LAN, estado compartido, control del reloj por anfitrión y guardado JSON.
- Calendario, caja municipal, ingresos/gastos, población, empleo, servicios, apoyo y acontecimientos mensuales.
- Parcelas, acceso vial, zonificación y ofertas de tres constructoras. Agua bloqueada para construcción común.
- Obras públicas y privadas con contratos, etapas, materiales consumidos por progreso, cupos de proyecto y trabajadores asignados. Faltantes paran avance y pagos. Pausar libera dotación; reanudar la vuelve a comprobar. Cancelar conserva la estructura incompleta; una licitación nueva permite rescatarla.
- Calidad de constructora registrada: cambia el mantenimiento de nuevas calles y cobertura/costo de los centros de salud.
- Hogares con ocupación y capacidad. La migración depende de viviendas vacantes, empleo y apoyo; cambia ocupación, población e ingresos tributarios. Sin vivienda libre o puestos suficientes no ingresan residentes.
- Pedidos manuales de materiales por obra desde tres proveedores con precio, stock y plazo diferentes. El costo se descuenta de la caja del contratista al ordenar; la reserva de stock es atómica. La distancia vial afecta flete y ETA. Camiones visibles recorren la ruta; una ruta interrumpida retrasa el pedido. Los viajes laborales se asignan entre hogares ocupados y puestos habilitados según capacidad y distancia de red. Cada flujo agrega demanda a sus tramos; los camiones activos añaden carga local, lo que aumenta sus tiempos de viaje y actualiza el ETA. La carga llega al patio o al depósito elegido; al llegar reserva personal y autoelevador del contratista; la capacidad de manejo define cuántos días tarda la descarga.
- Depósito municipal licitable: 8 trabajadores, materiales por etapa, construcción visual y costo operativo de $180/mes. Al habilitarse agrega 500 unidades a la capacidad de almacenamiento. Los pedidos reservan espacio mientras viajan y se rechazan de forma atómica cuando no alcanza. El mapa muestra la nave de carga y el informe expone el inventario de cada depósito.
- Cada pedido elige destino: patio de constructoras o depósito identificado. El camión viaja hasta ese edificio y entrega allí el inventario separado por constructora. Las obras solo consumen ese stock si tienen ruta vial hasta el depósito; el retiro usa primero el inventario alcanzable más cercano. El pedido puede marcar prioridad normal o alta. Al llegar, espera si faltan operarios o autoelevador; la prioridad alta se antepone a la cola de descarga. La descarga reserva equipo y cuadrilla, dura según volumen/capacidad del contratista y anima la carga hasta liberar el stock.
- Inventarios, saldos de contratistas, ofertas y estado de cada pedido visibles en la interfaz y persistentes en el guardado. La cola de descarga ordena pedidos por prioridad manual, material que desbloquea una etapa detenida, días de espera y exposición contractual calculada. La exposición se informa en la interfaz y no se cobra. El guardado usa esquema 15 y migra automáticamente las ciudades Alfa anteriores; los flujos laborales y sus tiempos se derivan al cargar el estado, no se guardan duplicados.

- La asistencia individual derivada del tiempo de viaje determina el salario cobrado. La nómina efectiva de cada empleador coincide con el dinero acreditado en los hogares; el inspector muestra asistencia y trabajadores con jornada reducida por tráfico.



## Verificaciones ejecutadas

- Alfa 0.18: compras a tres proveedores con stock finito; el primer mes se ordenaron 333 unidades por $1.577 y 7 entregas llegaron tras 12 días simulados. Los proveedores recibieron fondos y se verificaron stock no negativo, inventario de insumos y compatibilidad con rutas. Con una tienda a $10 y una competidora a $26, la primera recibió demanda local 25 frente a 3 unidades. Un guardado de esquema 14 migró al 15.
- Alfa 0.17: en servidor estático sin API, Online explica que requiere sala LAN y evita el bucle de reconexión. Offline inicia, avanza el calendario, conserva la ciudad al recargar, procesa compras a los mayoristas y acepta contratos locales. Chromium no reportó errores JS.

- Alfa 0.16: en la ciudad inicial se asignaron 203 residentes; nómina privada $1.690 y pública $272, con créditos idénticos en hogares y empresas/municipio. Ocho camiones elevaron el viaje medio de 7 a 11 minutos y redujeron nómina total de $1.962 a $1.943 (privada $1.690 a $1.671). Sin calles, asignación y salarios fueron cero. Chromium WebGL mostró la interfaz 0.16 sin errores JavaScript. Migración desde esquema 13 conserva identidades; esquema guardado sigue en 14.

- Alfa 0.13: ocho camiones sobre un corredor de alta demanda elevaron el acceso laboral medio de 12 a 29 minutos, redujeron puestos cubiertos de 202 a 188 y el empleo efectivo de 78% a 72%. El ingreso fiscal de actividad bajó de $404 a $376/mes. Una red desconectada dejó los puestos sin dotación y eliminó ese ingreso. Chromium mostró cobertura por edificio y trabajador efectivo sin excepciones.

- Alfa 0.12: el balance de traslados asignó 203 trabajadores a destinos laborales conectados y estimó 12 minutos medios en la ciudad inicial. Al desconectar la red, no quedó ningún viaje alcanzable. La carga de ocho camiones siguió elevando el tiempo de corredor; Chromium verificó el informe, rutas animadas y ausencia de errores JS.

- Alfa 0.11: ocho camiones simultáneos sobre la misma arteria elevaron el factor compartido a ×1,76 y desplazaron la llegada estimada. Se comprobó avance menor que el flujo libre, ETA extendida por congestión, visualización de la ruta/progreso, compra por API con el nuevo tiempo de preparación y migración de órdenes esquema 9. Chromium mostró ETA y factor de congestión sin excepciones JavaScript.

- Alfa 0.10: prueba de cola comprobó que una entrega que completa la cantidad necesaria para destrabar la próxima etapa gana a una carga normal; la prioridad manual alta queda primera. La exposición coincide con costo/duración × espera y no modifica caja ni presupuesto.
- Migración de una orden pendiente guardada en esquema 8 confirmó prioridad normal por defecto y conservación del día de llegada.
- Chromium verificó el panel con motivo de urgencia, días de espera y exposición no debitada; no registró excepciones JavaScript. Captura incluida en la entrega.

- `node --check game.js`, `node --check world3d.js` y `python3 -m py_compile server.py` superados.
- Chromium WebGL headless: escena 3D cargada sin excepciones JavaScript en escritorio (1440×900) y móvil (390×844); seis herramientas disponibles en móvil. Se comprobó selección de parcela, oferta de constructoras, adjudicación vial, progreso de obra, rotación, zoom y tráfico ambiental.
- API LAN local: invitado y anfitrión ven estado compartido; autoridad del anfitrión, materiales, cupos, personal, pausa que libera cuadrillas, reanudación validada y guardado/carga probados.
- Pruebas de materiales confirmaron detención por faltantes, compra manual a los tres proveedores con diferencias de precio/plazo/inventario, descuento de caja/stock, ETA y recepción sin reiniciar el avance. La UI mostró pedido en tránsito, destino y estado de descarga.
- Depósito: API completó una obra de prueba, validó aumento de capacidad +500 y dotación de 8 personas. Una compra mayor que el espacio disponible fue rechazada sin debitar dinero ni stock. Chromium cargó la escena y comprobó el selector de destino del pedido sin errores JavaScript.
- Equipos logísticos: falta de cuadrilla y autoelevador deja un pedido esperando; al liberarse ambos, operarios y máquina quedan reservados y se liberan al terminar. Tres contratistas producen duraciones distintas para la misma carga.
- Ruta logística: compra al depósito, ruta vial dibujada y entrega segregada por constructora verificadas por API; una obra conectada retiró áridos del depósito y el saldo restante coincidió. La descarga progresiva y las cajas animadas se comprobaron en Chromium. Un pedido sin ruta recibió HTTP 409 sin cobrar ni reservar stock. No hubo inventarios negativos.
- Migración mensual probada con capacidad habitacional, vacantes y empleo. Ocupantes y población permanecieron concordantes; nuevos hogares elevaron ingresos; falta de plazas/empleo bloqueó migración.
- En una entrega anterior se probaron dos clientes HTTP locales y transacciones simultáneas. La conexión entre dos equipos físicos no se ha podido comprobar en este entorno.

- La exposición por demora es un indicador estimado con costo contractual/duración × días en espera; todavía no genera penalidad ni afecta los pagos del contrato.

## Límites actuales

- La ciudad interactiva sigue en un mapa fijo de 28×20 y los edificios son geometría procedural de detalle medio, no modelos artísticos finales.
- Los residentes laborales tienen identidad, empleador, perfiles de habilidades, búsqueda y cursos básicos. Aún comparten caja por vivienda y faltan educación formal, presupuestos personales, desigualdad y trayectorias laborales profundas. Los viajes laborales y cotidianos se agrupan por hogar, destino, modo y turno; la escena anima una muestra limitada de recorridos.
- Los perfiles laborales diferencian comercio, administración y logística, pero aún no hay ocupaciones internas, negociación ni trayectoria profesional; educación y formación no producen nuevas competencias. Las empresas comerciales ya tienen caja, inventario, producción, ventas, costos y quiebra; faltan proveedores productivos identificables y encadenamiento entre empresas. Los viajes y la asistencia siguen agregados, sin horarios ni decisiones individuales de ruta; también faltan salarios reales de cuadrillas.
- Las líneas de colectivos ya funcionan con conductores, cocheras, paradas, transbordo de dos tramos, tarifa integrada y nueve franjas laborales; la movilidad sigue parcial. Falta bicicleta, transporte de superficie ferroviario, metro, viajes no laborales a servicios/ocio, movilidad de carga, capacidad vial detallada y accidentes. También faltan redes físicas completas de electricidad, agua, cloacas y residuos, además de elecciones, puertos, aeropuertos, turismo, clima, patrimonio y simulación por décadas.
- Offline requiere navegador con WebGL; Online requiere Python 3.9+ en el anfitrión. Descubrimiento de salas por código, transferencia de anfitrión, autenticación y validación física de Wi-Fi siguen pendientes. Offline tiene una simulación comercial simplificada y trayectos aproximados; todavía no incluye pedidos logísticos de obra, rescate de obra ni reasignación laboral completa de edificios nuevos.

## Verificación Alfa 0.19

- `py_compile`, `node --check` (game.js y offline.js), JSON y `git diff --check` pasan.
- Simulación inicial: 203 trabajadores, 1.690 de nómina, 332 unidades pedidas a proveedores y $1.624 en insumos sin usar crédito.
- Escenario de tensión: un comercio tomó $1.363 de crédito y permaneció abierto; la verificación de cierre y despido queda registrada en pruebas de cierre económico.
- Chromium headless inició Offline, renderizó el canvas y cargó cuatro tarjetas de versiones y tres de próximas entregas sin errores de consola. La API LAN sirvió `release_notes.json` con HTTP 200.
- La conexión desde un segundo equipo físico sigue pendiente de comprobación en la red del usuario.

## Verificación Alfa 0.20

- `node --check game.js`, `python -m py_compile server.py`, JSON y `git diff --check` pasan.
- Chromium abrió y cerró repetidamente Construir, Ciudad, Economía, Obras y Registro; las ventanas reabren con sus datos tras navegar entre ellas. Seleccionar una parcela en el mapa abre su popup inspector.
- Historial de veinte versiones dividido en cuatro páginas de cinco: página 1 contiene Alfa 0.20–0.16 y la última termina en Alfa 0.1. Las versiones 0.1–0.9 se identifican claramente como notas no conservadas.
- En viewport móvil 390×844, el dock cabe sin desplazamiento horizontal y el popup se mantiene dentro de 370 px. En escritorio 1440×900, el mapa conserva el área de juego principal.
- Chromium inició la modalidad Online como anfitrión LAN sin errores JavaScript. La prueba entre dos equipos físicos continúa pendiente.

## Verificación Alfa 0.21

- `python -m py_compile server.py`, `node --check game.js`, `node --check offline.js`, `node --check world3d.js`, validación JSON de semilla e historial y `git diff --check` pasan.
- Simulación LAN: el estado inicial conserva 260 trabajadores activos, con 203 ocupados y 57 buscando. Un trabajador despedido y recontratado 15 días después incrementa su episodio y genera el registro individual de búsqueda esperado.
- Migración desde esquema 16 agrega los campos de historial laboral y actualiza el guardado a esquema 17.
- Chromium headless en Offline avanzó de día 30 a 41 sin errores JavaScript; se mantuvieron 203 empleados frente al objetivo del 78% y 57 personas buscando, sin contrataciones excedentes.
- El informe Ciudad se revisó en Chromium a 1440×900 y 390×844. La ventana queda dentro del viewport, no genera desplazamiento horizontal y su contenido largo puede recorrerse verticalmente hasta el final. Se corrigió la concordancia de «día/días».
- La conexión LAN entre dos equipos físicos continúa pendiente; esta entrega no altera la capa de red.

## Verificación Alfa 0.22

- `python -m py_compile server.py`, `node --check game.js`, `node --check offline.js`, `node --check world3d.js`, validación JSON de semilla e historial y `git diff --check` pasan.
- El estado Online inicial conserva 260 personas en edad laboral, 203 ocupadas y 57 buscadoras; cada persona empleada supera la cualificación y el salario mínimo del puesto asignado.
- Pruebas causales: con las tres habilidades en cero, las 260 personas quedan buscando por incompatibilidad y los 286 puestos siguen abiertos; con perfiles cualificados que esperan $11 y puestos que ofrecen $8–$10, quedan sin ocupar y las 260 personas aparecen buscando por salario.
- Migración desde esquema 17 conserva IDs de residentes, incorpora perfiles de habilidades y salario esperado y actualiza a esquema 18.
- Chromium Offline migró el estado, recontrató a una persona con mejores habilidades tras 30 días, dejó su empleador previo y guardó una búsqueda de 30 días. Los 208 ocupados del escenario respetaron los requisitos; sin errores JavaScript.
- Chromium revisó el popup Ciudad en 1440×900 y 390×844: ventana dentro del viewport, sin scroll horizontal, filas de puestos sin solapamiento y texto extenso accesible mediante scroll vertical. Se distingue espacio de vivienda de vacantes laborales y trayecto aproximado Offline de falta de acceso vial.
- Historial de 22 entradas paginado en cinco páginas; las versiones van de 0.22 a 0.1 sin desbordamiento horizontal. Dos clientes de navegador locales confirmaron anfitrión/invitado Online y estado compartido.
- La conexión LAN entre equipos físicos por Wi-Fi sigue pendiente; no se ha probado en esta entrega.

## Criterio de estimación global

- No se publica un porcentaje de avance hasta definir criterios de aceptación verificables y pesos estables para las 34 fases. La lista de fases del roadmap es un alcance descriptivo, no una base ponderada; contar funciones o pruebas produciría una cifra engañosa. Mantener este estado hasta documentar una matriz de alcance, criterios y pesos.


## Verificación Alfa 0.23

- Revisiones sintácticas de Python y JavaScript, validación de JSON y `git diff --check` completadas antes de publicar.
- Playwright con Chromium comprobó creación de cursos Offline y Online, descuento del presupuesto, cohorte de seis personas, dos cierres mensuales y estado completado. Una prueba del adaptador Offline verificó +36 habilidad por participante y saldo final cero. Las acciones de pausa, reanudación y cancelación se verificaron con el adaptador local. En 1440×950 y 390×844 el popup de Ciudad conserva texto y botones legibles, no presenta desborde horizontal y desplaza su contenido verticalmente; no se detectaron errores JavaScript.
- Transferencia Online entre dos equipos físicos por Wi-Fi continúa pendiente; esta sesión no dispone de una red LAN externa para certificarla.


## Verificación Alfa 0.24

- Python y los tres módulos JavaScript pasan sus chequeos sintácticos; se verificaron ambos modos con las mismas categorías de viaje, conteos que suman a las personas ocupadas, rutas y componentes de tiempo presentes.
- Los recorridos de los residentes ocupados se agrupan por origen, destino y modo; ambos modos calculan por separado peatones, automovilistas, vehículos y CO₂ aproximado. Los conteos cambian con las rutas, perfiles y el estado de la ciudad. Offline usa su aproximación de ruta BFS.
- Chromium comprobó Ciudad a 1440×950 y 390×844: modal split, emisión y empleo se leen sin solaparse ni causar desborde horizontal; el popup largo se desplaza verticalmente y no tuvo errores JavaScript. La conexión entre dos equipos físicos por LAN permanece pendiente.


## Verificación Alfa 0.25

- Python/JavaScript compilan; en Online y Offline las líneas trasladan viajeros, la suma de peatón/auto/bus coincide con viajes laborales, capacidad limita pasajeros y pausa/reanudación/retiro afectan servicio y fondos. Se verificó pago de boletos desde caja familiar disponible y pausa cuando se cierra la línea.
- Chromium revisa la pantalla Ciudad en escritorio y móvil con panel de flota/corredores/servicios; no hay desborde horizontal, los textos se leen sin solaparse y el contenido largo se recorre con scroll vertical.
- Los controles LAN físicos siguen pendientes de validación entre dos equipos fuera de este entorno.

## Verificación Alfa 0.26

- `python -m py_compile server.py`, `node --check` (game.js, offline.js, world3d.js), validación JSON y `git diff --check` pasan.
- En Online y Offline se montó una línea de tres colectivos y se comprobó que cubre pares hogar–empleo secundarios que no son los extremos del corredor. El tiempo de abordaje suma caminata a la ruta y distancia efectiva viajada; los corredores siguen limitados por flota y aforo.
- Chromium revisó Ciudad a 1440×950 y 390×844: nombres de paradas envuelven dentro de las tarjetas, sin scroll horizontal ni errores JS. El popup conserva scroll vertical para el listado largo.
- La prueba LAN entre dos equipos físicos continúa pendiente.


## Verificación Alfa 0.27

- Python (`py_compile`) y JavaScript (`node --check` para `game.js`, `offline.js` y `world3d.js`) pasan; `release_notes.json` valida y `git diff --check` no reporta errores.
- Online: se abrió un corredor, se adjudicó una parada a una constructora con cuatro trabajadores y los materiales requeridos (10 áridos, 5 madera, 2 componentes). La obra llegó a edificio habilitado, consumió esos insumos, agregó $25/mes y el recorrido guardado pasa por la estación. Guardar/cargar conservó el edificio y su ruta.
- Offline: el adaptador creó la línea y el contrato, mantuvo el proyecto al reconstruir el adaptador, completó la parada tras el plazo simulado y conservó edificio, costo mensual y recorrido al volver a cargar.
- Chromium revisó el panel y la licitación a 1440×960 y 390×844. Se detectó y corrigió el orden de capas del modal; ahora aparece sobre Ciudad. En móvil los tres presupuestos y la adjudicación quedan accesibles con scroll interno, sin desborde horizontal ni errores JavaScript.
- La conexión LAN entre dos equipos físicos y la publicación en Vercel no son verificables desde esta prueba local.


- Alfa 0.29: cada línea activa contrata hasta un conductor por vehículo entre residentes sin otro empleo, con acceso vial, habilidad logística y salario aceptable. Se prioriza conservar la dotación anterior. La flota efectiva gobierna frecuencia, capacidad, costo, emisiones y colectivos 3D. Sin conductor no circula ni cobra boletos. El panel agrupa los turnos de hora pico en un desplegable. Pendiente: horarios de jornada completa, depósitos, relevos y validación LAN física.

## Verificación Alfa 0.28

- API local: antes de crear sala, `/api/state` responde 409; crear sala en el anfitrión responde 200, código incorrecto responde 403 y un invitado con código válido recibe el estado sin privilegios de anfitrión. `/api/rooms` lista la sala y recibe un anuncio UDP de prueba. Una zonificación hecha por un invitado aparece en el estado leído por otro.
- Chromium: creación de sala en escritorio (1440×960), búsqueda/unión de invitado y menú LAN en móvil (390×844), modo Offline y cuatro subcategorías de Ciudad; sin desborde horizontal ni errores JS en estas pantallas.
- Las mecánicas históricas no se consideran todas cerradas: la auditoría por fase está en `AUDITORIA_ROADMAP.md`. Falta una prueba LAN entre dos equipos físicos y una revisión integral de décadas de simulación.

## Verificación Alfa 0.29

- Motor LAN: un corredor con dos vehículos asignó dos residentes distintos, ofreció 60 plazas y costó $280/mes. Tres recálculos conservaron los mismos valores; pausar dejó flota y costo en cero. Se detectó y corrigió una recursión de congestión durante esta prueba.
- Motor Offline: el corredor asignó dos conductores y reprodujo 60 plazas y $280/mes. Pausa, reanudación y recarga mantuvieron la dotación y actualizaron el costo. El salario de $10 por conductor se acredita al hogar dentro del costo operativo, sin sumar otra nómina municipal.
- Chromium a 1440×960 y 390×844 comprobó el panel Movilidad, creación de línea, turnos desplegados, ausencia de errores JS y ancho de documento igual al viewport. La prueba visual aisló el render 3D para revisar la interfaz; la animación 3D se verificó por código, no por captura en esta sesión.
- Prueba LAN en dos computadoras físicas sigue pendiente.

## Alfa 0.30 · cocheras y plazas de flota

- Una cochera municipal se adjudica y construye por etapas. En LAN exige seis trabajadores de obra y 30 áridos, 16 acero, 8 madera y 10 componentes. Offline usa el contrato y plazo simplificados. Al habilitarse aporta cuatro plazas y suma $50/mes al gasto base.
- Las líneas ocupan plazas en cocheras con ruta vial al origen, sin duplicarlas entre líneas. Cada colectivo alojado baja su operación de $140 a $110/mes. Los vehículos sin plaza siguen alquilados y mantienen el costo anterior. La asignación, aforo y gasto son derivados y se recalculan al cargar.
- Verificación: LAN simulada con dos colectivos pasó de dos alquileres y $280/mes a dos plazas propias y $220/mes; el informe indicó 2/4 plazas. Una obra con materiales y pagos disponibles terminó en el motor LAN y sumó $50/mes. Offline construyó la cochera, y la recarga asignó dos colectivos a plazas propias con el mismo ahorro. Chromium revisó Movilidad y Construir a 1440×960 y 390×844, con cocheras desplegadas, sin errores JS ni desborde horizontal. La revisión aisló WebGL para medir la interfaz; el nuevo modelo 3D se comprobó por código. Pendiente: conexión LAN física y simulación prolongada.

## Alfa 0.31 · turnos separados de colectivos

- Cada vehículo requiere dos conductores identificables: mañana 07:00–09:00 y tarde 17:00–19:00. Un residente no puede ocupar otra vacante al mismo tiempo. Una plaza de cochera solo se ocupa si ambos turnos operan. El costo y el aforo corresponden a la flota efectivamente dotada; los salarios de ambos conductores están incluidos en el costo operativo.
- Verificación LAN: dos colectivos asignaron cuatro residentes diferentes en tres recálculos; mantuvieron 60 plazas y $280/mes alquilados, o $220/mes en cochera. Una línea con un único candidato compatible no operó. Offline reprodujo la dotación, pausó y reanudó, y conservó cuatro residentes tras recarga.
- Chromium revisó el panel con los cuatro turnos abiertos a 1440×960 y 390×844: ningún texto quedó fuera del viewport, no hubo desborde horizontal ni errores JS. Para medir la interfaz se aisló el render WebGL. Pendiente: viaje de regreso como recorrido separado, horario completo, transbordos y prueba LAN entre dos computadoras.

## Alfa 0.32 · transbordos físicos

- Un residente puede usar dos líneas con una parada construida compartida. El selector verifica dirección, caminata de acceso, espera, tiempo de transferencia y aforo de ambos tramos. El viaje conserva IDs de líneas, parada, tarifa total y tiempo adicional. Cada línea cobra al hogar y contabiliza su pasajero. El acceso al auto se deriva establemente de la identidad del residente; quien no tiene auto camina o usa colectivo.
- Motor LAN: un intercambio entre Las Moreras y Mercado Central llevó siete pasajeros en dos líneas, con ingresos de $77 por línea y débito doméstico total de $154. Sin parada no hubo transferencias. Al reducir aforo a tres plazas por línea, ambas respetaron el límite.
- Offline: un trabajador asignado al Mercado Central cambió de línea en Intercambiador del Canal (+6 min, $0,50 por viaje). Al cierre mensual ambas líneas cobraron $11 al hogar. Se corrigió el cobro de pasajeros que no residen en el origen de la línea y el motivo de desempleo antiguo en trabajadores conservados.
- Chromium revisó el panel de transbordos abierto a 1440×960 y 390×844: sin error JS ni desborde horizontal. Para medir la interfaz se aisló WebGL. Falta probar LAN entre dos computadoras físicas, regreso vespertino separado y rendimiento con muchas líneas.

## Alfa 0.33 · billete integrado

- El segundo tramo cuesta 40% de su tarifa; con líneas de $0,25 se pagan $0,25 + $0,10 por viaje. Cada línea reconoce solo su parte y el hogar se debita por separado. El costo menor influye en la elección de itinerario. El informe expone tarifas por tramo y total.
- Motor LAN: un escenario de dos líneas con parada compartida asignó tres pasajeros con transbordo. La previsión fue $33 para el primer tramo y $12 para el segundo; el cobro real sumó $45, igual al débito doméstico. Otro escenario sin caja doméstica cobró $0 y conservó ese valor después de refrescar el estado, corrigiendo una previsión que antes reemplazaba el cobro.
- Offline: un viajero pagó $11 a la primera línea y $4 a la segunda en el cierre mensual; su itinerario publicado mostró $0,35 por viaje. Chromium revisó los importes y el panel abierto a 1440×960 y 390×844, sin desborde horizontal, texto oculto ni errores JS. Para medir la interfaz se aisló WebGL. La conexión LAN entre dos computadoras físicas continúa pendiente.


## Alfa 0.34 · regreso vespertino y aforo por sentido

- Online y Offline generan un registro de regreso por grupo hogar–empleo entre 17:00 y 19:00. El viaje revierte el trayecto matutino de bus cuando hay servicio y asiento; si no, vuelve a pie o en auto según acceso y distancia. No se duplica la reserva: la capacidad de tarde se calcula por separado.
- El día laboral ahora cuenta dos recorridos de autobús para emisiones y flota visible. Se expone el aforo de ida y vuelta en cada línea y se visualizan los vehículos desplazándose en ambos sentidos. Las ofertas de nuevos corredores se basan solo en la ida laboral para no duplicar destinos invertidos.
- La tarifa mensual considera ambos sentidos, aplica el descuento del segundo tramo en cada viaje y distribuye centavos por línea sin redondear cada tramo de forma que cobre de más al hogar. La recaudación se limita al efectivo disponible.

### Verificación Alfa 0.34

- `python3 -m py_compile server.py`, `node --check offline.js`, `node --check game.js`, `node --check world3d.js`, JSON de `release_notes.json` y `git diff --check` pasan.
- Smoke LAN: 203 trabajadores tienen viaje de vuelta; en un corredor activo el escenario asignó 16 pasajeros matutinos y 16 vespertinos, reservó 32 de 90 plazas diarias y registró previsión mensual de $176. El fallback sin colectivo produjo 203 regresos a pie o auto. El catálogo de nuevas líneas no incluyó rutas de regreso invertidas.
- Chromium Offline con la semilla local comprobó 203 viajes de ida y 203 de regreso, con 10 pasajeros en cada sentido de la línea fixture y $110 de ingreso previsto.
- El panel Movilidad en Chromium a 1440×960 y 390×844 queda dentro del viewport; no tiene desborde horizontal. El contenido largo conserva scroll vertical. Ida y vuelta y la ocupación por sentido son visibles; no se detectaron errores JS ni texto recortado.
- El test Chromium aisló WebGL con un stub de render para medir la interfaz. La escena 3D de colectivos se validó por el recorrido de animación; no se hizo una prueba visual de píxeles del render. La LAN entre dos equipos físicos sigue pendiente.


## Alfa 0.35 · horario y capacidad por franja

- Las salidas del bus se calculan en nueve franjas de dos horas entre 05:00 y 23:00. Cada una deriva su frecuencia del largo del recorrido y la cantidad de colectivos; las ventanas de menor demanda amplían el intervalo. Los asientos por salida fijan capacidad por franja y por sentido.
- Las personas se distribuyen de forma estable según su ID en tres turnos: temprano, matutino y mediodía. El regreso usa otro tramo horario y una reserva de aforo separada. Se actualiza el tiempo de espera, la alternativa de transporte y el costo del colectivo al cambiar de turno o franja. Dos conductores asignados por vehículo cubren 05:00–14:00 y 14:00–23:00.
- Se conserva un costo mensual base por unidad y se agregan $0,08 por salida programada fuera de las dos franjas pico, por día laborable (22 días). Movilidad muestra horario, frecuencia, salidas, asientos y pasajeros. Los viajes no laborales todavía no existen, aunque el servicio puede salir sin pasajeros en ventanas sin demanda asignada.

### Verificación Alfa 0.35

- `python3 -m py_compile server.py`, `node --check game.js`, `node --check offline.js`, `node --check world3d.js`, validación JSON y `git diff --check` pasan.
- En un corredor LAN fixture hubo 12 viajes matutinos y 12 regresos; siete franjas con salidas variables, 72 salidas programadas por sentido, aforo por ventana dentro del límite y cálculo consistente de tarifa mensual. Offline en el mismo corredor asignó siete viajes por sentido y el mismo catálogo de frecuencias.
- Se verificó que el tiempo de espera refleje la frecuencia de la franja y que los pasajeros no superen su aforo específico. Los conductores cubren dos turnos y las horas de baja frecuencia elevan el gasto operativo por salidas adicionales.
- Chromium, con WebGL aislado para medir la interfaz, abrió Horario diario en escritorio 1440×960 y móvil 390×844. Las nueve franjas se leen dentro del popup, el contenido largo mantiene scroll vertical y no hay desborde horizontal, texto cortado ni errores JavaScript.
- LAN en dos dispositivos físicos y una simulación urbana de larga duración siguen pendientes. La selección modal y horarios cubren desplazamientos laborales; la demanda no laboral, trenes, metro y carga aún faltan.


## Alfa 0.36 · viajes cotidianos a comercios

- Online y Offline generan visitas de hogares a comercios abiertos con acceso por calle. La selección ordena destinos por distancia y actividad reciente y rota de forma estable entre alternativas cercanas. Cada hogar produce una pequeña cantidad agregada de visitantes; el acceso familiar y la distancia determinan si el grupo camina o va en auto.
- El viaje de ida y vuelta entra en la movilidad diaria y en emisiones aproximadas; los autos suman flujo vial. La escena 3D anima hasta seis trayectos comerciales y el Resumen de Ciudad los separa de los viajes laborales. No se vuelve a debitar una compra: la economía comercial existente sigue siendo responsable de ventas y gastos.
- La UI Ciudad abre la vista general aun cuando el usuario dejó una parcela seleccionada. Los indicadores laborales se agrupan en Empleo para que no queden cortados al final del Resumen móvil.

### Verificación Alfa 0.36

- `python3 -m py_compile server.py`, `node --check game.js`, `node --check offline.js`, `node --check world3d.js`, validación JSON y `git diff --check` pasan.
- Smoke Online en la ciudad inicial: 6 comercios abiertos produjeron 15 rutas comerciales agregadas, 45 pasajeros, 12 viajes en auto de ida y vuelta y 20,52 kg de CO₂ estimado; la respuesta pública expuso esos datos.
- Chromium Offline revisó el resumen de movilidad en escritorio 1440×960 y móvil 390×844; el panel conserva scroll y no presenta texto oculto, solapamiento ni desborde horizontal. La escena se inspeccionó con WebGL activo para la animación.
- El número de visitas es una demanda diaria agregada inicial, no un reloj individual; todavía no modifica las compras ya liquidadas. LAN entre dos máquinas y una simulación larga siguen pendientes.


## Alfa 0.37 · viajes a centros cívicos

- Online y Offline agregan desplazamientos cotidianos desde los hogares a centros cívicos habilitados, separados de las compras y del viaje laboral. La cantidad estimada es el 5% de los ocupantes del hogar (mínimo uno, máximo dos); el centro más cercano rota entre alternativas accesibles. La distancia y el acceso familiar determinan caminata o auto.
- Los recorridos redondos suman emisiones y carga vial en Online. El mapa anima una muestra de viajes cotidianos con apariencia distinta para compras y servicios. Ciudad muestra pasajeros, recorridos y autos por motivo. No se cobra entrada ni se cambia la economía de los centros.

### Verificación Alfa 0.37

- `python3 -m py_compile server.py`, `node --check game.js`, `node --check offline.js`, `node --check world3d.js`, validación JSON y `git diff --check` pasan.
- Smoke Online en la ciudad inicial: 15 recorridos de compras/45 pasajeros y 15 recorridos cívicos/21 pasajeros; los servicios generaron 2 autos por ida y vuelta y 2,52 kg de CO₂ estimado. `public_state` expone los contadores.
- Chromium Offline a 1440×960 y 390×844 mostró el resumen con ambas clases de viajes. El panel cabe dentro del viewport, conserva scroll vertical, no desborda horizontalmente y no produjo errores JS. La selección de una parcela seguida por el botón Ciudad abrió “Una ciudad en marcha”, sin conservar el panel de parcela; la pestaña Empleo contiene ahora los cinco indicadores laborales apartados del Resumen.
- Sigue siendo demanda diaria agregada y no simula horarios, espera, entrada, uso de colectivos ni ocio; LAN física y simulación larga pendientes.


## Alfa 0.38 · terminal portuaria y comercio exterior inicial

- La costa este ahora admite una terminal en la franja edificable junto al agua. Se construye como contrato municipal largo de cinco etapas, con materiales y empresa Online, 14 trabajadores de obra y acceso por calle. Se permite una terminal municipal por ciudad.
- Una venta regional positiva crea un pedido de exportación de esa tienda. El camión avanza por la ruta vial hacia el puerto, se queda esperando si no existe ruta o el patio no tiene espacio, y almacena las unidades al llegar. El patio tiene 500 unidades.
- Con 60 unidades, y diez días como intervalo mínimo, zarpa un buque visible con hasta 180 unidades; la exportación se entrega dos días después. La tasa de $0,60/unidad entra a la tesorería municipal. Operación: $320/mes y 12 puestos de logística. El tablero Ciudad > Puerto presenta patio, pedidos, buques e ingresos. Online y Offline tienen el circuito y guardan el estado en esquema 22.

### Verificación Alfa 0.38

- Python: compilación y smoke Online generaron órdenes desde ventas regionales; prueba con 90 unidades avanzó el camión, despachó un buque y acreditó $54.
- Offline: se aceptó la terminal como contrato de 82 días con una cuadrilla de 14; prueba de exportación generó el viaje de barco y el ingreso portuario.
- Chromium en 390×844 mostró Ciudad > Puerto sin desplazamiento horizontal, sin desbordes de contenido ni elementos internos recortados; el tablero de construcción incluye la obra portuaria.
- La fase 23 es parcial: faltan importaciones, tipos de terminal, calado, dragado, capacidad de grúas, colas de atraque, acceso ferroviario, competencia portuaria y balance de pérdidas/ganancias específico. No se estima porcentaje global: sigue faltando una matriz estable de pesos y criterios que cubra las 34 fases.


## Alfa 0.40 · aeropuerto regional y viajes aéreos

- Fase 24 parcial: licitación por cinco etapas en una parcela con conexión vial, 16 trabajadores, materiales Online, terminal con 800 plazas mensuales y pista con 12 movimientos de vuelo al mes. La obra base cuesta $19.500 y tarda 112 días; operar cuesta $600/mes y agrega 18 puestos de trabajo.
- Aerolíneas del Litoral solo sirve una ruta si hay conexión vial, por lo menos cuatro trabajadores aeroportuarios, residentes con recursos para viajar y margen operativo esperado. La ciudad puede ofrecer la obra sin que eso garantice vuelos.
- Las llegadas generan visitantes diferenciados de la población residente. Una parte compra unidades en comercios alcanzables y con inventario; tasas por pasajeros/vuelos ingresan a la tesorería. La pista, terminal y una aeronave se ven en 3D. Online y Offline comparten el circuito. Guardado esquema 23.

### Verificación Alfa 0.40

- Python: compilación y smoke Online asignaron 18 trabajadores aeroportuarios, abrieron una ruta con 33 pasajeros, 16 visitantes y $207 de tasas; el paso de visitantes elevó ventas locales y `public_state` informó la operación.
- Offline: el contrato se acepta por 112 días con 16 trabajadores; en cierre mensual el aeropuerto empleó residentes, atendió 33 pasajeros y 16 visitantes, ingresó $207 y sumó las tasas al ingreso municipal.
- Chromium en 390×844: Ciudad > Aeropuerto quedó dentro del popup, sin desborde horizontal, texto recortado ni errores JavaScript. La subcategoría es navegable junto con Puerto y las demás áreas de Ciudad.
- Fase 24 parcial: faltan carga aérea, balances persistentes de aerolíneas, rutas múltiples, horarios, meteorología, ruido localizado, seguridad de emergencia y accesos terrestres de pasajeros. Porcentaje global aún no estimable; no hay matriz estable que pese las 34 fases.


## Alfa 0.40 · hoteles privados y actividad visitante

La fase 25 avanza de forma parcial. En Online y Offline se puede contratar un hotel con capital promotor, permiso municipal, contrato, cinco etapas y materiales (Online). Al abrir dispone de habitaciones, 48 plazas, 10 puestos y caja de operación. Solo recibe una parte de las llegadas aeroportuarias si hay vuelos activos y ruta vial conectada. Registra huéspedes, noches, ocupación, tarifa, salarios, gasto privado, resultado, caja e impuesto municipal del 5%. La tarifa reacciona a la ocupación y pérdidas persistentes cierran el hotel, liberan empleos y devuelven trabajadores a búsqueda.

Ciudad > Turismo presenta actividad y empresas; el modelo 3D identifica hoteles. No se contabilizan visitantes como residentes. La base todavía carece de eventos y temporadas, turismo no aéreo, atractivo cultural/natural, impactos de congestión/alquileres y reportes distritales. No se marca terminada la fase 25.

### Verificación Alfa 0.40

- `python -m py_compile server.py`, comprobación de sintaxis de los tres módulos JavaScript y `git diff --check` completadas.
- Prueba del contrato Online: el endpoint aceptó Hotel privado con Constructora Delta, capital privado y permiso; creó contrato de 76 días, 10 trabajadores, costo promotor de $13.992 y permiso de $1.584.
- Prueba de la acción Offline: creó el mismo proyecto privado de 76 días y 10 trabajadores en parcela conectada.
- Pruebas de cálculo: 100 llegadas operativas produjeron 45 huéspedes, 90 noches, $2.980 de resultado y $202 de tasa; una firma vacía continuó operando hasta agotar caja y cerró.
- Chromium en 390×844: la ventana Ciudad > Turismo mostró sus siete categorías sin recorte horizontal; el panel admite desplazamiento vertical para llegar a todo el contenido.
- Prueba física LAN y Vercel quedan pendientes en esta sesión; la simulación Online no se ejecutó como dos computadoras físicas.


## Alfa 0.41 · redes eléctricas y agua potable (fase 26, parcial)

Se agregaron redes separadas de tendido eléctrico y agua sobre calles. El mapa inicia con las calles existentes ya conectadas; las extensiones requieren conectar un tramo de calle a una línea previa y pagan un costo de instalación. La capacidad de base es 1.200 kW y 180 m³/día; pérdidas eléctricas del 6% y fugas del 8% reducen el suministro utilizable. La demanda depende del uso de hogares, comercios, hoteles, terminales y edificios públicos, y sube en verano. La asignación prioriza salud y viviendas.

El jugador puede licitar una central (900 kW, 18 empleos, $460/mes) y una planta potabilizadora (220 m³/día, 12 empleos, $340/mes). Para aportar capacidad cada planta debe tocar una red conectada de ambos servicios. Los déficits bajan el indicador de servicios y, con cobertura crítica, la aprobación; ventas privadas, huéspedes y vuelos también dependen de la cobertura. Ciudad > Servicios informa unidades, pérdidas, conexiones y mantenimiento. El modo Offline replica acciones y balance.

### Verificación Alfa 0.41

Verificada sintaxis Python/JavaScript, migración de guardados a esquema 26, balance inicial de los dos servicios, tendido conectado y desconectado, costo de mantenimiento, déficits y efectos en actividad. Se comprobó en servidor el alta de un contrato de central eléctrica con sus cinco etapas y plazo de 96 días; las capacidades de ambos tipos de fuente se verificaron por balance. No se esperó en esta entrega el plazo completo hasta su inauguración. La inspección visual de Ciudad > Servicios cubrió móvil y escritorio sin desbordes. LAN entre equipos físicos sigue pendiente.

Alcance restante de fase 26: saneamiento, drenaje pluvial, recolección de residuos, gas, telecomunicaciones, reparación de fugas, redundancia y dependencia detallada de bombeo.


## Alfa 0.42 · red cloacal y depuración (fase 26, parcial)

Se incorporó una tercera red física, separada de energía y agua potable, que utiliza colectores colocados sobre calles conectadas. La demanda de cloacas deriva del 80% del agua potable realmente suministrada. La capacidad de tratamiento base es 180 m³/día; el flujo que no conecta o supera esa capacidad se informa como descarga sin tratar. La falta de tratamiento reduce cobertura de servicios y, en niveles severos, aprobación; también afecta el factor de actividad de comercios, hoteles y aeropuerto.

La planta depuradora se licita como obra municipal de cinco etapas, 90 días base, 14 trabajadores, $16.600 y operación de $380/mes. Aporta hasta 260 m³/día únicamente con conexión a electricidad, agua potable y colector cloacal. Los tendidos tienen costo y mantenimiento separados. Ciudad > Servicios muestra generación, tratamiento, desborde, conexiones y fuentes. Online y Offline replican el balance.

### Verificación Alfa 0.42

Se verificaron balances iniciales, carga que excede la capacidad, edificios sin conexión cloacal, falta de suministro de agua, efecto sanitario, licitación y rechazo de tendidos aislados en Online y Offline. Se revisó Servicios y el panel de construcción en móvil y escritorio para confirmar visibilidad y desplazamiento sin solapamiento. LAN entre equipos físicos sigue pendiente.

Al cerrar Alfa 0.42, la fase 26 continuaba parcial: drenaje pluvial, residuos, gas, telecomunicaciones, reparación, redundancia y respaldo seguían pendientes.


## Alfa 0.43 · drenaje pluvial (fase 26, parcial)

Guardados previos migran al esquema 28 y obtienen colectores pluviales siguiendo la red cloacal existente. Los nuevos tramos se colocan sobre calles conectadas desde la salida regional por $155, con $0,70/mes de mantenimiento. Capacidad base: 3.300 m³/día, más 18 m³/día por tramo conectado. El clima cíclico produce 5 mm de lluvia en los días 7 y 8 de cada ciclo de 24 días y 18 mm el día 18. La escorrentía de las parcelas edificadas y calles se pondera por tipo de suelo generado reproduciblemente. Agua no conectada y excedentes causan anegamiento, daños por tormenta y reparaciones; las consecuencias recaen en propietarios, empresas y municipio según quién tenga el activo.

### Verificación Alfa 0.43

Python/JavaScript y JSON pasan validación sintáctica. El servidor confirmó tiempo seco y tormenta, escorrentía y captación por capacidad, daños idempotentes en el día de tormenta y anegamiento al desconectar el drenaje. Offline avanzó al día de tormenta, aplicó el impacto una sola vez y cobró correctamente $155 por un nuevo tramo conectado. Chromium móvil (390×844) mostró Ciudad > Servicios sin desbordamiento horizontal; el contenido excedente queda dentro del área desplazable. No se verificó esta versión en escritorio ni LAN entre equipos físicos.


## Alfa 0.44 · recolección y disposición de residuos (fase 26, parcial)

Guardados previos migran al esquema 29. La producción diaria responde a población residente, empleo por actividad y huéspedes; el municipio tiene una flota inicial de 1,15 t/día. Los depósitos conectados aportan camiones/capacidad. El relleno de disposición regional tiene 900 t finitas; una obra nueva añade 1.800 t y tarda 72 días base. Su licitación cuesta $9.800, requiere 12 trabajadores y materiales de obra; la operación de cada relleno cuesta $420/mes. La flota, la disposición por tonelada y el mantenimiento entran en el balance municipal. Cuando queda basura pendiente, se acumula en parcelas del mapa; al cruzar umbrales documentados, afecta servicios y apoyo ciudadano. Los residuos vuelven a recogerse cuando aumenta la capacidad de disposición. El mapa muestra camiones municipales y pilas si hay retraso.

### Verificación Alfa 0.44

El servidor produjo 0,72 t/día ante 1,15 t/día de recolección, almacenó residuos sin crear basura pendiente y actualizó el costo. Con un relleno lleno, la flota dejó basura en calles; un depósito elevó la capacidad de 1,15 a 1,90 t/día y una obra habilitada amplió la disposición total de 900 a 2.700 t. Con 50 t pendientes, el cierre mensual redujo servicios. Online y Offline adjudicaron el relleno por etapas con 12 trabajadores y finalizaron una entrega acelerada de prueba con los 1.800 t y puestos esperados. Chromium comprobó la interfaz de Servicios y la herramienta en móvil (390×844) y escritorio (1440×900): no hubo desbordamiento horizontal ni etiquetas cortadas, y el panel desplazable expone todo el contenido. LAN entre equipos físicos continúa pendiente.


## Alfa 0.45 · recuperación de residuos (fase 26, parcial)

La planta de reciclaje es un contrato público por etapas de $14.800 y 88 días base. Al habilitarse agrega 16 vacantes, requiere calle conectada y demanda 32 kW y 6 m³/día dentro del balance de redes. Procesa hasta 1,25 t/día y separa como máximo 35% de los residuos recogidos. El tonelaje recuperado evita disposición final y genera $18/t de ingreso para la ciudad; su operación cuesta $650/mes. El flujo restante sigue ocupando capacidad del relleno.

### Verificación Alfa 0.45

Se comprobaron sintaxis de Python/JavaScript, migración a esquema 30 y simulación Online/Offline de capacidad de reciclaje, volumen dispuesto, ingresos y costos. Chromium verificó Servicios en 390×844 y 1440×900: el panel permite desplazarse por todo el contenido, no hay desborde horizontal ni etiquetas cortadas. La herramienta Planta de reciclaje queda visible en el menú Construir móvil; sin errores JavaScript.


## Alfa 0.46 · redes de gas y telecomunicaciones (fase 26, parcial)

- Gas y fibra óptica son redes físicas independientes sobre calles. Solo cuentan tramos contiguos al suministro inicial; los edificios necesitan contacto con un tramo conectado.
- Gas tiene demanda en hogares, comercios, hoteles y nodos de transporte; fibra sirve hogares, comercios y servicios. Capacidad aumenta por segmento conectado y se factura mantenimiento mensual.
- La falta de cualquiera de estas redes reduce el factor de actividad comercial/hotelera. Online y Offline comparten el balance y la acción de construcción. Guardados migran a esquema 31.
- Ciudad > Servicios incluye demanda, capacidad, entrega, conexiones, faltantes y costo. Dos nuevas capas 3D y herramientas permiten construir cada tendido.
- Verificado: compilación/sintaxis de Python y JavaScript, balance de inicio, migración y edición de tramos. Pruebas de interfaz en móvil y escritorio documentadas al cerrar entrega. LAN física pendiente.


## Alfa 0.47 · averías y reparación de redes (fase 26, parcial)

- Un tramo de una red conectada puede fallar si la inundación alcanza su calzada. La avería conserva red, coordenada, día y causa; la resolución BFS excluye el segmento, interrumpiendo las conexiones aguas abajo.
- Ciudad > Servicios permite asignar una cuadrilla desde el presupuesto común. Según la red, reparar cuesta $460–720 y tarda tres días; el avance se guarda por día y el servicio se restablece al finalizar. Acciones simultáneas no duplican cuadrillas ni pagos.
- El informe muestra averías activas y el mapa marca el segmento rojo en la capa correspondiente. Online y Offline comparten comportamiento. Migración al esquema 32.
- Verificado: compilación/sintaxis, corte y restauración en ambos modos, acción HTTP Online, y render móvil/escritorio con estado de reparación. Pendiente: prueba LAN física; fase 26 aún necesita respaldo y redundancia.

## Verificación Alfa 0.48

- Contenedor instalado en calle: inversión compartida $350, capacidad de recolección +0,15 t/día, persistencia en el guardado y objeto visible en el mapa. Se rechaza sin débito si la parcela no es calle o ya tiene contenedor.
- Depósito municipal conectado: estación con 12 t y despacho diario de 1,5 t hacia reciclaje/disposición; los cuellos de botella conservan toneladas en transferencia o calle. Panel de Servicios actualizado. Pruebas HTTP Online: contenedor instalado por $350; el duplicado devuelve 409 y conserva dinero/estado. Offline: mismas reglas, capacidad y persistencia local comprobadas. Simulación con relleno lleno confirmó buffer de transferencia limitado a 12 t y acumulación urbana en ambos motores. Chromium cargó WebGL sin errores JS en escritorio (1440×900) y móvil (390×844); el panel de Servicios y la lista de construcción no tienen desborde horizontal. La LAN física permanece sin verificar.
