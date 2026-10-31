# Ciudad Viva · Alfa 0.62

Simulador municipal cooperativo con cámara 3D isométrica, obras por etapas, materiales, cuadrillas y migración condicionada por vivienda y empleo. La escena usa Three.js, incluido en `vendor/`; después de descargar el paquete, el juego funciona sin Internet ni npm.

## Roadmap

La especificación original de jugabilidad, con sus 34 fases y criterios, está incluida en [ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md](ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md).

## Modos de juego

Al abrir la página se puede elegir **Offline** u **Online · red local**. Online ofrece **Crear sala**, **Unirse a sala** y **Ver salas públicas** en la red local. El anfitrión inicia el servidor con el archivo de doble clic y crea la sala desde su navegador; otros jugadores usan la IP local o una sala anunciada en la misma red. La lista LAN usa anuncios UDP entre servidores locales y no depende de Internet. Vercel no puede alojar la sala: desde esa página los invitados deben abrir la IP del anfitrión. Offline funciona en Vercel y guarda la ciudad en el almacenamiento local del navegador. Incluye calendario, parcelas, zonificación y obras con progreso por etapas. Los comercios compran materia prima a proveedores privados con stock, precio y demora; los clientes se distribuyen según precio y acceso. El Banco Cooperativo ofrece crédito comercial de liquidez limitada: las firmas pagan intereses y amortizan con excedentes, y la mora persistente puede cerrarlas y dejar trabajadores buscando empleo. El mercado laboral asigna por habilidad básica, salario esperado y accesibilidad; los reportes muestran causas de búsqueda y requisitos por centro laboral. La Ciudad permite contratar formación municipal para hasta seis personas, por dos ciclos mensuales, con presupuesto reservado, avance de habilidad y control de pausas/cancelación. Online usa rutas viales; en los viajes laborales, el trayecto corto se hace a pie y el largo en auto; el tiempo puerta a puerta y las emisiones aproximadas se muestran en Ciudad. Autos y peatones siguen rutas laborales distintas. La pestaña Ciudad permite comprar de uno a tres colectivos para un corredor laboral, con 30 asientos por vehículo, frecuencia por recorrido y franja horaria (05:00–23:00), tarifa de $0,25 por viaje y costo operativo de $140/mes por vehículo. Las líneas hacen paradas automáticas junto a hogares y empleos sobre el recorrido, y pueden servir varios pares de origen y destino. Los viajes se distribuyen en turnos estables por residente: ida temprana, matutina o de mediodía y regreso vespertino o nocturno. Nueve franjas muestran frecuencia, espera, salidas y asientos disponibles; cada sentido reserva aforo propio y cambia de ruta/horario según el turno. Los hogares pagan el boleto mensual hasta el efectivo disponible; las rutas muestran aforo por sentido, paradas y flota, y pueden pausarse, reanudarse o retirarse. Online y Offline usan la misma lógica. Las paradas de colectivo ahora se licitan y construyen junto a una línea activa: requieren parcela, cuatro trabajadores y 18 días base, ajustados por la constructora; el refugio aparece en 3D, modifica el recorrido y cuesta $25 mensuales de mantenimiento. Online consume áridos, madera y componentes de obra; Offline conserva el inventario simplificado pero completa el contrato por etapas. Las líneas emplean conductores en dos turnos amplios y admiten transbordos construidos con tarifa integrada. Los colectivos siguen siendo transporte laboral de hora pico; faltan viajes no laborales, trenes, metro y carga. Offline usa rutas BFS aproximadas sobre la cuadrícula local. Los pedidos de materiales de obra y rescate siguen requiriendo el servidor. Para compartir una ciudad, elegí Online y abrí la dirección LAN del equipo anfitrión.

## Movilidad cotidiana · Alfa 0.36

Además de los viajes al empleo, hogares con acceso vial generan recorridos de compras hacia comercios abiertos. La elección prioriza cercanía y actividad comercial reciente, alterna entre destinos accesibles, estima peatones o autos según distancia y acceso familiar, y registra el regreso, emisiones y presencia animada en la escena. El resumen de Ciudad los muestra por separado. Es una primera capa de demanda no laboral: todavía no compra productos de nuevo ni contempla ocio, salud, educación, bicicletas o transporte público para esos viajes.

## Aeropuerto regional · Alfa 0.39

