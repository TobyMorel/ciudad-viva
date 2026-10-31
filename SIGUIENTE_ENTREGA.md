# Siguiente entrega · continuidad

Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md` (34 fases). Priorizar sistemas jugables con causas, costos y consecuencias; evitar dedicar entregas a detalles mientras quedan mecánicas vacías.

## Estado al cerrar Alfa 0.78

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

Fase 33: el mercado finito ahora puede proponer una inversión privada de comercio solo con ventas no cubiertas, parcela conectada, caja privada y municipal y una cuadrilla disponible. Aprobar usa las etapas de obra existentes; una oferta rechazada no cuesta dinero. Hogares, peatones y vehículos con datos simulados tienen panel de inspección, y el submenú de Ciudad es desplazable horizontalmente. Modo Online/Offline, guardados esquema 59. El panel de fases señala fase 33 al 30%; el juego completo sigue sin estimación global por falta de ponderación estable.

## Próxima entrega concreta

Probar una ciudad reproducible durante 30 años en modo online y offline; medir solvencia, capital privado, demanda, aperturas/cierres, materiales, empleo, envejecimiento, migración y resultados electorales. Corregir los desequilibrios que aparezcan. Luego cumplir escenarios pequeño, metropolitano, portuario y turístico. Comprobar interfaz móvil/escritorio y estado del scroll de Ciudad. `CONTINUIDAD_IA.md` contiene arquitectura y parámetros para retomar este punto.


## Sistema agregado en Alfa 0.76

Migración residencial ahora sincroniza ocupación con residentes identificables en los dos motores. Las llegadas crean cohortes etarias y perfiles laborales; las salidas liberan personas y puestos. Avance de fase 21: 60%; fase 33 se conserva en 30% hasta verificar los escenarios largos.

## Próxima entrega concreta

Ejecutar una simulación reproducible de 30 años Online y Offline y registrar diez años por vez: población por edad, mudanzas, empleo, caja familiar, empresas, vivienda, rehabilitaciones, mantenimiento, transporte, elecciones, deuda y recursos. Comparar varias estrategias de ciudad y corregir desequilibrios demostrados por las corridas; luego validar los escenarios pequeños, metropolitanos, portuarios y turísticos.


## Sistema agregado en Alfa 0.77

La política opcional de delegación puede contratar automáticamente una propuesta comercial cuyo permiso esté dentro del tope. La condición económica y operativa reusa demanda, terreno, capital, caja, contrato y cuadrilla; fuera del límite queda revisión manual. Cliente Online/Offline, guardado esquema 59. Fase 33: 35% orientativo. Pendiente inmediato: verificar contratación y rechazo por límite en Offline; luego ejecutar perfiles de 30 años pequeño/metropolitano/portuario/turístico y completar trayectorias/recuperación según fase 33.


## Sistema agregado en Alfa 0.78

Los proyectos estándar llevan origen de mandato y se muestran como obligaciones activas/heredadas en Gobierno; el resultado electoral guarda la cartera y las victorias mantienen el contrato y su saldo. Pruebas de elección y obra en ambas simulaciones. Fase 33: 40%. Próximo: simular 30 años en ambos motores; ampliar la verificación de continuidad a deuda, rehabilitación y mantenimiento, y probar perfiles urbanos pequeños, metropolitanos, portuarios y turísticos.
