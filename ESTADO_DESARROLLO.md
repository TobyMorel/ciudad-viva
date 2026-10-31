# Estado de desarrollo · Ciudad Viva

**Entrega:** Alfa 0.22 · 31 de octubre de 2026
**Especificación:** roadmap adjunto de 34 fases (0–33). La base implementada continúa desde las alfas anteriores.

## Implementado

- Alfa 0.19: Banco Cooperativo con $42.000 de liquidez y crédito por empresa limitado por dotación. Las tiendas pueden usarlo para nómina, gastos e insumos; cobran interés mensual, pagan desde excedentes y devuelven capital. Dos meses seguidos sin cubrir intereses llevan al cierre y liberan vacantes; los empleados afectados pasan a búsqueda laboral con registro de su anterior empleador. Migración de esquema 15 a 16. En Offline, la misma mecánica opera desde el navegador.
- Alfa 0.20: mapa a pantalla principal, herramientas y reportes en ventanas emergentes, dock compacto adaptativo y cronología paginada de 0.1 a 0.20. El código disponible conserva detalle desde 0.10; 0.1–0.9 aparecen con una nota explícita de archivo perdido. La ventana Cambios se actualiza desde `release_notes.json`.
- Alfa 0.21: el desempleo conserva inicio, causa y empleador previo; al contratar se registra la duración individual. Online y Offline reportan buscadores, vacantes y esperas con guardado esquema 17.
- Alfa 0.22: perfiles estables de comercio, administración y logística y salario mínimo esperado por residente. Los centros laborales publican salario y requisito; las vacantes solo aceptan candidatos cualificados, con salario aceptable y ruta. El informe cuenta a quienes buscan por falta de cualificación, salario o acceso. Offline usa el mismo filtrado con distancia aproximada. Guardado esquema 18. Esto implementa una primera capa de la fase 21, no educación ni formación.

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
- Los residentes trabajadores ya tienen identidad, empleador y niveles básicos de habilidades; aún comparten caja por vivienda y no tienen horarios, contratos, educación, capacitación, evolución de competencias o búsqueda estratégica. El salario mínimo esperado no cambia por familia. Los viajes laborales están agrupados; los autos y peatones ambientales siguen decorativos.
- Los perfiles laborales diferencian comercio, administración y logística, pero aún no hay ocupaciones internas, negociación ni trayectoria profesional; educación y formación no producen nuevas competencias. Las empresas comerciales ya tienen caja, inventario, producción, ventas, costos y quiebra; faltan proveedores productivos identificables y encadenamiento entre empresas. Los viajes y la asistencia siguen agregados, sin horarios ni decisiones individuales de ruta; también faltan salarios reales de cuadrillas.
- No están implementados electricidad, agua, cloacas, residuos, transporte público funcional, elecciones, puertos, aeropuertos, turismo, clima, patrimonio o simulación por décadas.
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