El aeropuerto se licita como obra municipal de cinco etapas ($19.500 y 112 días base) con materiales Online y una cuadrilla de 16. Exige una parcela conectada a la red vial. Al terminar, habilita una terminal de 800 pasajeros al mes y una pista de hasta 12 vuelos mensuales; incorpora 18 empleos aeroportuarios y cuesta $600 mensuales. Aerolíneas del Litoral programa vuelos solo si hay al menos cuatro trabajadores, viajeros potenciales y margen previsto para cubrir el costo de ruta. Cada pasajero y vuelo aporta tasas municipales. La mitad de los pasajeros que llegan se registra como visitantes; una parte compra bienes en comercios conectados con inventario. El terminal y una aeronave aparecen en el mapa 3D. Esta primera implementación no incluye carga aérea, conexiones por aerolínea persistentes, horarios de vuelo, meteorología, ruido zonal ni viajes terrestres individuales al aeropuerto.

## Puerto comercial · Alfa 0.38

La terminal portuaria es un contrato municipal por etapas junto a la costa este y una calle conectada. Los comercios convierten sus ventas regionales en pedidos; camiones llevan las unidades al patio del puerto por calles reales. Un patio de 500 unidades, cuadrilla logística de 12 puestos y costo fijo de $320/mes ponen límites a la operación. Al reunirse 60 unidades puede zarpar un barco de hasta 180; la tasa aporta $0,60 por unidad al presupuesto y el cargamento tarda dos días en llegar al mercado regional. El muelle, grúa, contenedores y buques se ven en el mapa. Online y Offline guardan pedidos y viajes. Esta primera parte no incluye importaciones, tipos de carga, dragado, atraque, tren de mercancías ni competencia entre puertos.

## Viajes cotidianos · Alfa 0.37

Además de las visitas a comercios, los hogares accesibles generan viajes a centros cívicos habilitados. El motivo se informa por separado, estima pasajeros y modo a pie/auto, suma emisiones y aparece como recorridos animados. No añade un cobro de entrada. El ocio y destinos recreativos todavía no existen como edificios funcionales.

## Iniciar

Requiere Python 3.9 o posterior y un navegador moderno con WebGL.

- Windows: doble clic en **Iniciar Ciudad Viva.bat**.
- Linux/macOS: abrir **Iniciar Ciudad Viva.sh** desde el explorador; si no arranca, usar su opción “Ejecutar”.

El iniciador abre el servidor local y el navegador. El servidor se necesita para compartir, guardar y cargar una ciudad LAN; Offline funciona desde `index.html` con almacenamiento del navegador. Para invitar, el anfitrión deja el iniciador abierto y comparte la dirección LAN indicada en la ventana Ciudad. El firewall y la red Wi-Fi deben permitir conexiones entre dispositivos.

## Cambios y próximas entregas

La barra compacta sobre el mapa abre paneles emergentes y un interruptor de sonido local. Ciudad se divide en Resumen, Movilidad, Empleo, Formación, Puerto, Aeropuerto, Turismo y Servicios. La barra compacta abre paneles emergentes para construir, consultar la ciudad, revisar economía, obras, acontecimientos y cambios. El historial **Cambios** cubre Alfa 0.1–0.47 con cinco versiones por página. Las notas 0.1–0.9 se señalan como no conservadas porque esos registros no están en la historia disponible. El contenido vive en `release_notes.json` y se actualiza en cada publicación.

## Controles

Arrastrá para mover la cámara, rueda o botones para acercar y alejar, y `Q` / `E` para girar. En móvil, arrastrá el mapa y usá los controles sobre la escena. `1–6` seleccionan herramientas; `Esc` vuelve a inspección.

Una calle nueva debe conectarse a la red. Viviendas y comercios requieren calle y zonificación compatible. Las ofertas comparan precio, duración, calidad, cumplimiento, materiales y trabajadores disponibles. Las obras consumen insumos por etapa; sin materiales se detienen. La herramienta Depósito municipal permite licitar un almacén con cuadrilla e insumos: al abrirse agrega 500 unidades de capacidad y cuesta $180/mes operarlo. Los pedidos reservan espacio en el destino elegido desde el despacho. El patio inicial y cada depósito tienen inventarios separados; solo las obras conectadas por calles retiran materiales de un depósito concreto. Desde cada obra se pueden cotizar y pedir insumos a tres proveedores con inventario, precio y demora distintos; los camiones siguen rutas viales y muestran retrasos si pierden acceso o comparten arterias congestionadas. El tiempo estimado se recalcula durante el viaje; el camión visible avanza al mismo ritmo que la simulación. La descarga espera operarios y autoelevador disponibles; volumen y capacidad de manejo de cada contratista determinan el plazo. Podés marcar una orden como prioridad alta para adelantarla en la cola al llegar. La cola también identifica una entrega que completa el material necesario para continuar una etapa detenida; los días en espera y la exposición estimada del contrato se muestran como información, sin débito adicional. Pausar libera trabajadores, y reanudar vuelve a comprobar la dotación. La calidad de las calles cambia su mantenimiento y la del centro de salud cambia su cobertura y operación.

