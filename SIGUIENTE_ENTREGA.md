## Alfa 0.245 · Árboles y rendimiento del mapa

Los árboles detallados ya no proyectan la sombra oscura que aparece al alejarse del tronco; se conserva el círculo suave debajo de cada árbol. El mapa muestra los FPS medidos en una etiqueta compacta que también cabe en móvil.

## Alfa 0.244 · Metas voluntarias de desarrollo de ciudad

La fase 14 ahora ofrece cinco objetivos optativos: ciudad funcional, conectada, resiliente, inclusiva y próspera. Cada ficha muestra sus condiciones reales y requiere seis cierres mensuales estables. El equipo puede pausar o cambiar el seguimiento sin penalización; completar objetivos no desbloquea herramientas ni modifica las elecciones. El foco y el progreso se comparten y guardan en LAN y Offline.

**Siguiente en fase 14:** especializaciones emergentes y trayectorias de desarrollo urbano a largo plazo; ampliar objetivos ambientales y de transporte. Mantener las funciones fundamentales disponibles y validar el equilibrio en ciudades pequeñas y grandes.

## Alfa 0.243 · Interfaz móvil

La interfaz móvil reorganiza los indicadores para que no se monten, corrige el desplazamiento vertical de la barra lateral y muestra los ocho accesos principales en dos filas. Pausa, velocidades, tema y sonido permanecen accesibles en el menú táctil; los avisos de vecinos se desplazan dentro de un panel acotado.

## Alfa 0.242 · Recorridos físicos de mercancías y compras

Alfa 0.242 representa el ciclo de los pedidos de fábrica que viajan por carretera: los camiones cargados siguen la ruta del envío hasta comercios, puertos o aeropuertos y vuelven vacíos según el progreso guardado en Online y Offline. La carga ferroviaria continúa en sus trenes. Los viajes de compras muestran a los peatones entrando al local y saliendo con bolsas, también cuando llegaron en auto o bicicleta.

Siguiente en fase 22: conectar visualmente la primera y última milla de la carga ferroviaria con sus estaciones y coordinar los vehículos con horarios y colas viales. Después, seguir con respuesta a accidentes y capacidad detallada. La validación LAN física entre equipos con Hamachi sigue pendiente.

## Después de Alfa 0.239 · Validación LAN y fase 22

Alfa 0.239 conecta las fábricas con excedentes, las estaciones elevadas y el puerto. Los envíos ferroviarios requieren dos terminales físicas activas, una línea operativa y acceso vial local. Cada salida respeta un calendario de tres días, el aforo compartido del tren y de ambos patios terminales; la carga ocupa inventario del puerto, espera el barco y genera el flete municipal al llegar al mercado. La partida local y el servidor aplican las mismas reglas, el panel muestra sus cifras y la escena representa terminales y trenes de carga.

Siguiente: validar la sesión LAN entre dos equipos físicos con Hamachi. En fase 22, continuar con capacidad física compartida entre pasajeros y mercancías en los corredores, y ampliar los recorridos de carga cuando haya infraestructura correspondiente. Este entorno no tiene acceso a equipos Hamachi para hacer esa prueba.

## Después de Alfa 0.238 · Carga ferroviaria y validación LAN

Alfa 0.238 enlaza las colas de nueve franjas con los tiempos estimados Offline, de forma idempotente. Alfa 0.237 amplía el acceso peatonal desde el origen y destino hasta tres parcelas, manteniendo el intercambiador físico en un máximo de dos. Alfa 0.236 completó una mecánica pendiente de la fase 22: viajes reales de compras, servicios y ocio pueden transbordar entre dos líneas de subte y tren elevado. Se requieren líneas activas con energía, flota y aforo, estaciones construidas con calle adyacente y un intercambiador a dos parcelas o menos. Cada tramo reserva su capacidad; el segundo boleto tiene 25 % de descuento y ambos se liquidan una sola vez al hogar. Offline y LAN aplican las mismas reglas.

Offline ahora ejecuta los viajes cotidianos ya definidos en el juego y los asigna a colectivos, subte, tren y taxis. Las rutas aparecen en el estado de la partida y alimentan la cola vial de nueve franjas. El cierre mensual conserva los registros de boletos.

Siguiente sistema: desarrollar una terminal de carga ferroviaria y permitir que fábricas envíen mercancía física al puerto con capacidad, horarios, inventario, costes y entregas verificables. Mantener pendiente la prueba LAN entre dos equipos físicos; el entorno de este desarrollo no tiene acceso a equipos Hamachi para hacerla.

