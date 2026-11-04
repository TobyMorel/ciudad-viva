# Ciudad Viva · Alfa 0.266

**Impactos ambientales por barrio (0.266):** el informe **Clima** muestra índices locales de aire, ruido y calor, vinculados con recorridos, emisiones estimadas, fábricas y obras activas, parques y sombra vegetal. Las capas de aire, ruido, calor y anegamiento colorean las calles para localizar sectores con presión ambiental o exposición pluvial. Los parques amortiguan parcialmente calor y contaminación; el drenaje reporta su cobertura y anegamientos presentes. La exposición al aire eleva de forma moderada la demanda agregada de salud primaria. Los índices comparan barrios dentro de la ciudad y no son mediciones científicas. Disponible en partidas Offline y LAN.

# Ciudad Viva · Alfa 0.265

**Faros reales y fauna en vuelo (0.265):** los faros ya no muestran esferas: luces puntuales reales iluminan la calle, sin sombras dinámicas y con un presupuesto acotado que prioriza los vehículos cercanos. Gaviotas y palomas toman rutas amplias sobre la ciudad con tiempos escalonados; las mariposas revolotean dentro de los parques. Los barcos conservan su ubicación sobre el río y la flotación suave. Todo es visual y no altera la simulación ni la economía.

**La ciudad respira.** Nueve mejoras de ambientación 3D: colectivos con puertas y paradas donde suben pasajeros, fábricas y comercios activos, costanera con muelles operativos, aves y embarcaciones, mascotas en hogares y parques, escuelas con alumnos según matrícula y horario, deterioro urbano con cuadrillas reales, lluvia con paraguas y faros, bomberos y ambulancias con intervenciones detalladas, y pequeñas escenas de mudanzas, festivales y celebraciones documentadas. Se utiliza geometría procedimental Three.js (fachadas, personas, equipos, vehículos, olas, luces y partículas) para conseguir escenas tridimensionales coherentes, priorizando su riqueza visual. **Todas las escenas son visuales y derivan de la partida: no agregan condiciones de construcción, materiales, costos, pasajeros ni demanda.**

# Ciudad Viva · Alfa 0.263

**Historias de una ciudad (0.263):** el botón **Historias** permite buscar vecinos registrados, consultar su empleo, vivienda y los cambios laborales o mudanzas observados desde esta versión, además de seguir a una figura 3D asociada a ese residente. Los registros se guardan con la ciudad en Offline y LAN y no inventan nombres, edades ni pasados inexistentes. Las **obras 3D de casas, comercios y fábricas** ganan etapas de cimentación, muros, estructuras, cubiertas, grúas y personal trabajando: son **solo efectos visuales** y no modifican requisitos de construcción ni tiempos del motor. Las horas pico muestran filas de automóviles 3D en calles realmente cargadas; las plazas activas con visitas de ocio tienen pequeñas actividades de paseo, descanso, juegos y ejercicio. Los hitos reales (hospital, líneas de transporte, elecciones, población y aniversarios) generan celebraciones tridimensionales discretas y un registro navegable en el panel Historias. Todo se deriva de datos ya presentes en la simulación, con límites de geometría para dispositivos móviles.

# Ciudad Viva · Alfa 0.262

**La ciudad cobra vida en 3D (0.262):** hay vecinos tridimensionales con rutinas basadas en viviendas, viajes y actividad real, mascotas puntuales, filas en paradas con pasajeros y personal visible cuando intervienen servicios municipales. Los eventos turísticos contratados que efectivamente se realizan con visitantes aparecen como ferias, festivales o congresos con puestos físicos y público; los hitos recientes pueden celebrarse. Las fachadas de los comercios ahora muestran carteles legibles y pequeños modelos 3D de panadería, cafetería, mercado, florería y taller, sin alterar rubros económicos si el nombre no los identifica. Ventanas de hogares, hoteles y locales se iluminan de noche según electricidad, ocupación y actividad real; la lluvia registrada genera gotas, charcos y niebla. Otoño, invierno, primavera y verano se representan para el hemisferio sur con efectos estacionales livianos. El nuevo botón **Cámara** (tecla **K**) oculta la interfaz para recorrer la ciudad, seguir actores reales, guardar una foto PNG o comparar registros históricos de cada barrio con el presente. Los modelos y las escenas se hacen con geometría Three.js de dimensiones fijadas a parcelas de 2 unidades, sin planos de personajes ni animaciones 2D; los efectos se limitan en móviles.

# Ciudad Viva · Alfa 0.261

**Asesor municipal, misiones, previsión de obras y barrios (0.261):** el botón **Asesor** del menú inferior explica los problemas reales de la ciudad, muestra sus causas y lleva a la herramienta o parcela correspondiente. Incluye 12 misiones voluntarias y medibles, que quedan registradas con el guardado y no regalan fondos ni limitan construcciones. Al elegir una obra, mover el puntero por el mapa presenta precio, coste de operación conocido, acceso vial y edificios potencialmente alcanzables; el botón **Planificar** activa voluntariamente una confirmación en dos toques para obras puntuales. En **Barrios** se consultan Oeste, Centro y Puerto, con identidad según actividad real, población, plazas, servicios y un diario de evolución mensual persistente también en partidas LAN. Las estimaciones de la vista previa no prometen cobertura operativa ni sustituyen las reglas reales del motor.

# Ciudad Viva · Alfa 0.260

**Tutorial para empezar (0.260):** al crear una ciudad aparece una guía opcional de 14 pasos en español. Señala los botones reales del juego, explica cómo hacer calles, conectar los servicios, zonificar viviendas y comercios, colocar plazas, leer la demanda y controlar los gastos. Tiene narración con voces del navegador, controles para escuchar de nuevo o silenciar, y un botón **Guía** en el menú inferior para reiniciarla.

# Ciudad Viva · Alfa 0.259

**Compatibilidad de partidas LAN antiguas (0.259):** el nuevo motor compartido reconoce snapshots creados por el servidor anterior y completa las propiedades necesarias usando el esquema más reciente de Offline. Los edificios, las calles y la tesorería guardados tienen prioridad; además se mantiene la copia de seguridad previa a la migración.

**Nuevo Online con motor único de Offline (0.258):** ahora las salas LAN ejecutan el mismo archivo `offline.js` que la partida local. Un proceso Node.js en el anfitrión aplica las acciones, las simulaciones diarias y los reportes; Python maneja únicamente jugadores, red, chat, cursores y guardados. Se conservan copias previas de los guardados de Online antes de su importación. El ejecutable Windows incluye Node.js. Los jugadores comparten un único estado autoritativo, por lo que las reglas futuras pasan automáticamente a los dos modos.