La migración mensual se limita por plazas de vivienda vacantes y capacidad de empleo. Los residentes en edad laboral buscan vacantes con acceso vial y cada uno se asigna a un empleador. La congestión reduce su asistencia, el salario recibido y la nómina pagada por su empleador. La nómina privada se transfiere desde la empresa y la pública desde el presupuesto municipal a la caja del hogar; las compras locales descuentan dinero familiar. Comercios mantienen caja, inventario, ventas, producción y nómina, y pueden quebrar y eliminar sus vacantes. Cada residente incorporado aumenta ingresos tributarios; la salida reduce población e ingresos. El anfitrión controla el reloj y el guardado; todos pueden planificar en la misma ciudad.

## Alcance

La alfa incluye vista 3D generada localmente, localidad inicial con 22 edificios, cámara giratoria, tráfico ambiental, calendario, presupuesto, vivienda, calles, zonificación, licitaciones, constructoras, depósitos logísticos, pedidos logísticos, inventarios, trabajadores por contrato, servicios municipales, guardado y sincronización LAN por HTTP.

Pendientes: niveles educativos, hospitalización y ambulancias, seguridad pública y programas sociales, hacienda plurianual, contratos y horarios, habilidades avanzadas, demanda diferenciada, agentes ciudadanos, redes completas de saneamiento/drenaje/residuos/gas/telecomunicaciones, gobierno y elecciones, mapas ampliables y validación de LAN entre dos equipos físicos. La asignación individual ya filtra por habilidades básicas y salario esperado; los recorridos aún se muestran agrupados por hogar y destino.

## Publicación en Vercel

Esta versión no se puede jugar desplegando solo los archivos estáticos: el navegador necesita la API autoritativa de `server.py` para el reloj, acciones, guardado y sincronización. Vercel no mantiene ese proceso Python activo entre solicitudes, y no ofrece la sala LAN local del iniciador. La opción Offline usa simulación local del navegador; la opción Online requiere abrir una instancia servida por el anfitrión LAN. Para jugar hoy, ejecutá el iniciador incluido en una computadora anfitriona; para una versión web en Vercel hace falta separar la simulación y persistir su estado en un backend durable. Eso también cambiaría el requisito de multijugador exclusivamente LAN si ese backend fuera público.

Para desplegar el sitio estático en Vercel, usá el repositorio raíz como proyecto y el preset **Other**, sin comando de build ni directorio de salida personalizado. La cuenta de Git que crea los commits debe usar un correo verificado y asociado a GitHub; el proyecto Vercel también debe permitir despliegues de esa cuenta.

La **cochera municipal** se construye desde Herramientas (tecla 7). Tiene cuatro plazas y mantenimiento de $50/mes; cada colectivo alojado reduce su costo operativo de $140 a $110/mes. Las líneas conservan plazas alquiladas cuando no hay cochera accesible.

Cada colectivo requiere dos conductores distintos para cubrir los turnos de mañana y tarde. La línea solo opera con ambos puestos asignados; Movilidad identifica los turnos de cada unidad.

Los **transbordos** necesitan una parada construida accesible a dos líneas. Cada tramo ocupa aforo y cobra su tarifa; el panel Movilidad muestra viajeros, parada y tiempo adicional. El acceso al auto se asigna de forma estable a cada residente, por lo que la elección modal tiene una causa verificable.

El **billete integrado** de un transbordo cuesta $0,35 por viaje con tarifa base: $0,25 para la primera línea y $0,10 para la segunda. Ambas líneas registran su parte del cobro mensual y el hogar paga el total.


## Bomberos y emergencias · Alfa 0.56

