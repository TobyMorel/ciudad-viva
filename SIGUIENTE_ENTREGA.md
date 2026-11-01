# Siguiente entrega · continuidad

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