**Construcciones instantáneas y ambulancias en misión (0.257):** las obras colocadas directamente desde el catálogo se habilitan al instante también en salas LAN, sin ocupar cuadrillas ni solicitar materiales; se conservan los plazos para obras automáticas y trabajos especiales. Los hospitales dejan de generar ambulancias estacionadas en la calzada al construirse. Se añadieron pruebas de paridad del catálogo y de cobertura de acciones. La simulación Online y Offline aún utiliza motores distintos: esta revisión corrige casos concretos y no presupone equivalencia integral.

**Presencia LAN en tiempo real (0.256):** el servidor transmite inmediatamente las posiciones del mouse por un canal SSE independiente de la simulación, en vez de esperar sondeos HTTP y bloqueos prolongados; hay un sondeo de respaldo si se corta. El nombre y la parcela siguen junto a cada cursor, pero el texto de actividad aparece al lado de cada jugador conectado, arriba del chat. Para usar el nuevo servidor, el anfitrión debe actualizar el ejecutable Windows.

**Cursores multijugador más fluidos (0.255):** en las salas LAN, los cursores remotos se actualizan más seguido y se interpolan entre muestras para reducir los saltos. Al abrir un panel (por ejemplo, Movilidad o Tráfico), el cursor del jugador queda en su última posición y muestra la pantalla que está consultando. Los cursores de los demás se ocultan localmente mientras tenés abierta una ventana para que no tapen el contenido.

**Tesorería de ciudades nuevas (0.254):** Una ciudad vacía empieza con $0 de ingresos y $0 de gastos mensuales. Se elimina el aporte regional y los ingresos ficticios por habitantes o empleos; la recaudación proviene de impuestos realmente cobrados a hogares y ventas, y de servicios municipales cuando existan. El acceso regional no genera mantenimiento municipal.

**Cursores compartidos (0.253):** En partidas LAN, cada jugador ve el puntero y el nombre de los demás sobre la parcela del mapa 3D. La posición se actualiza varias veces por segundo y sigue la cámara local de cada jugador.

**Guardados offline protegidos (0.252):** El selector carga el contenido completo de cada slot antes de iniciar la simulación y comprueba el estado antes de permitir el guardado automático. Las partidas nuevas usan un slot separado, hay copias de seguridad automáticas y se puede eliminar un slot desde el selector.

**Partidas y sala LAN (0.251):** Offline permite crear tantos slots como admita el almacenamiento del navegador y retoma los guardados anteriores. El anfitrión elige una partida local o una ciudad nueva antes de abrir la sala. Cada jugador elige un nombre; la sala muestra participantes, chat y actividad de construcción. El anfitrión guarda en su equipo y la app anuncia la sala en Radmin VPN (`26.x.x.x`) o Hamachi (`25.x.x.x`). Para descubrir salas automáticamente, ambos equipos abren la app Windows; desde GitHub Pages se puede entrar mediante la dirección VPN del anfitrión.

**Online LAN (0.250):** las respuestas de red atrasadas no revierten acciones recientes. Las actualizaciones grandes se comprimen para aliviar el tráfico por Hamachi. Se comprobó una sala local con cuatro jugadores que zonifican simultáneamente y ven todos los cambios.

**Crecimiento urbano y cabecera (0.249):** con demanda y calle conectada, un promotor financia nuevas viviendas, comercios y fábricas sin fondos municipales. Las familias compran o alquilan según sus ingresos y ahorros; la constructora cobra hasta que el municipio compra el inmueble. La tesorería detalla funcionamiento y sueldos públicos, evita cargar dos veces las calles y muestra un aporte regional de arranque. El empleo efectivo se limita a 100 % y la cabecera tiene desgloses compactos.

**Escala de peatones y ciclistas (0.248):** los modelos detallados ahora tienen proporciones menores frente a los autos; la animación de caminar y pedalear se conserva. Los camiones de transferencia se distinguen de los recolectores; los edificios públicos se pueden girar, la cámara rota con la rueda central y su arrastre horizontal, y la tesorería calcula ingresos y gastos de forma progresiva durante el tiempo simulado. La vivienda zonificada puede avanzar con capital privado o, si este se agota, con caja municipal disponible.

**Metas de desarrollo de ciudad (fase 14):** Gobierno ofrece cinco objetivos voluntarios, con requisitos medibles y continuidad durante seis cierres mensuales. Se pueden pausar o cambiar, se sincronizan en la sala LAN y no alteran elecciones ni bloquean herramientas.

**Interfaz móvil ajustada para teléfonos como el Samsung A54:** el panel superior mantiene visibles tesorería y los indicadores de la ciudad, la barra lateral empieza junto al mapa y los ocho accesos inferiores quedan organizados en una cuadrícula táctil con pausa y velocidad accesibles.

**Mercancías y compras visibles en la ciudad:** las entregas de fábrica por carretera muestran los productos en la caja del camión durante la ida. Tras la entrega el camión vuelve vacío por su ruta hasta la fábrica; los envíos ferroviarios siguen viajando en tren. Los compradores que llegan caminando, en auto o en bici aparecen entrando al comercio y saliendo con bolsas. Las rutas y el progreso de carga se guardan en Online y Offline.

**Capacidad ferroviaria compartida:** la carga usa solo el cupo diario que queda después de reservar espacio para los pasajeros. Si el corredor preferido está lleno, el envío busca otra línea elevada construida que tenga cupo. Sumar trenes amplía capacidad para ambos usos. Movilidad muestra carga libre y capacidad nominal. Reglas iguales en LAN y Offline.

**Capacidad ferroviaria compartida:** la carga usa solo el cupo diario que queda después de reservar espacio para los pasajeros. Si el corredor preferido está lleno, el envío busca otra línea elevada construida que tenga cupo. Sumar trenes amplía capacidad para ambos usos. Movilidad muestra carga libre y capacidad nominal. Reglas iguales en LAN y Offline.

**Trenes de carga y exportación al puerto:** las fábricas pueden enviar excedentes por líneas elevadas activas con estaciones junto a la planta y al puerto. Hay salidas programadas, capacidad por tren y terminal, inventario portuario y un flete municipal liquidado cuando llega el barco. La interfaz identifica la carga pendiente y los trenes en ruta.