## Después de Alfa 0.232 · Respuesta con varias bases

La interfaz comprueba que se pueda desbloquear un sector vecino, construir una clínica junto a una calle y conservarla tras recargar. El perfil de expansión mantiene cinco sectores, 40 tramos de vía y la clínica periférica durante 360 cierres mensuales, junto a cuatro perfiles económicos de referencia.

Completado en Alfa 0.233: pruebas Online y Offline cubren la elección de la base más cercana, el uso de una segunda unidad mientras la primera está ocupada y el desvío cuando se corta el acceso vial. La validación LAN entre equipos físicos sigue pendiente.

## Alfa 0.230 · Patrullas y cobertura explicada

Cada móvil policial queda reservado para una sola incidencia hasta completar el regreso; la capacidad mensual sigue limitada a dos despachos por vehículo. Ciudad → Seguridad muestra los móviles libres/ocupados y, por inmueble sin cobertura, explica si falta equipamiento, conexión vial, presupuesto o personal. La escena 3D identifica el móvil y reproduce el recorrido de ida y vuelta. LAN y Offline usan las mismas reglas.

Siguiente: terminar la validación de fase 1 construyendo edificios en sectores remotos y midiendo una partida extensa. La prueba actual ya desbloquea varios sectores, construye 40 tramos de calle y conserva el guardado al recargar. Después, verificar despacho policial con varias bases, rutas y móviles ocupados. Mantener pendiente la validación LAN entre dos equipos físicos y no atribuir avance global sin ponderaciones comunes.

## Antecedente · Alfa 0.171 · Infraestructura real antes que paneles

**Regla de diseño:** ningún nuevo sistema de movilidad puede ponerse en funcionamiento sin objetos 3D físicos que el jugador deba construir en terreno habilitado. En Alfa 0.171, subtes y trenes elevados ya requieren estaciones terminadas y el jugador conecta las dos estaciones directamente en el mapa. Movilidad sirve para estadísticas y diagnósticos, no para contratar infraestructura.

Próximo: estaciones intermedias con andenes y capacidad, transbordos entre subte y tren elevado a través de estaciones construidas, depósito/terminal ferroviaria y cargas de fábricas al puerto. Revisar gradualmente los demás paneles para retirar botones que implementen servicios sin una infraestructura y cadena constructiva real. Mantener verificaciones de terreno, caja, cuadrillas, energía y paridad LAN/Offline. No atribuir avance global sin ponderaciones homologadas.

## Después de Alfa 0.170 · Próxima etapa fase 22

La combinación colectivo↔subte y colectivo↔tren elevado ya reasigna pasajeros existentes, cobra tarifas por tramo y exige capacidad real. Próxima iteración: añadir estaciones intermedias sobre trazados ya contratados y transbordo entre líneas ferroviarias, manteniendo dosificar andenes y rutas causales. Luego desarrollar trenes de carga con clientes industriales reales, carga física, vías portuarias, inventarios y costes; evitar únicamente trenes decorativos. Mantener equivalencia LAN/Offline, tests responsive y la validación LAN entre dos equipos físicos.

## Próxima iteración después de Alfa 0.169

Priorizar la red ferroviaria de fase 22 con conexiones verificables entre tren elevado, subte y colectivo, estaciones intermedias, material ferroviario especializado y carga industrial por rieles hasta el puerto. Las vías nuevas deben reservar suelo, y el gasto de mantenimiento, dotación y carga no debe simularse sin recursos. Conservar equivalencia Offline/LAN; probar entre dos computadoras cuando haya acceso físico.

## Después de Alfa 0.168 · Prioridad: movilidad intermodal (fase 22)

La red de subte ya tiene accesos, obras y formaciones proyectados en 3D. **Siguiente entrega jugable:** transbordo comprobable entre subte y colectivos para viajes de compras y servicios. Exigir paradas/estaciones accesibles, cupos de ambos modos y tiempo puerta a puerta; una persona no puede contarse en dos modos ni pagar dos veces por error. Implementar igual en LAN y Offline con pruebas de aforo, tarifas, energía, pausa y recorridos cortados. Después priorizar estaciones multiacceso, personal ferroviario y ferrocarril/carga industrial.

