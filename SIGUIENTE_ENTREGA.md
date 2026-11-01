# Siguiente entrega · continuidad

## Próximo paso · Alfa 0.113

Fase 7: implementar accidentes viales con causas reproducibles, bloqueo de tramos, demoras visibles y respuesta municipal limitada por personal/rutas. Luego ampliar capacidad y colas por franja horaria. Capacidad, estado físico vial, congestión y espera semafórica ya afectan viajes motorizados Online/Offline.


## Punto de continuación después de Alfa 0.110

1. Revisión visual de `design_reference_3d/` frente a `art_validation/`. Refinar proporciones, fachada cercana y costa sin cambiar `waterTile` ni la topología de rutas.
2. Implementar LOD por distancia y medir render en ciudades grandes; el pase actual comparte geometrías pero añade mallas a los edificios.
3. Volver a mecánicas nuevas: fase 7, tiempos viales autoritativos con capacidad y semáforos, accidentes y respuesta municipal. Mantener Online/Offline alineados.
4. Mantener ZIP completo, commit en `main` con email válido, verificación del commit, historial de versiones y porcentajes por fase honestos. LAN entre dos equipos físicos y accesibilidad siguen pendientes.


## Punto de continuación después de Alfa 0.109

1. Verificar el despliegue de `main` y una sesión LAN física de dos equipos; la UI no garantiza esa prueba.
2. Fase 7: accidentes viales causales con cierre temporal de calle y respuesta municipal limitada. Después, capacidad por franja horaria y colas persistentes. Mantener paridad Online/Offline.
3. Fase 15: comparar las trece capturas originales de `design_reference/` con móvil/escritorio, refinar arte del mapa y revisar teclado/lector de pantalla. No sustituir sistemas por cifras de maqueta.
4. Conservar un ZIP completo por entrega, publicar `main` con email Git válido y actualizar historial y progreso por fase. El total del juego sigue sin porcentaje hasta fijar pesos y criterios de aceptación para las 34 fases.


Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md` (34 fases). Priorizar sistemas jugables con causas, costos y consecuencias; evitar dedicar entregas a detalles mientras quedan mecánicas vacías.

## Histórico: estado al cerrar Alfa 0.84

La fase 30 comenzó con ocho edificios históricos inventariados, protección parcial/integral y obras de rehabilitación conectadas a constructoras, cuadrillas, materiales, entrega, etapas y conservación final. El resto del tejido conserva su edad, uso original y reformas. Alfa 0.69 suma reconversión privada de locales cerrados a vivienda con permiso, inversión, cuadrilla y etapas de obra; migración por empleo/aprobación y alquiler a los nuevos residentes. Aún no mide desplazamiento, protege inquilinos, incorpora alquileres de mercado dinámicos ni transforma arquitectura por décadas. Alfa 0.63 inició fase 31 con desgaste vial financiado desde Redes y residuos. Alfa 0.64 suma edificios públicos a la misma cartera: condición según carga, diagnóstico, inspección de un día, licitación de reparación y cuatro trabajadores durante la obra. Cuando al menos 35% de los tramos cae bajo 45% o 25% de los edificios públicos queda bajo 60%, el nivel de servicios baja un punto por mes hasta corregir la cartera. Fase 30 permanece parcial. Hacienda de fase 29 continúa operativa con créditos, impuestos, reserva y presupuestos por programa.

## Sistema agregado en Alfa 0.65

Los seis tendidos de servicios guardan condición por tramo. La carga local acelera el deterioro y la financiación de Redes lo mitiga; una falla crítica desconecta la línea hasta reparar. El tablero de Servicios informa la condición de cada red. Es un primer circuito de fase 31; se verificó el corte y restablecimiento de una línea en ambos motores, además del panel de condición en móvil y escritorio.

## Sistema agregado en Alfa 0.66

Una calle que cae bajo 25% de condición queda cerrada en la red de rutas. Los recorridos buscan desvíos; sin alternativa, el acceso al destino se interrumpe. La cuadrilla de rehabilitación la reabre después de recibirla a 82%. Las barreras del mapa y el inventario de Mantenimiento reflejan el cierre.

## Sistema agregado en Alfa 0.67

La condición estructural de centrales, plantas potabilizadoras y depuradoras determina su aporte físico a la red. A 82% entregan su capacidad base; por debajo, su producción disminuye proporcionalmente y cambia la cobertura de energía, agua y tratamiento. El panel de Mantenimiento muestra producción y porcentaje funcional, y la rehabilitación restaura el nivel base. Online y Offline.

## Sistema agregado en Alfa 0.69

Las tiendas que cerraron pueden convertirse en viviendas cuando no arrastran deuda y no están protegidas. Promotores pagan obra; una empresa compromete cuadrilla durante 20–30 días y la inspección final habilita 24 plazas. Las mudanzas responden a empleo y aprobación; alquileres empiezan al mes siguiente y la mora puede reducir apoyo. Disponible Online/Offline en esquema 53.

## Sistema agregado en Alfa 0.68

Centrales eléctricas, plantas potabilizadoras y depuradoras tienen revisión preventiva cada 180 días. El vencimiento abre un expediente al cierre mensual; revisar cuesta $150 y toma un día. Si la planta aún conserva la salida de diseño, no hace falta obra y el plazo se reinicia. Si perdió capacidad, el informe habilita la licitación y el contrato de rehabilitación existente; recuperar condición 82% devuelve la capacidad base. Guardados migran al esquema 52. Chromium verificó el ciclo Online/Offline, móvil y escritorio sin solapamientos ni overflow horizontal.

## Próximo sistema

Abrir fase 32 con mandatos y elecciones que evalúen empleo, vivienda, servicios, impuestos y bienestar con causas rastreables; una derrota electoral debe terminar la partida competitiva para todo el equipo. Luego seguir fase 30 con protección de inquilinos y desplazamiento, y ampliar fase 31 al mantenimiento de activos privados.

## Verificación

Online y Offline completaron la degradación de la Municipalidad por debajo de 60%, diagnóstico, inspección ($150/1 día), adjudicación a Sur Obras ($900/4 trabajadores/5 días) y rehabilitación final a 82%. Móvil/escritorio: subpestañas de inventario sin desborde horizontal y scroll vertical.

La simulación Online y Offline calcula los mismos costos y reglas de mantenimiento. El cierre mensual usa el factor efectivamente pagado por el programa Redes; revisar también la condición inicial y el primer cierre en el navegador antes de ampliar activos.

Online y Offline completaron protección y rehabilitación patrimonial: materiales consumidos, costo municipal, demora de proveedor, cuadrilla ocupada por 20 días, reforma persistente y conservación final de 100%. Chromium a 390×844 y 1440×900: controles y categorías dentro del modal, scroll vertical, sin overflow horizontal ni errores JS. No se probó LAN entre dos equipos ni Vercel.

## Medición del progreso global

El porcentaje total queda sin estimar: faltan pesos estables y criterios de finalización verificables para las 34 fases. No se convierte el número de entregas, archivos o pruebas en avance del juego.


## Sistema agregado en Alfa 0.70

Se incorporó la primera mecánica de gobierno competitivo de fase 32: mandatos de cuatro años, sondeos y voto por tres distritos, causas locales de apoyo, historial persistente y derrota compartida. Se mantiene parcial hasta añadir metas verificables del plan municipal, reclamos geolocalizados, transparencia y recuperación/destitución por crisis graves.

## Punto exacto para continuar

Próxima entrega: fase 32, crear registro de reclamos ligados a averías/colas y necesidades reales por distrito; añadir metas de mandato medibles (empleo, plazas de vivienda, servicios y mantenimiento) y comparar su avance en elecciones. Mantener en paralelo el modo de observación tras una derrota. No dedicar la próxima versión a pulir visuales; primero cerrar el circuito de sistema y comprobar sus efectos en ambos modos.


## Sistema agregado en Alfa 0.71

La fase 32 ahora establece metas de empleo, vivienda y servicios por mandato; cada cierre mensual actualiza los resultados. Reclamos vecinales se abren cuando indicadores de un distrito cruzan umbrales y bajan su apoyo hasta corregirse. Una crisis simultánea de caja, servicios y confianza emite alerta antes de destituir al equipo; recuperar caja o servicios permite evitarlo. Disponible Online/Offline, esquema 55.

## Punto exacto para continuar

Conectar los reclamos a incidentes observables existentes (servicios cortados, listas de espera, deterioro vial) y registrar quién toma acuerdos municipales en la sala, sin introducir formularios desconectados del estado del juego. Luego ampliar fase 33 con envejecimiento y transformación de barrios por décadas.


## Sistema agregado en Alfa 0.72

Los reclamos muestran causas territoriales existentes; los acuerdos de equipo fijan autor y 180 días. Resolver la causa los cumple; dejar vencer el plazo afecta apoyo local y voto. Online/Offline, esquema 56. El panel Cambios lista las 34 fases con barra, alcance y pendientes.

## Próxima entrega: fase 33

Priorizar un primer circuito jugable de evolución por décadas: avanzar edad/época del tejido construido, habilitar cambios visibles de uso o arquitectura según demanda, conservación, inversión y presión de vivienda, y persistir los resultados en Online/Offline. Mostrar por qué cambia cada edificio o barrio. Dejar pendientes de fase 32 para futuras pasadas y evitar otra entrega dedicada solo a paneles o detalle visual.

## Verificación de Alfa 0.72

Pendiente de completar antes de publicar: compilación Python/JavaScript, flujo de acuerdo en ambos motores y revisión visual móvil/escritorio de Cambios y Gobierno. LAN con dos equipos físicos permanece sin probar.

## Sistema agregado en Alfa 0.74

Fase 33: edades de residentes, entradas y salidas de empleo, nacimientos condicionados por capacidad y fondos familiares, envejecimiento de activos privados y rehabilitaciones con capital, inventario de constructora, permiso, cuadrilla, plazo e inspección. La ciudad muestra barrios y edades de forma legible; edificios deteriorados y andamios se distinguen en el 3D. Online/Offline, esquema 57. Fase todavía parcial: no está demostrado un escenario continuo de 30 años.

## Punto exacto para continuar

Seguir fase 33 con un simulacro reproducible de 30 años en ambos motores: hacer sobrevivir inversiones y contratos a elecciones, evaluar cierres y aperturas empresariales junto al desgaste ya agregado, y medir caja, demanda, empleo, población y materiales sin generación gratuita. Después probar escenarios pequeños, metropolitanos, portuarios y turísticos. Priorizar esta jugabilidad y reportar adversidades; mantener la UI de Evolución sin agregar otra capa de pulido.

## Verificación de Alfa 0.73

Compilación Python/JavaScript correcta. Pruebas del motor Online cubrieron ingreso a edad laboral, jubilación y vacante, desgaste y necesidad, inventario real, costo privado, permiso, obra con cuadrilla y plazo, inspección y capacidad adicional; también nacimientos y balance decenal. La acción HTTP en sala y la acción Offline pasaron. Chromium revisó Evolución en móvil (390×844) y escritorio (1440×900); no hubo overflow horizontal ni errores JS, y el botón de rehabilitación fue alcanzable tras scroll vertical. La corrida continua de treinta años sigue pendiente. LAN física/Vercel sin prueba.


Fase 33 sube a 25% orientativo: las exportaciones ahora compiten por unidades y presupuesto de tres mercados finitos según personal, precio, condición, servicios y acceso vial/portuario, en Online y Offline (esquema 58).

## Punto exacto para continuar

Implementar una apertura privada de comercios enlazada al mercado regional finito y a suelo/capital/trabajo reales, junto con ciclos de inversión; medir cierres y supervivencia durante trayectorias de largo plazo. Después construir la prueba acelerada de 30 años y los escenarios pequeño, metropolitano, portuario y turístico. Evitar nuevas entregas de detalle de UI salvo correcciones de legibilidad.

## Verificación Alfa 0.74

Online: sin ruta, oferta 0; con salida, reparto finito y cierre comercial respetaron el cupo (127 unidades, ingreso $1.778 ≤ presupuesto $3.091). Offline en Chromium migró esquema 57→58 y cerró mes con cupo real (116 unidades, $1.624 ≤ $2.826). Sintaxis y JSON correctos. Puerto se revisó en 390×844 y 1440×900, sin overflow horizontal ni errores JS. LAN entre dos equipos físicos, Vercel y corrida de 30 años siguen pendientes.


## Avance agregado en Alfa 0.75

Fase 33: el mercado finito ahora puede proponer una inversión privada de comercio solo con ventas no cubiertas, parcela conectada, caja privada y municipal y una cuadrilla disponible. Aprobar usa las etapas de obra existentes; una oferta rechazada no cuesta dinero. Hogares, peatones y vehículos con datos simulados tienen panel de inspección, y el submenú de Ciudad es desplazable horizontalmente. Modo Online/Offline, guardados esquema 60. El panel de fases señala fase 33 al 30%; el juego completo sigue sin estimación global por falta de ponderación estable.

## Próxima entrega concreta

Probar una ciudad reproducible durante 30 años en modo online y offline; medir solvencia, capital privado, demanda, aperturas/cierres, materiales, empleo, envejecimiento, migración y resultados electorales. Corregir los desequilibrios que aparezcan. Luego cumplir escenarios pequeño, metropolitano, portuario y turístico. Comprobar interfaz móvil/escritorio y estado del scroll de Ciudad. `CONTINUIDAD_IA.md` contiene arquitectura y parámetros para retomar este punto.


## Sistema agregado en Alfa 0.76

Migración residencial ahora sincroniza ocupación con residentes identificables en los dos motores. Las llegadas crean cohortes etarias y perfiles laborales; las salidas liberan personas y puestos. Avance de fase 21: 60%; fase 33 se conserva en 30% hasta verificar los escenarios largos.

## Próxima entrega concreta

Ejecutar una simulación reproducible de 30 años Online y Offline y registrar diez años por vez: población por edad, mudanzas, empleo, caja familiar, empresas, vivienda, rehabilitaciones, mantenimiento, transporte, elecciones, deuda y recursos. Comparar varias estrategias de ciudad y corregir desequilibrios demostrados por las corridas; luego validar los escenarios pequeños, metropolitanos, portuarios y turísticos.


## Sistema agregado en Alfa 0.77

La política opcional de delegación puede contratar automáticamente una propuesta comercial cuyo permiso esté dentro del tope. La condición económica y operativa reusa demanda, terreno, capital, caja, contrato y cuadrilla; fuera del límite queda revisión manual. Cliente Online/Offline, guardado esquema 60. Fase 33: 35% orientativo. Pendiente inmediato: verificar contratación y rechazo por límite en Offline; luego ejecutar perfiles de 30 años pequeño/metropolitano/portuario/turístico y completar trayectorias/recuperación según fase 33.


## Sistema agregado en Alfa 0.78

Los proyectos estándar llevan origen de mandato y se muestran como obligaciones activas/heredadas en Gobierno; el resultado electoral guarda la cartera y las victorias mantienen el contrato y su saldo. Pruebas de elección y obra en ambas simulaciones. Fase 33: 40%. Próximo: simular 30 años en ambos motores; ampliar la verificación de continuidad a deuda, rehabilitación y mantenimiento, y probar perfiles urbanos pequeños, metropolitanos, portuarios y turísticos.


## Próxima entrega tras Alfa 0.79

1. Verificar en Chromium la pantalla Ciudad > Suelo y los controles de pintura a 390×844 y escritorio; corregir cualquier solapamiento o overflow.
2. Llevar el guardado Online hasta completar vivienda privada y comprobar que un residente individual consume la demanda; repetir la secuencia de fábrica Offline y corregirla.
3. Implementar compras/materiales de construcción en la tubería Offline y promoción comercial automática por zona permitida para cerrar paridad.
4. Extender demanda industrial con materias primas pagadas y capacidad/stock, y registrar diferencia local/importada.
5. Retomar la simulación de décadas de fase 33 después de que este crecimiento autónomo esté probado.


## Punto exacto tras Alfa 0.80

Probar varios cierres mensuales con hogares que llegan después de que la vivienda termina, y con fábrica que enfrenta escasez de trabajadores, cortes de servicio, costes y competencia. Corregir consumo de materiales en la construcción Offline y comparar inventarios/ventas locales en ambos motores. Mantener los porcentajes por fase salvo que nuevos criterios aceptados cambien cobertura; después retomar corridas reproducibles de 30 años de la fase 33. La prueba LAN física y la publicación Vercel siguen pendientes.

## Alfa 0.81 · punto de continuación

La prioridad inmediata es ejecutar escenarios de crecimiento autónomo en los dos motores: demanda residencial sin zona vs. con zona verde; tiendas por escasez local/regional en zona azul; fábrica tras actividad comercial con parcela amarilla. Confirmar que cada obra cobra permiso, reserva capital, necesita contratista y respeta disponibilidad de recursos; comprobar que hogares solo entran tras inspección y empleo potencial. Revisar la ficha de parcela en móvil y escritorio. Luego profundizar fases 17/18 con materias primas y competencia, y continuar capacidades cooperativas sin restringir acciones de invitados.


## Alfa 0.82 · siguiente sistema

Fase 18 queda en 60%: existe un circuito completo de grano regional finito→procesadora→tiendas, pero faltan otras categorías y escasez logística cruzada. La próxima entrega debe añadir al menos áridos→hormigón→obras y/o madera→materiales, con stock, compras, transporte, costos y bloqueo verificable cuando no haya carga. Luego continuar fase 19 con dirección de obras. No dedicar entregas a pulido aislado mientras queden cadenas centrales incompletas.


## Alfa 0.83 · avance de fase 19

La confiabilidad de la constructora y su ocupación de capacidad ya generan revisiones mensuales reproducibles. Una demora deja causa y días persistentes, consume la jornada sin trabajo y amplía el plazo antes de que se vuelvan a certificar avances. Está implementado en Online y Offline. Siguiente mecánica de fase 19: certificación por hitos verificables con retención final; después, garantías/reparación de defectos. Mantener fase 19 parcial y global no estimable.


## Alfa 0.84 · continuación de fase 19

Los certificados ahora siguen el avance de etapas; falta implementar retenciones, recepción provisional y garantía sin liberar dos veces el saldo reservado. Conectar un defecto de inspección/calidad a una reparación/reclamo pagado por el contratista y visible en el registro. Mantener 19 en 40% hasta cerrar otro criterio completo. Después continuar fase 18 (otras materias primas industriales) y fases pendientes de servicios/seguridad. El progreso global sigue sin estimarse.


## Alfa 0.85 · siguiente paso

Fase 19 llegó a 45% con pagos certificados, retención de 10%, inspección de defectos, reclamo y reparación trazable en ambos motores. Próxima entrega: luego añadir órdenes de cambio y resolución de disputas con evidencia económica. Después retornar a fase 18 y ampliar otra cadena material (áridos/cemento para obras) para no concentrar entregas en licitaciones. Mantener el desarrollo centrado en sistemas jugables y consecuencias; no pulir UI fuera de lo necesario. LAN física y Vercel continúan pendientes. Progreso global no estimable sin ponderación estable de fases.


## Alfa 0.86 · próximo paso

Fase 19 está en 50%: órdenes de cambio con causa técnica y decisión de costo/plazo/calidad Online/Offline. Priorizar ahora otro sistema nuevo: fase 18, cadena local de áridos → hormigón → obras, conectando existencias, plantas, transporte y pedidos, sin extender más la adjudicación salvo correcciones necesarias. Más adelante completar disputa formal/evidencia, multas y rescisión de contratos. LAN en dos equipos y despliegue Vercel permanecen pendientes de prueba externa. Global no estimable sin pesos comparables para las 34 fases.

## Alfa 0.87 · siguiente paso

La fase 18 llegó a 65% con extracción privada de áridos, empleo/servicios, reserva agotable, pedidos pagados y rutas por camión. Próxima mecánica: completar áridos → hormigón → obra, con insumo agregado consumido por planta, personal/utilidades, existencias y entrega que afecte certificados. Después ampliar madera/acero. Llevar las órdenes al adaptador Offline y probar el LAN en equipos físicos continúa pendiente. Priorizar comportamiento e inventarios; no hacer otra versión de pulido. Progreso global no estimable sin pesos comunes para las 34 fases.


## Alfa 0.88 · siguiente paso

Fase 18=70%: hay áridos finitos, cantera, hormigonera que los compra por carretera, conversión 2:1, stock vendible y recetas de hormigón que consume la obra. El endpoint ya verifica compra y stock insuficiente, y `missing_materials` verifica el bloqueo por hito. Antes de ampliar la cadena, simular un tick completo de obra que se suspenda, reciba el camión y reanude el avance. Luego llevar el modelo de materiales al motor Offline (pedidos, stock, saldo, tiempos y bloqueo de obra), y abrir madera/acero industriales; no sobreprofundizar la cantera. Mantener como límite actual que estas compras funcionan solo Online/LAN. Fase siguiente amplia según roadmap: continuar fase 19 después de cerrar pruebas de construcción integradas. La prueba LAN en dos equipos y el deploy Vercel siguen sin evidencia. No estimar progreso global sin pesos estables comparables para las 34 fases.


## Entrega al cerrar Alfa 0.89 · histórico

La siguiente mecánica debe ser verificación explícita del ciclo completo de escasez en los dos motores: obra suspendida por material de etapa, pedido a proveedor con suficiente stock, pago/caja consistente, ETA y ruta vial, recepción en destino, reanudación con avance no duplicado e inspección final. La interfaz se revisó en móvil 390×844 y escritorio 1440×900 para el modal de compra; mantener esa comprobación si se modifica la ventana. Después ampliar fase 18 con aserradero/madera y acero regional/local con causas de operación y consumo real. No dedicar la siguiente entrega a pulido aislado. No afirmar LAN entre dos dispositivos ni publicación Vercel probadas. Progreso fase18=75%; progreso global no estimable mientras no haya ponderación verificable común.


## Entrega al cerrar Alfa 0.90

Primero probar end-to-end la nueva cadena: adjudicar la segunda fábrica como aserradero, terminarla, asignar trabajadores, ver efecto de servicios/caja/reserva, generar stock finito, pedir madera desde una obra, recibirla por carretera y reanudar una etapa detenida sin doble consumo/pago. Repetir Offline y Online. Después implementar acero local o regional conectado a fabricación/construcción con inventario finito y transporte real. No invertir la próxima entrega en decoración; agregar mecánicas del roadmap. Revisar Economía responsive si se amplía la tarjeta. LAN entre equipos físicos sigue sin validar. Fase18=80%; global no estimable por falta de pesos comunes verificables.

## Continuación después de Alfa 0.91

Fase 18=85%. Implementado el ciclo regional de acero a componentes: compra de acero desde Corralón por ruta, orden industrial, recepción en metalúrgica, producción limitada por fuerza laboral/servicios, stock local y venta a la construcción en Offline/Online. Próxima prioridad: prueba end-to-end de obra detenida cuando faltan componentes → pedido a Metalúrgica local → camión recibido → reanudación sin doble consumo/pago, primero Online y luego Offline; verificar que proveedor/stock/caja y progreso coincidan. Inspeccionar Economía en móvil y escritorio tras agregar tarjeta. Luego completar circuito de habilitación de la fábrica desde licitación/apertura, antes de otra expansión industrial. Global no estimable sin pesos comunes verificables para 34 fases. No declarar probado LAN físico/Vercel.


## Continuación después de Alfa 0.92

GitHub Actions verifica pruebas Online/Offline de escasez de componentes, pedido local, transporte, recepción, reanudación e inspección, con pago y consumo sin duplicación, más ausencia de productor alimentario ficticio en una metalúrgica Offline. La liquidación mensual Offline deja de procesar por segunda vez las fábricas especializadas; fase 18 sigue en 85%.

**Próximo desarrollo:** ejecutar un escenario real de creación de metalúrgica desde zonificación industrial, construcción, inspección, personal, servicios, acero del Corralón, conversión, entrega y consumo en una obra. Dar paridad a la secuencia de tipos de industria entre los motores sin crear inventarios ni caja; después validar escasez y partidas de décadas. LAN física, Vercel y Chromium continúan sin comprobar.


## Continuación después de Alfa 0.93

Se cerró la brecha cantera→hormigonera en Offline: reserva finita, 2 áridos por hormigón, pedidos pagados desde caja empresarial y recepción por ruta antes de producción. Contratos industriales especifican `industryType` desde el inicio, impiden reasignación fortuita de una obra e incorporan caja operativa pagada; Online y Offline usan el mismo orden de especialidades sin duplicar las comprometidas. Pruebas automáticas cubren contratación, materia prima, conversión y disponibilidad para construir, con snapshots responsive en Chromium.

Priorizar mecánica de **fase 17** de empresa industrial que pierde trabajadores o quiebra y posibilidad de reocupación o compra por otro promotor, con oferta/demanda y cuentas reales; también competencia industrial por materias primas locales y expansión condicionada a pedidos. Tras ella ejecutar partidas estables de 30 años de fase 33 con escenarios pequeño, metropolitano, portuario y turístico. LAN física y Vercel pendientes. Fase 18=90%; total global sin estimación por ausencia de pesos.


## Continuación después de Alfa 0.94

La recuperación industrial autónoma ya cubre insolvencia→90 días de espera→demanda y terreno compatibles→financiación privada real ($5.300)→contratista con cinco trabajadores siete días→inspección de servicios/calle→nueva firma, 20 puestos, caja inicial pagada, inventarios sin duplicar y reserva geológica residual. Los dos motores registran origen, causa de bloqueo, contrato e historial. Nuevos tests automatizados comprueban financiación, idempotencia y ausencia de inversión sin demanda; el popup Economía muestra causas y períodos. Fase 17=65%, 18=90%, avance global no estimable.

**Próxima mecánica:** negociación y competencia entre empresas proveedoras de materias primas bajo escasez con precios/contratos pagados; reempleo con efectos demográficos y recuperación con supervivencia económica. Luego estrés de 30 años con escenarios del roadmap. No lanzar iteraciones de pulido visual aislado. LAN física y Vercel siguen pendientes.


## Continuación después de Alfa 0.95

Competencia operativa entre canteras, hormigoneras, aserraderos y metalúrgicas en ambos motores. Cada orden manual de obra compra stock de una fábrica conectada por ruta, clasificada por producto + flete, con caja y existencias únicas y rastro de adjudicación. Las compras industriales automáticas de áridos siguen la misma lógica. Una fábrica con ventas suficientes puede subir su precio gradualmente; inventario ocioso obliga a rebajarlo, con límites de 80%–135% de tarifa. Economía expone cotizaciones rivales y la ventana de compras evita pedir un lote mayor al de cualquier planta.

**Próximo sistema:** introducir contratos a plazo con inventario reservado, entregas físicas por transportistas y competencia también para la obra privada automática; ampliar dinámica de plantillas y demanda de comercios y fábricas sin crear capital ni empleo. Implementar después escenarios de estrés de 30 años de fase 33. Pruebas LAN físicas y Vercel aún pendientes. Fase 17=70%, 18=90%, global sin estimación.


## Continuación después de Alfa 0.96

El material que compran los promotores de vivienda/fábrica y la inversión comercial delegada necesita camión, fecha, flete, capacidad de patio, ruta desde un proveedor con stock y ruta desde el depósito hasta la obra. No se acredita antes de entrega. Las firmas privadas ajustan plantilla y producción según demanda y caja y pagan nuevo equipamiento para crecer; despidos registrados sobre residentes reales. Los dos motores incorporan estas reglas, con pruebas de no-teletransporte, falta de almacenamiento y cierre económico.

**Siguiente sistema jugable:** contratos de suministro entre empresas (reserva de lotes, plazos, incumplimientos, renegociación y pagos sin caja gratuita); competencia minorista con alquiler comercial y cambio de trabajadores; luego simulaciones de 30 años de fase 33. No subir porcentajes de fase 18 sin demostrar acero local/terminales completas. Fase 17=75%, fase 18=90%, global sin ponderación. Chromium automatizado, LAN física y Vercel siguen siendo verificaciones distintas.


## Continuación después de Alfa 0.97

Ya hay contratos B2B de áridos por fábrica concreta, inversión de compra real, mercancía reservada, tres remesas escalonadas, espera de ruta, custodia financiera, liquidación al recibir, vencimiento y devolución sin existencias duplicadas. La política respeta la demanda de la hormigonera y su caja empresarial. Economía informa estado, fondos, cumplimientos e incumplimientos. Online/Offline poseen pruebas automatizadas del flujo y validación visual Chromium.

**Continuar mecánicas:** extender acuerdos de plazo a acero, madera, alimentos y clientes constructores; renegociación por rutas cortadas con penalidades al proveedor; ampliar alquileres comerciales y movilidad laboral, y ejecutar/depurar partidas reales a 30 años de fase 33. Fase 17=80%, 18=90%, global sin estimación. LAN física y Vercel no comprobados.

## Continuación después de Alfa 0.98

Nueva decisión ante corte de carretera: renegociar una vez los contratos cantera/hormigonera para añadir 14 días a remesas pendientes. La compensación sale de la caja compradora e ingresa a la vendedora; no modifica reserva física ni custodia financiera. Economía muestra el control y la traza de pago. Pruebas cubren rechazo sin corte, segundo intento, caja y recepción tras plazo original en Online/Offline.

**Próximo contenido:** contratos similares para otras industrias/constructoras con cuotas y rutas, comercio minorista y alquileres efectivos; después pruebas de 30 años en ciudades pequeña, metropolitana, portuaria y turística. Fase 17=80%, 18=90%, global no estimable. LAN y Vercel pendientes.


## Continuación · penalización por vencimiento

Remesas de áridos no entregadas al vencimiento generan devolución desde custodia y, si comprador y proveedor siguen abiertos, una indemnización adicional desde caja real del proveedor (5% de producto, limitada a fondos disponibles). Nunca se emite dinero nuevo; cada remesa se liquida una vez. Pruebas Online/Offline agregadas. Próximo: extensión B2B a otras materias primas y escenarios multidecada.


## Continuación · quiebra del vendedor B2B

Cuando el proveedor quiebra, las órdenes contractuales pendientes se cancelan inmediatamente y devuelven el escrow al cliente: el material que había sido reservado por una firma ya cerrada consta como pérdida, no vuelve al mercado ficticiamente. Ambas simulaciones implementadas con pruebas de no duplicación. Seguir con contratos para otras materias primas, comercio y escenarios multidecada; interfaz sin cambios.


## Continuación · competencia comercial

Al cierre mensual las tiendas cambian autónomamente precio según demanda efectiva, existencias y margen. Suben con ventas fuertes y poco stock; bajan con sobreinventario o pérdidas. El precio modifica la preferencia de compra de hogares en meses posteriores sin crear caja en el ajuste. Implementación Online/Offline, prueba unitaria Online; confirmar CI y ampliar pruebas de integración. Sin cambios visuales. Después: más contratos B2B, expansiones y escenarios multidecada.


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