# Ciudad Viva · Alfa 0.238

**Las colas ya afectan los viajes Offline:** cada trayecto motorizado recibe su demora por franja y actualiza el tiempo estimado. Releer la partida no acumula la demora dos veces.

# Ciudad Viva · Alfa 0.237

**Acceso peatonal a transbordos ferroviarios:** las terminales pueden quedar a tres parcelas del origen o destino; el intercambio físico entre estaciones sigue limitado a dos. Así más barrios pueden aprovechar dos líneas sin perder la condición de estaciones construidas y conectadas.

# Ciudad Viva · Alfa 0.236

**Transbordos ferroviarios con demanda y capacidad reales:** pasajeros de compras, servicios y ocio pueden combinar dos líneas activas cuando las estaciones físicas terminadas quedan a dos parcelas o menos. La ruta reserva plazas en ambos trenes, aplica 25 % de descuento al segundo tramo y liquida ambos boletos al hogar.

**Viajes cotidianos en Offline:** compras, trámites y visitas a plazas ya recorren la ciudad en colectivo, subte, tren o taxi cuando hay capacidad. La ruta se incorpora al mapa y alimenta el informe de tráfico; los cobros por transporte se registran en las cuentas existentes.

# Ciudad Viva · Alfa 0.235
**Árboles detallados al desplazar el mapa:** el zoom intermedio conserva copas, ramas, raíces, brotes y especies en lotes instanciados, con animación de viento conjunta. Las copas completas siguen visibles al acercar.

# Ciudad Viva · Alfa 0.234

**Inicio de ciudad con fondos para infraestructura:** una nueva partida entrega $ 175.000 para construir calles y servicios esenciales antes de recibir ingresos. Se mantienen los precios de los edificios.

**Autos de entrada y calles nuevas:** los vehículos regionales actualizan su recorrido al conectar nuevas calles y conservan su posición individual al refrescarse la escena.

# Ciudad Viva · Alfa 0.233

**Respuesta policial con varias bases:** la batería de regresión comprueba que una patrulla disponible de la base más cercana tome la primera incidencia y que una segunda base reciba la siguiente cuando ese móvil sigue ocupado.

**Rutas cortadas:** la validación Offline desconecta el acceso de la base cercana y verifica que el despacho use el camino conectado de otra base. La validación LAN entre equipos físicos continúa pendiente.

# Ciudad Viva · Alfa 0.232

**Expansión de la ciudad:** los sectores vecinos se pueden desbloquear aunque una partida antigua no conserve la lista auxiliar de fronteras. La prueba crea una clínica remota y verifica que calles, terreno y edificio sobrevivan al guardado y recarga. Offline y LAN siguen validando el desbloqueo en el servidor.

**Patrullas urbanas con disponibilidad real:** una unidad asigna cada móvil a un incidente y lo reserva durante la ida y el regreso. Cada vehículo conserva un máximo de dos respuestas al mes; no puede duplicarse en misiones simultáneas.

**Cobertura explicada:** Seguridad muestra qué viviendas y comercios quedan sin patrulla accesible y si falta una base equipada, una ruta vial, presupuesto o personal. El mapa identifica el móvil asignado y dibuja su ruta hasta el incidente y de vuelta. Las reglas son equivalentes en Offline y LAN.

# Ciudad Viva · Alfa 0.229

**Servicios esenciales construibles y finitos:** luz, agua, gas, televisión por cable e internet/Wi-Fi requieren proveedores físicos conectados a la red vial. Las redes cableadas se tienden sobre calles, ya integradas en el catálogo. Una central eléctrica (900 kW), una planta potabilizadora (220 m³/día), una planta de gas (160 m³/día), una cabecera de televisión (180 conexiones) y una central Wi-Fi (160 conexiones) aportan cupos reales por edificio construido, terminado y conectado. Sin centrales no hay suministro gratuito, ni se iluminan farolas. Cuando un servicio está saturado, la nueva demanda no desplaza a los clientes anteriores. Las plantas de agua, gas y telecomunicaciones necesitan energía, mientras la central eléctrica puede iniciar la red sin requerir otra planta de agua previa.

**Alertas 3D:** los inmuebles sin suministro muestran íconos flotantes para cada servicio faltante. Su ficha revela si falta cable/conexión o si la capacidad instalada está agotada. Ciudad → Servicios muestra capacidad instalada, consumida y libre para cada servicio. Los inmuebles habitados acumulan días sin suministro y, tras una carencia prolongada (120 días de luz, 135 agua, 165 gas, 200 TV o Wi-Fi), sus habitantes se marchan y el inmueble queda abandonado; restablecer el suministro reinicia el contador. Las viviendas sin habitantes no se abandonan por este motivo.

**Nota:** este sistema rige las nuevas redes y las partidas guardadas; las redes y centrales de una partida anterior se conservan, pero las viviendas requerirán proveedores de TV y Wi-Fi que antes no existían. Las redes de saneamiento, drenaje y mantenimiento general mantienen su lógica propia. Paridad de reglas LAN/Offline y pruebas incorporadas; verificación global de CI y LAN física pendiente.

# Ciudad Viva · Alfa 0.171

**Estaciones ferroviarias construibles y reales en el mapa 3D.** El subte y el tren elevado ya no se proyectan desde botones en Movilidad: Construir → Transporte incorpora los edificios de estación, con maqueta 3D, parcela propia, calle adyacente, inversión y obra por etapas. Cada estación exige cuadrillas, y solo queda habilitada al terminar. Con las herramientas «Tender línea de subte» y «Construir viaducto ferroviario» se seleccionan dos estaciones terminadas directamente en el mapa; se contrata el trazado con su obra, energía y flota. El panel Movilidad pasa a informar estaciones, líneas y pasajeros, sin controles para construir ferroviarias.

Los accesos de subte se ven como edificios 3D de entrada en superficie; los trazados subterráneos siguen siendo una **proyección técnica** en la superficie, no una cámara subterránea real. El tren elevado tiene estación de andenes y escaleras, además de sus viaductos y trenes 3D. Las reglas de caja, ocupación y obras se aplican tanto en Offline como en LAN. Las partidas antiguas conservan sus líneas, mientras que las nuevas deben partir de estaciones físicas terminadas.

**Pendiente:** extensión de esta regla a todos los demás sistemas de gestión que aún usen paneles; conexiones entre dos líneas ferroviarias, estaciones intermedias y ferrocarril de carga al puerto. No hay una ponderación global verificable de las 34 fases del roadmap.