Los cuarteles se licitan como obra pública por $11.200 y 74 días base; el modo Online compra y entrega materiales. Una estación suma 12 vacantes que requieren perfil Bomberos (48 puntos), $950 de operación mensual y hasta tres dotaciones de cuatro. La formación municipal puede desarrollar esa habilidad. El riesgo urbano se revisa cada mes y aumenta con la cantidad de inmuebles, el calor y la sequía. Los despachos eligen la estación accesible más cercana; el viaje por calle determina daño y la dotación queda ocupada dos días. Sin personal o ruta, el fuego deteriora el inmueble y, si arde cinco días, reduce servicios y apoyo. La pantalla Ciudad > Bomberos informa cobertura, dotaciones, tiempo y daños; el cuartel, las llamas y el camión de respuesta tienen representación 3D. Online/Offline comparten la mecánica. Offline aún no compra ni entrega materiales de obra. La fase 28 continúa parcial; faltan ambulancias, hospitalización, seguridad pública y protección social.

## Turismo y hoteles · Alfa 0.40

Construí un hotel privado junto a una calle conectada. La empresa financia la obra por etapas, abre habitaciones, contrata trabajadores y necesita caja para pagar salarios y costos. Solo recibe huéspedes cuando opera el aeropuerto; tarifas, ocupación, gasto e impuesto se muestran en Ciudad > Turismo. Sin visitas rentables, el hotel puede cerrar. Esta es una primera parte de la fase 25: todavía faltan eventos, temporadas, atractivos y presiones territoriales.


## Redes de servicios · Alfa 0.41

La red inicial aporta 1.200 kW y 180 m³/día antes de pérdidas. Construí líneas eléctricas y tuberías sobre calles terminadas, conectándolas desde la red existente; los edificios aislados no reciben servicio. La demanda aumenta con hogares, camas, comercios, terminales y servicios públicos, con mayor consumo estacional. Las pérdidas eléctricas y fugas reducen lo entregado; los déficits afectan servicios, comercios, hoteles y operación aeroportuaria.

Las licitaciones permiten construir una central eléctrica de 900 kW y una planta potabilizadora de 220 m³/día. Cada fuente debe estar conectada a ambas redes para aportar capacidad. El panel Ciudad > Servicios presenta demanda, suministro, cobertura, pérdidas, conexiones y mantenimiento. Esta primera parte de la fase 26 todavía no modela saneamiento, drenaje, residuos, gas, telecomunicaciones, reparación ni redundancia.


## Cloacas y depuración · Alfa 0.42

El agua potable consumida genera aguas residuales. Los edificios conectados a colectores aportan ese caudal a una capacidad de depuración limitada; el resto se registra como descarga sin tratar. La falta de tratamiento reduce cobertura sanitaria y puede bajar servicios y aprobación. El panel Ciudad > Servicios informa caudal, capacidad, tratamiento, descarga y edificios conectados.

Construí colectores cloacales sobre calles terminadas. La planta depuradora se licita por etapas, necesita operarios y debe conectarse a electricidad, agua y cloacas para sumar hasta 260 m³/día. Las redes de cloaca, agua potable y pluvial son sistemas distintos. En esa entrega seguían pendientes el drenaje, residuos, gas y telecomunicaciones; el drenaje pluvial se incorporó en Alfa 0.43.


## Drenaje pluvial · Alfa 0.43

La fase 26 suma lluvia y escorrentía superficial como circuito físico aparte de las cloacas. La lluvia vuelve cada 24 días: 5 mm en los días 7 y 8, y una tormenta de 18 mm en el día 18. Calles, edificios y terreno determinan el escurrimiento. Los tramos conectados captan hasta 3.300 m³/día de base más capacidad por segmento; la parcela sin drenaje o el exceso de capacidad puede anegarse. Los impactos de tormenta dañan estructuras y calles, consumen caja privada/pública y afectan servicios y aprobación si el evento alcanza escala suficiente. El panel Servicios detalla el balance y la capa azul muestra la red y los anegamientos. Online y Offline usan reglas equivalentes.


## Residuos y reciclaje municipal · Alfa 0.45

La fase 26 incorpora generación diaria por hogares, empleo privado y público, y huéspedes. El servicio inicial recoge hasta 1,15 toneladas por día; un depósito municipal conectado aporta un camión y 0,75 t/día adicionales. La disposición regional comienza con un cupo finito de 900 toneladas. Un relleno sanitario se licita por $9.800, tarda 72 días base, necesita 12 trabajadores y amplía el cupo en 1.800 toneladas.

Cuando la flota no alcanza o se llena la disposición final, los residuos quedan pendientes y aparecen en parcelas viales. Si el retraso supera 3,5% de la población en toneladas (con mínimo de 8 t), los servicios pierden un punto por mes; al superar 12% (mínimo 30 t) cae además la aprobación. La ampliación recupera capacidad de recolección de la basura pendiente. El costo mensual incluye flota, toneladas recibidas y rellenos activos. Ciudad > Servicios muestra las fuentes, carga, capacidad, relleno, camiones y operación. Las instalaciones y los camiones aparecen en el mapa 3D.