Antes de integrar Alfa 0.168, verificar CI y render real en 390/1440 px. Mantener pendiente la prueba LAN entre dos equipos físicos y no estimar avance global sin pesos verificables del roadmap.

## Alfa 0.167 · Primera línea de subte operativa (fase 22)

Una línea municipal de subte se proyecta entre dos edificios conectados por calles, con túnel subterráneo y dos estaciones. Contratarla descuenta la inversión por trazado y compra de trenes; el contrato pasa por estudios, excavación, instalaciones e inspección durante varios días y se detiene si faltan cuadrillas. Tras habilitarse, requiere energía, formaciones y presupuesto. Frecuencia, aforo y gastos dependen de la flota; utiliza visitas reales a comercios y servicios y reemplaza autos particulares cuando el tiempo de viaje lo justifica. Se cobran boletos de hogares al cierre sin inventar ingresos. LAN/Offline, pruebas y panel responsive.

**Próximo sistema (no detalles):** ramales y red de subte con transbordos metro-colectivo, trenes metropolitanos de superficie y carga industrial vinculada al puerto. La primera etapa no cruza el río y no ofrece representación 3D de túneles.

## Alfa 0.166 · colectivos intermodales para compras y servicios

El viaje no laboral conserva visitantes reales de comercios y equipamientos. Los colectivos de turno mediodía llevan solo pasajeros con plazas y paradas accesibles. Los viajes se pueden transbordar entre dos líneas con descuento y reserva de capacidad en cada tramo; el remanente utiliza el modo de origen. Una misma persona no puede subir a un taxi y colectivo a la vez. Se cobra a cada hogar el boleto efectivamente consumido al cierre municipal y se registra el dinero recibido. Movilidad expone pasajeros por línea y total de transbordos.

**Próximo hito principal del roadmap:** fase 22, sistema de metro con estaciones, proyecto de obra civil, trenes/energía, demanda real, capacidad, costos y transbordos entre medios; continuar fases 23–25 en paralelo según factibilidad geográfica. Pruebas de LAN física pendientes.

## Alfa 0.165 · viajes persistentes en el mapa 3D

Al construir una calle se conservan la posición y ruta de actores ya existentes. Se retiraron peatones y camiones decorativos sin itinerario causal. Los viajes de trabajo, compras y servicios permanecen ligados a personas de la simulación. 142 pruebas Python pasaron. Progreso global no estimable sin pesos verificables de las 34 fases.

## Alfa 0.164 · Demanda basada en plazas y locales disponibles

Se separa interés por migrar de déficit habitacional: si queda capacidad habitable la presión residencial es 0%, se siguen ocupando viviendas en los siguientes días y el promotor no inicia más casas; con todas las plazas completas vuelve la presión acumulada. Comercio: locales con ventas cubiertas son oferta todavía disponible y frenan obra nueva, independientemente del umbral de población; se mantiene la construcción cuando falta capacidad y existe demanda insatisfecha. El juego incluye un test visual equivalente al escenario 0/28 y pruebas de ambos motores.

**Próximo:** introducir oficinas como edificios distintos y su oferta laboral/comercial con ocupación propia; continuar conductores de taxis y subte, verificar LAN entre dos equipos y capacidad en 30 años.

## Publicación Alfa 0.163 · historial completo y preventivo

Se publicaron entradas específicas de Alfa 0.162 para el puente y de Alfa 0.163 para viajes de pasajeros de taxi en la pantalla «Cambios y novedades». Se sincronizan título de pestaña, metadato de versión, importaciones y recuperación de caché, paquetes de CI y prueba de arranque de Cambios. El pipeline exige en cada PR con código nuevo una versión superior y notas visibles. **Próximo hito de simulación:** personal y turnos de taxis, despacho, subte e intermodalidad.

## Fase 7 · pasajeros reales en circuitos de taxi

Los taxis recogen demanda ya existente de desplazamientos en automóvil hacia comercios y equipamientos cívicos cuando origen y destino están a una cuadra de dos paradas diferentes y el circuito vial permanece conectado. Se limitan a ocho pasajeros diarios por vehículo; esos viajeros dejan de computar como autos particulares en el modelo de esos desplazamientos. Se añaden ocupación diaria, ingreso tarifario acumulado en cada mes y proyección orientativa, con flujo vial y emisiones del taxi. La facturación se asienta por día, sin duplicarse al consultar repetidamente el estado; el cierre municipal incorpora los ingresos. Equivalencia Online/Offline y regresiones nuevas.