## Historial

# Ciudad Viva · Alfa 0.170

La fase 22 incorpora **transbordos reales entre colectivos y subtes o trenes elevados** para viajes existentes de compras y servicios. Un viaje puede ir primero en colectivo y continuar en tren, o hacer el trayecto inverso, si los accesos están próximos, el recorrido es válido y los dos vehículos tienen cupo. Se suman espera, caminata, conexión y tiempo a bordo: la combinación debe competir en tiempo con el modo original. El segundo boleto tiene una bonificación del 25% y ambos componentes se registran por hogar; no se cobra hasta el cierre municipal.

Las mismas reglas operan en LAN y Offline. Los pasajeros intermodales se cuentan una sola vez en la demanda de transporte, pero ocupan lugar en cada vehículo; los informes de movilidad muestran transbordos, pasajeros y tarifas. Se bloquean líneas ferroviarias sin energía o pausadas, colectivos sin plazas y corredores viales cortados. Se conserva Alfa 0.169 con trenes elevados 3D y Alfa 0.168 con subtes 3D.

**Pendiente:** estaciones intermedias, enlaces entre dos líneas ferroviarias, conexión ferroviaria de carga con el puerto, personal especializado, planificación de andenes y verificación LAN entre dos equipos. No hay ponderación global verificable de las 34 fases.

## Historial completo

Abrí **Cambios** en el menú inferior para consultar las versiones actuales y anteriores; el historial carga desde `release_notes.json` y muestra las novedades más recientes primero.

## Archivo histórico

# Ciudad Viva · Alfa 0.110

## Alfa 0.110 · rediseño de arte 3D

`world3d.js` transforma edificios, árboles, calles, costa y obras siguiendo siete referencias conservadas en `design_reference_3d/`. Los modelos son geometría 3D interactiva, no imágenes superpuestas. La simulación, selección y guardado continúan en los modos Offline y LAN. `ARTE_3D.md` describe el sistema y sus límites. Progreso global del juego: aún no estimable sin pesos verificables del roadmap.


## Alfa 0.109 · interfaz según referencias del usuario

El nuevo diseño sigue las trece pantallas entregadas por el usuario, guardadas en `design_reference/`. Conserva la simulación y los controles originales con paneles adaptados para móvil y escritorio. `reference.css` y `reference-ui.js` implementan las vistas; los indicadores muestran datos reales de cada partida. El render 3D adapta su resolución para mantener la interacción. El porcentaje de desarrollo global todavía no puede estimarse de forma responsable sin pesos estables para las 34 fases del roadmap.


Simulador municipal cooperativo con cámara 3D isométrica, obras por etapas, materiales, cuadrillas y migración condicionada por vivienda y empleo. La escena usa Three.js, incluido en `vendor/`; después de descargar el paquete, el juego funciona sin Internet ni npm.

## Roadmap

La especificación original de jugabilidad, con sus 34 fases y criterios, está incluida en [ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md](ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md).

## Alfa 0.91 · nueva cadena industrial

La cuarta especialidad de fábrica es una metalúrgica privada: compra acero del Corralón por carretera, lo transforma en componentes para obras y vende desde su stock a las constructoras. Personal, caja, capacidad, electricidad, agua y saneamiento limitan su actividad; Offline y Online comparten la cadena base. La pestaña Economía muestra inventario de acero y componentes y el estado de la planta.

## Modos de juego

Al abrir la página se puede elegir **Offline** u **Online · red local**. Online ofrece **Crear sala**, **Unirse a sala** y **Ver salas públicas** en la red local. El anfitrión inicia el servidor con el archivo de doble clic y crea la sala desde su navegador; otros jugadores usan la IP local o una sala anunciada en la misma red. La lista LAN usa anuncios UDP entre servidores locales y no depende de Internet. Vercel no puede alojar la sala: desde esa página los invitados deben abrir la IP del anfitrión. Offline funciona en Vercel y guarda la ciudad en el almacenamiento local del navegador. Incluye calendario, parcelas, zonificación y obras con progreso por etapas. Los comercios compran materia prima a proveedores privados con stock, precio y demora; los clientes se distribuyen según precio y acceso. El Banco Cooperativo ofrece crédito comercial de liquidez limitada: las firmas pagan intereses y amortizan con excedentes, y la mora persistente puede cerrarlas y dejar trabajadores buscando empleo. El mercado laboral asigna por habilidad básica, salario esperado y accesibilidad; los reportes muestran causas de búsqueda y requisitos por centro laboral. La Ciudad permite contratar formación municipal para hasta seis personas, por dos ciclos mensuales, con presupuesto reservado, avance de habilidad y control de pausas/cancelación. Online usa rutas viales; en los viajes laborales, el trayecto corto se hace a pie y el largo en auto; el tiempo puerta a puerta y las emisiones aproximadas se muestran en Ciudad. Autos y peatones siguen rutas laborales distintas. La pestaña Ciudad permite comprar de uno a tres colectivos para un corredor laboral, con 30 asientos por vehículo, frecuencia por recorrido y franja horaria (05:00–23:00), tarifa de $0,25 por viaje y costo operativo de $140/mes por vehículo. Las líneas hacen paradas automáticas junto a hogares y empleos sobre el recorrido, y pueden servir varios pares de origen y destino. Los viajes se distribuyen en turnos estables por residente: ida temprana, matutina o de mediodía y regreso vespertino o nocturno. Nueve franjas muestran frecuencia, espera, salidas y asientos disponibles; cada sentido reserva aforo propio y cambia de ruta/horario según el turno. Los hogares pagan el boleto mensual hasta el efectivo disponible; las rutas muestran aforo por sentido, paradas y flota, y pueden pausarse, reanudarse o retirarse. Online y Offline usan la misma lógica. Las paradas de colectivo ahora se licitan y construyen junto a una línea activa: requieren parcela, cuatro trabajadores y 18 días base, ajustados por la constructora; el refugio aparece en 3D, modifica el recorrido y cuesta $25 mensuales de mantenimiento. Online y Offline consumen áridos, hormigón, acero, madera y componentes de obra; las compras Offline usan proveedores, caja de constructoras, inventario y rutas viales. El segundo factory construido en Offline puede ser un aserradero privado: repone madera de una reserva forestal con regeneración limitada, paga salarios y operación, y vende tablas a las obras. Las líneas emplean conductores en dos turnos amplios y admiten transbordos construidos con tarifa integrada. Los colectivos siguen siendo transporte laboral de hora pico; faltan viajes no laborales, trenes, metro y carga. Offline usa rutas BFS aproximadas sobre la cuadrícula local. Los pedidos de materiales de obra y rescate siguen requiriendo el servidor. Para compartir una ciudad, elegí Online y abrí la dirección LAN del equipo anfitrión.

