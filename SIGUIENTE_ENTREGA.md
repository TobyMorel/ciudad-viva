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