Alfa 0.45 añade una planta municipal de reciclaje como obra pública de $14.800 y 88 días base, con 16 puestos. Si tiene acceso vial y conexión a electricidad y agua, procesa hasta 1,25 t/día, recupera hasta 35% de la recolección, reduce el ingreso al relleno y vende el material por $18/t. La operación cuesta $650/mes. Online y Offline comparten el balance. Aún faltan separación doméstica, categorías de materiales, contenedores, estaciones de transferencia y firmas privadas de reciclaje.


## Redes de gas y telecomunicaciones · Alfa 0.46

La fase 26 incorpora tuberías de gas y fibra óptica tendidas en calles terminadas. La conexión de cada edificio se calcula por continuidad física desde la red base; cada segmento suma capacidad y mantenimiento municipal. Gas y conectividad aportan demanda propia de hogares, comercios, turismo y servicios. Los negocios con acceso deficiente producen menos, y el panel Ciudad > Servicios muestra demanda, entrega, conexiones, faltantes y costo mensual. Las herramientas tienen capas 3D para inspeccionar el trazado. Las ciudades anteriores reciben redes iniciales al migrar al esquema 31.


## Averías y reparación de redes · Alfa 0.47

Las tormentas pueden anegar calles donde pasan tendidos conectados y averiar un tramo. El tramo averiado queda fuera de servicio; la conectividad y el suministro se recalculan por continuidad, así que los edificios aguas abajo pueden perder servicios. Ciudad > Servicios muestra red, causa, ubicación y presupuesto requerido. Al asignar una cuadrilla se paga el costo indicado y la reparación demora tres días; al concluir, la línea vuelve a transportar suministro. El tramo dañado se marca en rojo al inspeccionar la capa de esa red. Disponible en ambos modos y compatible con ciudades anteriores (esquema 32).


## Alfa 0.58 · Hacienda municipal

En **Economía y suministros** se pueden solicitar créditos municipales de inversión con tasa y cuotas visibles. El capital se acredita a caja; la amortización reduce la tesorería en cada cierre mensual. La vista muestra deuda, servicio y proyecciones de 12/48 meses con bases constantes. Online y Offline comparten los montos, límites de solvencia y plazos.


## Alfa 0.62 · patrimonio urbano

En **Ciudad → Patrimonio** se puede inventariar y proteger ocho edificios históricos del Centro y del barrio Estación. Cada ficha muestra época, uso original, reformas, estado, ocupación y relevancia; la protección preserva el uso, añade identidad cultural y reduce el deterioro anual. Rehabilitar exige elegir una constructora, pagar materiales que salen del proveedor y contratar cuatro trabajadores. La entrega regional tarda y la obra avanza por etapas; una inspección final mejora la conservación y registra la reforma. Funciona en Offline y Online. Los barrios de varias épocas, reconversión de fábricas, dinámica de alquileres y desplazamiento gradual aún están pendientes.

## Alfa 0.61 · presupuestos municipales por programa

En **Economía y suministros → Hacienda**, asigná hasta 200% del costo mensual a Servicios públicos, Redes y residuos o Transporte, con controles de 10 puntos. Cada cierre paga según asignación y caja; la parte impaga queda como obligación del programa. Los recortes reducen servicios sanitarios y educativos, capacidad de redes y recolección, o la capacidad/frecuencia efectiva de colectivos. Presupuestar por encima del costo ayuda a saldar obligaciones anteriores. Funciona en Offline y Online; el panel incluye un resumen mensual plegable.

## Alfa 0.60 · fondo de deuda municipal

Hacienda permite apartar dinero no comprometido para las cuotas municipales. Al cierre, el fondo cubre el faltante exacto del servicio de deuda si alcanza; el resto de la tesorería conserva caja y compromisos separados. Funciona en Online y Offline, y se guarda con la ciudad.

## Alfa 0.59 · impuestos municipales

En **Economía y suministros → Hacienda** podés ajustar los gravámenes sobre viviendas y ventas. La ciudad factura según población y actividad registrada; hogares y negocios pagan desde el efectivo disponible, y los faltantes quedan en mora. La tesorería suma lo efectivamente cobrado. Las tasas afectan compras de hogares y liquidez de comercios.