## Movilidad cotidiana · Alfa 0.36

Además de los viajes al empleo, hogares con acceso vial generan recorridos de compras hacia comercios abiertos. La elección prioriza cercanía y actividad comercial reciente, alterna entre destinos accesibles, estima peatones o autos según distancia y acceso familiar, y registra el regreso, emisiones y presencia animada en la escena. El resumen de Ciudad los muestra por separado. Es una primera capa de demanda no laboral: todavía no compra productos de nuevo ni contempla ocio, salud, educación, bicicletas o transporte público para esos viajes.

## Aeropuerto regional · Alfa 0.39

El aeropuerto se licita como obra municipal de cinco etapas ($19.500 y 112 días base) con materiales Online y una cuadrilla de 16. Exige una parcela conectada a la red vial. Al terminar, habilita una terminal de 800 pasajeros al mes y una pista de hasta 12 vuelos mensuales; incorpora 18 empleos aeroportuarios y cuesta $600 mensuales. Aerolíneas del Litoral programa vuelos solo si hay al menos cuatro trabajadores, viajeros potenciales y margen previsto para cubrir el costo de ruta. Cada pasajero y vuelo aporta tasas municipales. La mitad de los pasajeros que llegan se registra como visitantes; una parte compra bienes en comercios conectados con inventario. El terminal y una aeronave aparecen en el mapa 3D. Esta primera implementación no incluye carga aérea, conexiones por aerolínea persistentes, horarios de vuelo, meteorología, ruido zonal ni viajes terrestres individuales al aeropuerto.

## Puerto comercial · Alfa 0.38

La terminal portuaria es un contrato municipal por etapas junto a la costa este y una calle conectada. Los comercios convierten sus ventas regionales en pedidos; camiones llevan las unidades al patio del puerto por calles reales. Un patio de 500 unidades, cuadrilla logística de 12 puestos y costo fijo de $320/mes ponen límites a la operación. Al reunirse 60 unidades puede zarpar un barco de hasta 180; la tasa aporta $0,60 por unidad al presupuesto y el cargamento tarda dos días en llegar al mercado regional. El muelle, grúa, contenedores y buques se ven en el mapa. Online y Offline guardan pedidos y viajes. Esta primera parte no incluye importaciones, tipos de carga, dragado, atraque, tren de mercancías ni competencia entre puertos.

## Viajes cotidianos · Alfa 0.37

Además de las visitas a comercios, los hogares accesibles generan viajes a centros cívicos habilitados. El motivo se informa por separado, estima pasajeros y modo a pie/auto, suma emisiones y aparece como recorridos animados. No añade un cobro de entrada. El ocio y destinos recreativos todavía no existen como edificios funcionales.

## Iniciar