**Próximo:** integrar choferes habilitados, horarios, espera y despacho puerta a puerta; luego red de subte y transbordos de fase 7. Las tarifas siguen fijas, sin transporte de turistas o pasajeros aéreos. Probar LAN física y viaje por el puente en dispositivos reales. Sin porcentajes globales no ponderados.

## Fase 7 · cruce vial del río (integrado en main)

Se incorporó una primera obra contractual de puente sobre las dos celdas del cauce (x=24–25): requiere calle conectada en x=23 y suelo habilitado, compara constructoras con sus precios/plazos y no habilita los tramos hasta la inspección. Al finalizar, permite prolongar la red con una calle en x=26. Offline y LAN conservan el mismo contrato, gasto y mantenimiento; el render 3D muestra tablero, barandas y pilotes. Las pruebas cubren contratación, validaciones y cruce terminado.

**Próximo:** revisar la obra en partida larga y navegador real, verificar navegación de vehículos y expansión al este, medir balance y condición de puente; continuar viajes de pasajeros/transbordos y conexión intermodal de fase 7. La prueba LAN física entre dos equipos sigue pendiente. No calcular avance global sin pesos para las 34 fases.

## Después de Alfa 0.159

Retomar puentes para cruzar el río y movimiento de pasajeros en fase 7. Verificar en partida prolongada que los nuevos hospitales, comisarías y cuarteles atraigan personal y sus recursos entren en servicio; conservar la prueba de colocación inmediata en CI. Probar LAN física entre dos equipos. Global aún sin estimar hasta definir pesos comunes para las 34 fases.

## Después de Alfa 0.158

Avanzar la mecánica de puentes para cruzar el río sin bloquear la expansión al este; luego retomar pasajeros/transbordos y conexión intermodal de la fase 7. Vigilar rendimiento de la malla del río en dispositivos móviles. Probar LAN física entre dos equipos y mantener las regresiones de arranque y construcción. Global aún sin porcentaje por falta de pesos homogéneos para las 34 fases.

## Después de Alfa 0.157

Medir crecimiento sostenido de hogares y capital privado en una partida larga; luego avanzar fase 7 con pasajeros/transbordos y conectividad portuaria/aérea. Revisar que el mínimo de demanda no produzca congestión irreal en ciudades grandes y balancear sin detener el flujo de interesados.

## Después de Alfa 0.156

Retomar mecánicas de fase 7: pasajeros/transbordos y conexiones de subte, puerto y aeropuerto. Comprobar en partida real que el nuevo ritmo permite observar ciclos completos a x1/x2/x4. Mantener regresión de arranque offline y pruebas del reloj en cada publicación.

# Siguiente entrega · después de Alfa 0.156

1. Continuar hito de fase 7 con pasajeros/transbordos, subte/cámara inferior, cruceros y conexión del aeropuerto; no dedicar iteraciones seguidas solo a detalles.
2. Probar LAN física entre dos equipos y mantener las regresiones de modo local/Play/Pausa/Construir/Ciudad en CI.
3. Validar las miniaturas en dispositivos reales y ajustar el scroll del catálogo si el aumento de tamaño reduce demasiado el área de tarjetas.
4. Avanzar exportación industrial marítima/aérea con viajes y liquidación verificables.
5. Global permanece sin estimar mientras falten pesos homogéneos para las 34 fases.

## Alfa 0.155 · regresión detectada y resuelta

Se normalizan listas ausentes en guardados offline antiguos y el render 3D no asume `buildings`/`projects`. La prueba dedicada de Chromium para partida fresca y guardado heredado quedó agregada al workflow de cada push. Próximo: seguir fase 7 con una mecánica nueva (pasajeros/transbordos o subte), manteniendo la prueba de arranque.
## Continuación después de Alfa 0.165

Prioridad de mecánica: fase 7, transportar pasajeros no laborales (compras/servicios) en colectivos, respetando paradas, capacidad por franja, transbordos, colas viales e ingresos sin duplicación. Implementar la misma regla Online/Offline y probar trayecto y costo en una ciudad con calles cortadas como control. Después avanzar movilidad intermodal. No invertir otra entrega en detalles visuales mientras las mecánicas principales estén incompletas. Mantener prueba Chromium de arranque offline. Global sigue sin estimarse: faltan pesos homogéneos verificables para las 34 fases.