- **Anfitrión Windows:** descargá [CiudadViva.exe · Alfa 0.242](https://github.com/TobyMorel/ciudad-viva/releases/download/v0.242/CiudadViva.exe) y abrilo. Incluye el servidor y abre la ciudad en una sola ventana; no requiere instalar Python.
- **Anfitrión Linux/macOS:** ejecutá **Iniciar Ciudad Viva.sh** con Python 3.9 o posterior.
- **Modo individual:** abrí la página desde GitHub Pages o usá `index.html`.

Para jugar por Radmin VPN o Hamachi, todos se conectan a la misma red virtual. El anfitrión abre la app, elige un slot y crea la sala. Los invitados abren la misma app para usar «Ver salas LAN»; los anuncios se envían a las redes virtuales `26.x.x.x` y `25.x.x.x`. Si el anuncio no llega, pueden entrar con la dirección VPN y el código. La app del anfitrión debe permanecer abierta y el firewall debe permitir conexiones privadas. GitHub Pages es estático y no puede descubrir salas LAN por sí solo, aunque permite entrar mediante la dirección del anfitrión.

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


## Alfa 0.63 · mantenimiento vial

Las calles ahora tienen condición y desgaste ligados al uso. En Ciudad > Mantenimiento se ajusta el plan preventivo de 0% a 200%; su costo entra al presupuesto de Redes y residuos y el pago efectivo determina cuánto mejora la red. La subfinanciación acumula mora, y una red muy deteriorada reduce los servicios. Online y Offline comparten el sistema, con migración de guardados al esquema 47.


## Alfa 0.64 · mantenimiento correctivo municipal

El plan de mantenimiento también cubre edificios y servicios públicos, con costos según personal y ocupación. Calles bajo 45% de condición y edificios públicos bajo 60% crean un expediente de desgaste. La inspección cuesta $150 y demora un día; luego se elige una constructora, se ocupan cuatro trabajadores y el contrato devuelve el activo a 82%. Ciudad > Mantenimiento separa calles de edificios; Recuperación reúne los diagnósticos. Disponible Online y Offline, esquema 48.


## Alfa 0.65 · condición y averías de redes

Los tendidos de electricidad, agua, cloacas, drenaje, gas y fibra acumulan condición por tramo. La carga de edificios cercanos acelera el desgaste y la financiación efectiva de Redes lo reduce. Al caer por debajo de 25%, el tramo crítico puede fallar, cortar la conexión y generar un costo de reparación proporcional al deterioro. Una cuadrilla restablece el servicio tras tres días. Ciudad > Servicios informa la condición de cada red. Disponible Online y Offline; guardados migran al esquema 49.


## Alfa 0.66 · cierres preventivos y desvíos

Cuando la condición de una calle baja de 25%, se cierra por seguridad. Las rutas diarias recalculan el acceso de residentes, puestos, colectivos y camiones de residuos sin usar el tramo cerrado; si no hay alternativa, esos destinos quedan aislados hasta su rehabilitación. Las barreras aparecen en el mapa 3D y Ciudad > Mantenimiento prioriza los tramos cerrados. Una obra de recuperación aprobada restablece la calle a 82% y la reabre tras inspección. Disponible Online y Offline; guardados migran al esquema 50. El mapa actual no representa cruces fluviales ni puentes, que requieren ampliar primero la geografía conectable.


## Alfa 0.67 · capacidad de plantas y mantenimiento

La condición de centrales eléctricas, plantas potabilizadoras y depuradoras afecta ahora su producción real. Con 82% de condición entregan la capacidad de diseño; el desgaste reduce electricidad, agua o tratamiento disponibles y puede aumentar los déficits si la red está exigida. En Ciudad → Mantenimiento se ve el porcentaje funcional y la salida efectiva de cada planta. La rehabilitación existente recupera 82% y su capacidad base. Online/Offline; los guardados migran al esquema 51.


## Alfa 0.68 · inspecciones preventivas de plantas

Centrales eléctricas, plantas potabilizadoras y depuradoras requieren una revisión preventiva cada 180 días. Al vencer el plazo, el cierre mensual crea un expediente. La inspección cuesta $150 y demora un día: puede aprobar la planta sin obra o habilitar constructoras si el desgaste redujo su capacidad. La rehabilitación restaura 82% y reinicia el calendario. Disponible Online y Offline; guardados migran al esquema 52.


## Alfa 0.69 · reconversión a vivienda

Los comercios que cierran pueden volver a usarse como vivienda si no tienen deudas pendientes y no son inmuebles protegidos. El inversor paga $4.200 a una constructora, la ciudad recibe $200 por permiso y cuatro trabajadores realizan una obra de 20–30 días. La inspección de agua, saneamiento y seguridad habilita 24 plazas. La migración depende de viviendas libres, empleo y aprobación; cada residente comienza a pagar alquiler tras 30 días en esa vivienda. La mora acumulada puede reducir la aprobación. Funciona Online y Offline; guardados al esquema 53.


## Alfa 0.70 · mandatos y elecciones

Cada 1.440 días de juego se realiza una elección para renovar el gobierno municipal. La estimación y el escrutinio se presentan por Oeste, Centro y Puerto, utilizando empleo residente, hacinamiento/calidad de vivienda, servicios y aprobación. La participación inicial es 72% para una simulación determinista. Si el equipo gana, inicia un nuevo mandato; si pierde, la partida compartida se pausa en modo observación. Disponible Online y Offline, guardado esquema 54. La fase 32 continúa: todavía faltan planes con metas, reclamos localizados, transparencia y causales de destitución extraordinaria.


## Alfa 0.71 · compromisos de gobierno y reclamos locales

Cada mandato recibe metas medibles de empleo, reserva de vivienda y servicios. Los cierres mensuales actualizan el avance; las metas cumplidas mejoran el resultado electoral. Umbrales críticos en Oeste, Centro o Puerto abren reclamos persistentes que reducen el apoyo hasta resolver la causa. Una crisis institucional solo destituye al gobierno tras tres cierres con tesorería agotada, servicios bajo 30% y apoyo bajo 35%; el segundo cierre alerta y una recuperación de caja o servicios lo evita. Online/Offline, guardado esquema 55.


## Alfa 0.72 · reclamos con evidencia, acuerdos y mapa de progreso

Ciudad > Gobierno ahora vincula los reclamos a entidades locales ya simuladas y permite que el equipo deje un acuerdo con vencimiento. Los cierres mensuales actualizan su resultado y repercuten en el apoyo y las elecciones. La pestaña Cambios añade un listado expandible de las 34 fases con un indicador orientativo y sus pendientes actuales. Las estimaciones por fase no son un porcentaje de finalización del juego; consultá `release_notes.json` y `AUDITORIA_ROADMAP.md` para el método y alcance.

## Alfa 0.73 · evolución y rehabilitación de barrios

La ciudad registra envejecimiento de residentes y edificios. Cumplir 18 permite buscar empleo; cumplir 67 jubila al residente y libera el puesto. Nacimientos requieren una vivienda con capacidad y dinero disponible. El desgaste privado crea encargos barriales que una constructora puede rehabilitar con su stock, cuatro trabajadores y una obra inspeccionada. El panel Ciudad > Evolución y el mapa 3D muestran su estado. Online y Offline, guardado esquema 57.

Fase 33 sigue en desarrollo: falta probar 30 años y los escenarios urbanos indicados en el roadmap.

Verificación de la entrega: compilación, prueba del ciclo de edad y renovación Online/Offline, endpoint de anfitrión y revisión del panel en 390×844 y 1440×900. La simulación continua aceptada de 30 años sigue pendiente; tampoco se probó LAN con dos equipos físicos en esta sesión.

## Mercado regional finito · Alfa 0.74

Los comercios asignan sus exportaciones entre tres mercados regionales con volúmenes y presupuestos mensuales finitos. Su participación depende de personal, precio, estado, servicios y acceso a la salida vial o al puerto. Las ventas exportadas consumen esa asignación; el ingreso no supera el presupuesto comprador, de modo que el mercado externo no crea demanda ni dinero ilimitados. La vista Ciudad > Puerto muestra destinos, participación y resultado del último mes. Implementado en Online y Offline, con persistencia en el esquema 58.


## Alfa 0.75 · inversión privada y habitantes seleccionables

La demanda regional no atendida puede atraer una propuesta de comercio, sujeta a parcela comercial y vial, capital privado, reserva, permiso y cuadrilla. Aceptarla inicia la obra por etapas con contratista, recursos, plazo e inspección; no aparece una empresa terminada instantáneamente. En hogares se consulta su padrón y en peatones/vehículos simulados se consultan actividad, ruta y pasajeros disponibles. Las categorías de Ciudad se desplazan en horizontal con rueda y gesto táctil. Implementado en ambos modos; guardados migran al esquema 59. La fase 33 sigue parcial y falta demostrar décadas de simulación y escenarios de aceptación.

Para retomar el desarrollo en otra sesión o con otra IA, consulta [CONTINUIDAD_IA.md](CONTINUIDAD_IA.md).


## Alfa 0.76 · migración con residentes persistentes

Las mudanzas ahora crean y retiran personas identificables en Online y Offline. Cada nuevo residente tiene edad, etapa de vida y estado laboral; solo los residentes elegibles y con perfil pueden cubrir empleos. Al salir, se libera la plaza que ocupaba esa persona y baja la recaudación futura. La llegada permanece limitada por aprobación, vacantes y empleo potencial. La fase 21 avanza a 60%; fase 33 sigue parcial hasta superar los escenarios de varias décadas.


## Alfa 0.77 · delegación administrativa

En Ciudad > Puerto podés delegar la aprobación automática de comercios hasta un tope de permiso configurable. La contratación solo ocurre si las cuentas, el capital inversor y la constructora pueden cubrirla; conserva construcción por etapas e inspección. Las propuestas que exceden el límite requieren decisión manual. Funciona en Online y Offline.


## Alfa 0.81 · crecimiento privado autónomo y sala cooperativa abierta

Las herramientas residencial (verde), comercial (azul) e industrial (amarillo) pintan permisos por parcela con arrastre. La demanda de hogares se mantiene pendiente hasta recibir residentes. Promotores pueden iniciar vivienda, comercio y fábricas bajo demanda si hay suelo conectado, capital, cuadrilla y los recursos requeridos. La fábrica privada aporta 20 empleos y vende producción al inventario de proveedores locales que utilizan los comercios. Ciudad > Suelo muestra demanda, permisos, obras e inventario industrial.

## Alfa 0.78 · obras que cruzan mandatos

Cada contrato estándar conserva el mandato en que se aprobó. La pantalla Gobierno muestra las obras activas/heredadas, etapas, cuadrilla y saldos municipal y privado. El acta electoral guarda la cartera y, si el gobierno gana, los contratos siguen con sus pagos y avances.

## Alfa 0.81 · crecimiento de ciudad autónomo

Pintá suelo residencial, comercial o industrial para permitir inversión. Las casas, tiendas y fábricas se inician por promotores según la demanda real de hogares, empleo, compras no cubiertas y disponibilidad de capital, permisos, constructoras y acceso; no hace falta colocarlas manualmente. En salas cooperativas, los referentes de cada cartera son voluntarios: todos los jugadores conservan todas las acciones, controles de partida y guardado/carga.


## Alfa 0.82 · primera cadena de alimentos

La procesadora industrial compra grano a una cooperativa regional con cupo mensual finito, paga la mercancía y espera el transporte por carretera. El grano recibido limita su producción junto con el empleo y los servicios; el alimento terminado queda en inventario local y los comercios lo compran por la red de proveedores. Los pedidos y camiones son visibles, y la ficha del edificio informa cantidades, costos y faltantes. Online y Offline.


## Alfa 0.83 · riesgo de plazo contractual

La confiabilidad histórica ya afecta la ejecución de las obras. Cada 30 días, una revisión reproducible combina el historial de cumplimiento de la constructora y su carga de contratos; ciertos resultados detienen el avance de la jornada y amplían el plazo entre 2 y 5 días. El estado conserva las demoras y su causa. El avance físico y los certificados se recalculan usando el plazo revisado. Funciona en Online y Offline.


## Alfa 0.84 · pagos certificados por etapas

Las obras públicas reciben su anticipo contractual y cobran el saldo en certificados cuando completan hitos físicos de su cronograma. Cada certificado guarda etapa, día, avance físico y monto pagado. Si la tesorería no cubre el próximo hito, la obra se suspende antes de consumir los materiales o avanzar esa jornada. Las tarjetas muestran hitos y pago acumulado. Funciona Online y Offline; las retenciones y garantías siguen pendientes.


## Alfa 0.85 · garantía de obra y retención (fase 19)

En los contratos públicos nuevos se retiene el 10% en una cuenta separada. El certificado final exige caja para pagar el avance y fondear la retención; si no alcanza, la obra se suspende antes de avanzar. Tras 30 días, la inspección usa calidad y confiabilidad del contratista para decidir si libera el pago o declara un defecto. El equipo puede asignar tres trabajadores durante cinco días; al reparar, el activo recupera su calidad inicial y la constructora cobra la retención. Los contratos privados y los contratos de guardados anteriores mantienen su esquema de pago. Estado y acción disponibles en Online y Offline.


## Alfa 0.86 · cambios de alcance (fase 19)

Las incidencias técnicas ahora pueden detener una obra para que el gobierno cooperativo acepte el costo/plazo adicional o lo rechace con una consecuencia de calidad. Se conserva el avance, los compromisos de tesorería se comprueban en servidor y el registro de contratos guarda la decisión. Online y Offline. Fase 19: 50%; siguiente foco recomendado: cadena de áridos/hormigón en fase 18.

## Alfa 0.87 · cantera privada (fase 18)

Una inversión industrial posterior a la procesadora de alimentos puede abrir una cantera local. Contrata personal, requiere redes eléctricas, agua y saneamiento, consume una reserva geológica finita y vende áridos con stock limitado a contratos de obra. Los pedidos recorren la red vial, ocupan la descarga de constructoras y acreditan ingresos a la cantera. UI de abastecimiento informa stock y reservas. Disponible Online; la compra y el consumo de materiales de obras también funcionan Offline desde Alfa 0.89. Fase 18: 75%. Próximo: verificar suspensión/reanudación completa y ampliar producción local.


## Alfa 0.88 · hormigonera local (fase 18)

La cantera vende áridos por carretera a una hormigonera local. La planta requiere trabajadores y redes urbanas, paga su operación y convierte dos áridos entregados en una unidad de hormigón. El proveedor mantiene existencias vendibles, y las recetas de viviendas, calles y servicios consumen hormigón durante construcción. Proveedores regionales continúan como respaldo. Disponible en Online/LAN y Offline. La versión 0.89 permite pedir materiales offline desde cada obra; la entrega por carretera habilita su consumo por etapas. Pruebas de conversión, ruta, cobro, consumo, migración y layout móvil/escritorio documentadas en `ESTADO_DESARROLLO.md`. Fase 18: 75%; global no estimable sin ponderaciones comunes verificables.


## Alfa 0.89 · abastecimiento y consumo de materiales Offline

El modo Offline ya ofrece la misma cadena básica de materiales de construcción: cada obra registra receta e inventario consumido por etapa; al faltar el siguiente lote, detiene la cuadrilla con el motivo. Desde la obra se elige proveedor, material y destino, se paga con caja de la constructora, se reserva espacio, y la carga llega siguiendo calles. La entrega ingresa al patio o depósito y la obra puede seguir. Los promotores privados de viviendas y comercios también compran sus materiales antes de iniciar, descontando el capital junto con el proyecto. En Chromium se verificó un pedido de hormigón de $372, la entrega y consumo en una obra, y el modal a 390×844 y 1440×900 con el botón visible. Sigue pendiente probar de forma explícita el bloqueo y la reanudación después de entrega en ambos motores y probar LAN entre equipos físicos. El progreso global del juego permanece sin estimación verificable.


## Alfa 0.90 · aserradero y madera local (fase 18)

Un nuevo emprendimiento industrial puede especializarse como aserradero. Mantiene caja privada y puestos, paga salarios y operación, y transforma dos troncos en una tabla según personal, redes urbanas, reserva forestal y espacio de acopio. El bosque regenera 18 troncos por mes hasta su límite. Las tablas aparecen en el proveedor local y se pueden comprar desde una obra: la entrega sale de la ubicación del aserradero, se descuenta de su inventario, acredita ventas a la empresa y llega al patio o depósito por carretera. Offline ofrece esta especialidad en la segunda fábrica y usa la misma transacción logística. Economía muestra reserva forestal, stock, producción y estado operativo. Chromium revisó el panel en 390×844 y 1440×900 sin desbordes. La construcción y apertura de la fábrica, y el ciclo de escasez/reanudación de obra, siguen pendientes de una prueba completa. Fase 18: 80%; el progreso global no se estima por falta de pesos comunes verificables.


## Alfa 0.92 · paridad industrial y regresión de suministro

Las fábricas especializadas dejaron de ingresar al proceso alimentario mensual Offline, evitando una doble operación y un proveedor ficticio. Se añadieron pruebas de integración para materiales de obra (bloqueo, pedido, transporte, recepción, consumo e inspección) en Online/Offline. GitHub Actions ejecuta las regresiones de ambos motores y sintaxis. Todavía falta validar la apertura de la metalúrgica desde obra industrial, producción con empleados y escasez prolongada. El progreso de fase 18 sigue al 85% y el global no es estimable.


## Alfa 0.93 · cantera y hormigonera autónomas en Offline

La cadena industrial de áridos→hormigón→obra funciona en ambos motores: extracción limitada por reserva y mano de obra, compras desde cantera a hormigonera por calles, precio pagado desde caja empresarial, transporte, entrada a inventario y conversión 2 áridos : 1 hormigón. Los promotores fijan el tipo de industria al contratar y reservan $4.200 de caja operativa; el contrato mantiene la especialidad hasta inspección y apertura. Testes automáticos verifican logística, trabajadores, reservas y costos sin crear dinero. La guía de fases conserva el progreso total sin estimación; la fase 18 avanza a 90% de cobertura documentada.


## Alfa 0.94 · recuperación autónoma de fábricas quebradas

Una fábrica cerrada por insolvencia puede tener un nuevo operador tras 90 días, si conserva suelo industrial compatible, existe demanda solvente por sus materiales o alimentos, y tiene ruta vial, electricidad, agua y tratamiento de cloacas suficientes. Un inversor privado aporta $5.300: $4.200 de capital operativo para la nueva firma, $900 para rehabilitación y $200 por permiso municipal. La constructora emplea cinco trabajadores durante siete días, después se inspeccionan servicios y acceso; una instalación sin cobertura permanece detenida. La nueva empresa abre con 20 vacantes, pero debe volver a contratar empleados y comprar insumos. El capital se transfiere, no se crea; los materiales de la empresa anterior no reaparecen. La ficha de parcela y Economía informan plazos, fondos, trabajadores y causas. Disponible Online y Offline, con pruebas integradas y Chromium.


## Alfa 0.95 · mercado de proveedores industriales competidores

El simulador conecta competencia entre fábricas a la compra efectiva de materiales en ambas modalidades. Cada cantera, hormigonera, aserradero o metalúrgica tiene un precio relativo dinámico, inventario propio, posición vial y caja propia. Al comprar para una obra se elige una planta conectada que tenga todo el lote, con mínimo costo de producto más flete; no basta con que varias plantas sumen inventario suficiente. Solo el vendedor ganador recibe el pago y pierde existencias. Una parte separada del costo se contabiliza como ingreso logístico, sin duplicar la caja empresarial. Las hormigoneras también adjudican automáticamente sus compras de áridos entre canteras rivales. Precio y stock por fábrica aparecen en Economía; la interfaz de pedido limita el lote a lo disponible en una planta individual y explica el criterio de adjudicación. Tests Python/Node y Chromium cubren los dos motores y las vistas 390×844/1440×900. Fase 17: 70%; fase 18: 90%; global sin estimación.


## Alfa 0.96 · materiales privados por carretera y contratación por demanda

Los promotores que inician viviendas y fábricas desde suelo zonificado, así como las inversiones comerciales delegadas, pagan materiales con capital privado y esperan envíos reales a los patios o depósitos. El motor selecciona lotes con stock suficiente, precio de cada fábrica, flete, rutas abiertas y espacio de descarga. La mercancía se descuenta al reservar y solo aparece en los almacenes tras el viaje; construir sin suministros conectados ya no es posible. Los contratos guardan el vendedor, el trayecto, los costos y el día previsto de llegada. Online y Offline funcionan con la misma lógica de caja y logística.

Las empresas además ajustan sus puestos de trabajo mensualmente. Abrir una vacante requiere ventas, liquidez y compra de equipamiento; mantener exceso de inventario y pérdidas durante períodos consecutivos puede obligarlas a recortar vacantes y despedir trabajadores reales, que vuelven a buscar empleo. Las metalúrgicas amplían la capacidad productiva al incorporar personal a equipos nuevos. Nuevas pruebas verifican suministro diferido, falta de capacidad, inversión productiva y despidos. Fases 17=75%, 18=90%; avance global no estimado.


## Alfa 0.97 · contratos industriales privados de suministro a plazo

Las hormigoneras pueden firmar automáticamente contratos de aprovisionamiento de áridos con una cantera operativa y conectada. Se adjudican por precio, distancia, inventario disponible y capacidad de pago; las unidades se apartan de la cantera en la firma y el dinero se mantiene en custodia. Un lote suficiente se distribuye en tres remesas escalonadas, que solo generan ingresos para la cantera y la logística cuando los camiones llegan. El corte de una calle posterga entregas; tras vencerse el plazo, las unidades no recibidas se reintegran a la cantera activa y el dinero pendiente vuelve al comprador. El contrato conserva historia de pagos, devoluciones, remesas entregadas e incumplimientos. Misma mecánica en Online y Offline, con resumen en Economía. No se simulan todavía contratos a plazo de madera, acero ni alimentación. Fase 17: 80%; fase 18: 90%; progreso global sin estimación.

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


**Rendimiento 3D:** [auditoría, cambios y mediciones](RENDIMIENTO_WEB.md).
