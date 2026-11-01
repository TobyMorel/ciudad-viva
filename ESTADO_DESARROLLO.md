# Estado de desarrollo · Ciudad Viva

**Entrega:** Alfa 0.91 · 1 de noviembre de 2026
**Especificación:** [roadmap maestro](ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md), 34 fases (0–33). La base implementada continúa desde las alfas anteriores.

## Medición del progreso global

El porcentaje total del juego queda **sin estimar** por ahora. El repositorio no tiene una matriz estable de pesos y criterios de aceptación verificables que cubra las 34 fases completas del roadmap. Las entregas y funcionalidades listadas abajo describen evidencia funcional, pero no se convierten en un porcentaje por cantidad de versiones, archivos o pruebas. Para calcularlo hay que registrar y mantener una ponderación por alcance de fases y criterios de finalización; hasta entonces no corresponde publicar X%/Y%.

## Implementado

- Alfa 0.72 · Fase 32 (parcial): los reclamos muestran hasta cinco vínculos a sus causas locales: hogares/residentes que buscan trabajo, comercios cerrados, presión de vivienda, redes averiadas, obras de recuperación, calles deterioradas o mora tributaria. El equipo puede registrar un acuerdo compartido con plazo de 180 días. La causa se vuelve a evaluar en los cierres mensuales: si mejora, el acuerdo queda cumplido; si vence, baja el apoyo del distrito y afecta el resultado electoral. El registro se comparte desde el anfitrión LAN y se guarda/carga con la ciudad, esquema 56. Chromium revisado en móvil y escritorio: compromisos y causas legibles, sin overflow horizontal ni solapamiento; API y Offline verificados. No se probó LAN entre equipos físicos.
- Alfa 0.72: la pestaña Cambios incluye debajo del historial la lista de las 34 fases con avance orientativo, barra y pendientes. Método y límites están documentados junto a los datos; el 100% queda reservado a la aceptación completa verificada.

- Alfa 0.71 · Fase 32 (parcial): metas verificables de empleo, plazas libres de vivienda y servicios se fijan por mandato, se revisan al cierre mensual y suman o restan apoyo electoral. Umbrales críticos de empleo, vivienda, servicios o confianza abren reclamos persistentes con barrio, evidencia, antigüedad y resolución automática al corregir la causa; la persistencia reduce apoyo. Si coinciden caja agotada, servicios ≤30% y apoyo ponderado <35%, el segundo cierre emite alerta y el tercero destituye al equipo; recuperar caja o servicios antes evita el desenlace. Online/Offline, esquema 55. Python verificó apertura y resolución de reclamos, metas en el escrutinio, alerta, recuperación y destitución; la API Online inicia una partida con los tres objetivos. Chromium Offline abrió reclamos en un cierre mensual. UI revisada a 390×900 y 1440×900: tres metas, tres distritos y lista de reclamos sin overflow horizontal ni errores JS; popup largo conserva scroll. No se probó la conexión entre equipos físicos. Faltan conectar cada reclamo con expedientes físicos concretos, convertir evidencia en acceso directo a expedientes, ampliar transparencia y distinguir el padrón por edad cívica.

- Alfa 0.70 · Fase 32 (parcial): mandatos de cuatro años y elecciones cada 1.440 días. El sondeo y escrutinio se calculan en Oeste, Centro y Puerto a partir de empleo residente, ocupación/calidad de hogares, servicios y aprobación municipal; el distrito muestra su indicador más rezagado. Participación inicial determinista del 72%. El resultado se guarda, se sincroniza mediante el estado anfitrión LAN y afecta a todo el equipo: victoria renueva el mandato; derrota pausa el juego competitivo y deja disponible la observación/guardado. Online/Offline, esquema 54. Python verificó renovación y derrota tras cambios de gestión; Chromium confirmó derrota persistida y pausa en Offline. UI de Gobierno comprobada a 390×900 y 1440×900: tres distritos visibles, scroll vertical utilizable, sin overflow horizontal ni errores JavaScript. No se probó la conexión entre dos equipos físicos. Faltan metas municipales, reclamos localizados, transparencia y destitución extraordinaria.

- Alfa 0.69 · Fase 30 (parcial): un comercio cerrado puede reconvertirse a vivienda privada tras resolver deuda y patrimonio protegido. El permiso ingresa $200 a tesorería; inversor privado paga $4.200 al contratista, ocupa cuatro trabajadores y completa refuerzo, instalaciones y habilitación en 20–30 días. La casa recibe 24 plazas; migración mensual responde a vacantes, empleo y aprobación. Cada mudanza registra una fecha individual; el alquiler de $24 por residente empieza después de 30 días, consume caja doméstica, acumula mora y puede reducir aprobación. Online/Offline, esquema 53. Verificado ciclo de permiso, inversión, obra y conversión en ambos motores; la simulación Offline también completó migración de hogares. Chromium 390×844 y 1440×900: sin overflow horizontal ni errores JS, panel plegable conserva su estado entre actualizaciones y permite scroll vertical. Quedan fuera hogares desplazados, protección de inquilinos, aumentos de alquiler y reconversión inversa a comercio.

- Alfa 0.68 · Fase 31 (parcial): centrales, plantas de agua y depuradoras reciben inspección preventiva cada 180 días; si el vencimiento ocurre entre cierres, se abre en el siguiente cierre mensual. El expediente informa condición/costo, la revisión cuesta $150 y demora un día. Si la salida sigue en capacidad base, se aprueba sin contrato y reinicia el plazo; si hay desgaste, se licita por el flujo de recuperación existente y la rehabilitación restaura capacidad a 82%. Online/Offline, esquema 52. Online comprobó generación del expediente, inspección aprobada y nueva fecha al día 361; una planta con desgaste conservó licitación. Offline Chromium simuló el cierre día 181, cobro de $150, inspección de un día y cierre aprobado al día 189 con próxima revisión al 369. Interfaz móvil 390×844 y escritorio 1440×900: subpestañas de Mantenimiento/Recuperación activas, acción visible, sin overflow horizontal, scroll vertical ni errores JS. Calendario aún limitado a las tres clases de plantas.

- Alfa 0.67 · Fase 31 (parcial): la condición física de centrales eléctricas, plantas potabilizadoras y depuradoras ajusta proporcionalmente su generación/tratamiento; el 82% es el punto de capacidad base y el deterioro reduce la producción que llega al balance de la red. Mantenimiento muestra condición, porcentaje funcional y salida actual. La rehabilitación existente a 82% recupera capacidad. Online/Offline, guardados esquema 51. Verificado Online/Offline con una central de 900 kW: a 82% se agregan 900 kW a la capacidad, a 41% agrega 450 kW y a 0% no aporta generación; el déficit eléctrico y de agua aumenta cuando la demanda excede la reserva de red. La prueba Offline también verificó las tres plantas: capacidad de salida 82%→100%, 0%→0%, y guardado migrado a esquema 51. Sin errores JS. Mantenimiento revisado en Chromium móvil 390×844: salida visible, scroll vertical y sin overflow horizontal; medido a 390×844 y 1440×900 sin desborde horizontal ni errores JS; el contenido largo usa scroll vertical. Calendario preventivo por criticidad y activos privados siguen pendientes.


- Alfa 0.66 · Fase 31 (parcial): los tramos viales bajo 25% de condición estructural se cierran y bloquean para el enrutamiento de residentes, empleo, colectivos y camiones. Si no hay desvío, los destinos quedan aislados. El mapa 3D muestra barreras; Mantenimiento prioriza el inventario cerrado. Inspección y contrato existentes rehabilitan a 82% y reabren la calle. Online/Offline, esquema 50. Verificación Online: el segmento central crítico hace imposible la ruta oeste-este y al restaurar calidad 82% vuelve a abrirse. Offline en Chromium: la calle cerrada no admite ruta, inspección de un día, adjudicación a Sur Obras, cinco días de trabajo, condición final 82% y ruta restablecida. Sin errores JS. UI de Mantenimiento revisada en 390×844 y 1440×900: sin desborde horizontal ni solapamientos; scroll vertical esperado. El puente queda pendiente porque el mapa aún no representa agua interior ni márgenes conectables.

- Alfa 0.65 · Fase 31 (parcial): los seis tendidos municipales registran condición persistente por tramo. La carga de edificios cercanos acelera desgaste mensual y el pago efectivo de Redes lo mitiga. Al bajar de 25%, un tramo crítico genera avería que desconecta esa sección; la reparación cuesta según severidad y tarda tres días. Ciudad > Servicios informa condición media y tramos críticos por red. Online/Offline, esquema 49. Verificado Online: tramo crítico sale del grafo de conexión y, tras tres avances diarios de cuadrilla, vuelve a servicio y condición 82%. Verificado Offline en Chromium: cierre mensual al 0% de financiación generó avería bajo el umbral, el botón contrató reparación y a los tres días restauró la línea a 82%. Sin errores JS; móvil 390×844 y escritorio 1440×900, contenido del panel sin overflow horizontal ni solapamientos; scroll vertical esperado. LAN física/Vercel no probados.

- Alfa 0.64 · Fase 31 (parcial): el plan preventivo financia también edificios municipales según carga de personal y ocupación. El deterioro bajo 60% genera un diagnóstico con costo estimado persistente; la inspección toma un día y cuesta $150. Luego se licita una constructora, que cobra al iniciar, ocupa cuatro trabajadores cinco días base y devuelve la condición del edificio a 82%. Reusa contratos municipales existentes y funciona Online/Offline, esquema 48. Prueba completa sobre Municipalidad en ambos motores: deterioro, inspección, adjudicación por $900, 4 trabajadores, 5 días y calidad final 82%. Mantenimiento se subdivide en Calles/Edificios; Chromium 390×844 y 1440×900 sin overflow horizontal, solapamientos ni errores JS; vertical scroll esperado. LAN física/Vercel no probados. Fase parcial: redes técnicas, puentes, cierres de seguridad, programación de obras y activos privados pendientes.
- Alfa 0.63 · Fase 31 (parcial): las calles municipales tienen condición individual y desgaste mensual dependiente de densidad de edificios y conectividad. El plan preventivo se ajusta entre 0–200%; su costo entra en Redes y residuos, la mora recorta trabajo real y el cierre aplica desgaste y restauración según financiación. Si 35% de los tramos cae bajo 45% de condición, la cobertura de servicios pierde un punto. Ciudad > Mantenimiento muestra estado, costo y ejecución; Online/Offline, esquema 47. Verificado con costo base $450/mes en la red inicial, cambios de política y cierre mensual: el plan al 100% produjo recuperación neta y la política al 0% produjo desgaste. Panel revisado en móvil y escritorio sin texto solapado ni overflow horizontal. Faltan mantenimiento de edificios/redes, inspecciones, rehabilitación mayor y cierres temporales.
- Alfa 0.62 · Fase 30 (parcial): catálogo de ocho edificios patrimoniales en los barrios Centro y Estación. Guardan época, año, arquetipo, uso original, reformas, conservación, relevancia y ocupación. Protección parcial/integral afecta identidad y deterioro anual sin desplazar residentes. La rehabilitación es una obra real con oferta seleccionable de constructoras, cuatro trabajadores, costo, materiales regionales descontados de stock, demora de entrega y tres etapas de avance. Al inspeccionarse, restaura la conservación y registra la reforma. Online/Offline, esquema 46. Verificación: ciclo completo de protección y obra en ambos motores, gasto $4.937, entrega y 20 días de obra, condición final 100%. Chromium a 390×844 y 1440×900: ocho edificios visibles, sin solapamientos ni desborde horizontal; panel con scroll vertical. Fase parcial: evolución arquitectónica, reconversión de usos y medidas contra desplazamiento aún pendientes. LAN física y Vercel pendientes.

- Alfa 0.61 · Fase 29 (parcial): presupuestos municipales para Servicios, Redes y residuos, y Transporte, con asignación 0–200% en pasos de 10%. El cierre mensual liquida hasta el tope y caja disponible; el impago queda como mora por programa y una asignación mayor puede amortizarla. El subfinanciamiento reduce capacidad de salud/educación, redes/recogida de residuos o frecuencia efectiva de buses. Hacienda presenta costos, pagos, porcentajes y obligaciones en una sección plegable. Online/Offline, esquema 45. Verificado: pago del 50%, mora de $500 sobre costo de $1.000, reducción de servicios, y reserva que completa una cuota después del pago de programas. Chromium móvil 390×844 y escritorio 1440×900: sin errores JS, recorte horizontal ni solapamientos; scroll vertical disponible. LAN física y Vercel pendientes.

- Alfa 0.60 · Fase 29 (parcial): Hacienda permite apartar o retirar $500/$1.000/$2.500 de caja no comprometida a un fondo dedicado al servicio de deuda. Si caja e ingresos cubren gastos operativos pero falta dinero para completar las cuotas, la reserva paga esa diferencia; pagos parciales no se aplican y la mora preexistente se conserva. Muestra caja libre, fondo protegido y patrimonio proyectado. Online/Offline, esquema 44; movimientos limitados a 24 registros. Validación funcional: transacciones neutrales, contrato impide apartar fondos comprometidos y reserva financia cuota faltante sin duplicar efectivo. Chromium móvil y escritorio: reserva y botones visibles, sin overflow horizontal; el panel conserva scroll vertical y no muestra solapamientos. LAN/Vercel físicos pendientes.

- Alfa 0.59 · Fase 29 (parcial): impuestos inmobiliarios (0,20–1,40% anual sobre $2.400/residente) y comerciales (0–5% de ventas) ajustables. Cobro al cierre mensual desde caja disponible de hogares y negocios; impago se acumula por activo y no se acredita como ingreso municipal. El menor efectivo afecta compras familiares y liquidez empresarial. Panel informa tasas, facturación, pago y mora; Online/Offline, esquema 43. Verificado: factura de vivienda $12 y cobro $12; tienda factura $20, paga $5 y acumula $15; no hay doble cobro al repetir cierre. Offline recaudó $17 en ciclo simulado. Chromium móvil/escritorio: scroll vertical, sin overflow horizontal ni errores JS. LAN física/Vercel pendientes.

- Alfa 0.58 · Fase 29 (parcial): créditos de inversión municipal sujetos a solvencia; montos $5.000/$10.000/$20.000, tasa fija 12% anual y amortización de 24/48 meses. Caja recibe capital al contratar y paga cuota mensual; saldo, interés, principal e impagos quedan persistidos. Hacienda informa ingresos/gastos, deuda/servicio y proyección constante a 12/48 meses. Online/Offline, esquema 42. Validación funcional: cuota $132/mes sobre $5.000, primer mes $50 interés + $82 capital, saldo $4.918. Pendiente: LAN física/Vercel, reservas, programas, refinanciación, escenarios y ciclo de vida.

- Alfa 0.56 · Fase 28 (parcial): cuarteles de bomberos por obra pública ($11.200, 74 días, 12 puestos y $950/mes). Bomberos cualificados (perfil ≥48) forman hasta tres dotaciones de cuatro; la Ciudad puede financiar cursos de formación. Cada revisión mensual tiene riesgo determinista según cantidad de inmuebles, calor y sequía, y como máximo un incidente activo. El despacho escoge la estación libre con menor tiempo por rutas reales; registra respuesta, ocupa la dotación dos días y el tiempo calcula el daño. Sin dotación o acceso, el inmueble pierde 2 puntos de condición al día; al quinto día se cierra el incendio con daño persistente y disminuyen servicios y apoyo. Ciudad > Bomberos muestra cobertura, personal, dotaciones, despachos, tiempos e historial; cuartel, llamas y camión de respuesta se ven en 3D. Online/Offline, guardados al esquema 41. Verificación: despacho Online con 35 minutos y daño de siete puntos; cinco días sin equipo reducen apoyo; Offline completó contrato/habilitación y despacho con 12 trabajadores, más guardado. Chromium a 390×844 y 1440×900 sin overflow horizontal ni errores JS, scroll vertical dentro del panel. LAN física y Vercel sin probar; compra/entrega de materiales Offline pendiente. Fase 28 parcial: aún faltan ambulancias, hospitalización, seguridad y protección social.

- Alfa 0.55 · Fase 28 (parcial): sumé escuelas municipales como obras con licitación, cuadrilla, anticipo e inspección (68 días base, $9.600; Online usa materiales, Offline aún no maneja su compra/entrega). La escuela entrega 4 aulas y 12 vacantes docentes; un máximo de 96 plazas físicas depende de docentes cualificados, acceso a calles ≤40 minutos y servicios operativos. La demanda usa residentes simulados de 5–17 años; registra alumnos atendidos, en espera y sin ruta. Costos: $820 de operación y $0,35 mensual por estudiante. Con asistencia sostenida durante 12 meses, suben habilidades laborales; un curso municipal de Educación forma candidatos a docentes. Online/Offline, esquema 40. Verificación: Online: construcción/entrega con materiales y capacidad/espera; Offline: contrato y asistencia; compras/entregas siguen pendientes en modo local; Chromium a 390×844 y 1440×900 sin solapamiento, desbordes horizontales ni errores JavaScript. Continúa parcial: sin educación inicial, niveles diferenciados, expansión de aulas o análisis por grupo etario/distrito.

- Alfa 0.54 · Fase 28 (parcial): cada centro cívico funciona como atención primaria y urgencias básicas si tiene personal con perfil Salud, electricidad, agua, cloacas y rutas de hasta 45 minutos. Doce puestos en el centro inicial y 16 en una nueva obra; cada profesional aporta 2,2 consultas primarias y 0,35 urgencias/día antes de ajustar por servicios. La demanda depende de población, agua/cloacas con rezago de 30 días y urgencias de calor. Los casos sin atender generan lista de espera acumulable; el panel informa cobertura, costos de insumos y barrios afectados. El curso Salud forma seis residentes en dos cierres mensuales por $840. Online/Offline, pantalla Ciudad > Salud, migración de guardados al esquema 39. Pruebas confirmaron 95% de consultas primarias y 100% de urgencias en el mapa inicial; sin personal la capacidad es cero. Chromium a 390×844 y 1440×900: scroll vertical, sin desbordes horizontales ni errores JavaScript. Pendientes: pediatría/edades, camas, ambulancias, diagnósticos, ampliar un centro existente y otros servicios de la fase 28.

- Alfa 0.53 · Fase 27 (parcial): el calendario de 360 días anticipa una ola de calor cinco días antes; la demanda de electricidad sube 22% y la de agua 18% durante cinco días. Sombra/terreno delimitan hogares expuestos y consultas estimadas. Por $650 se preparan refugios en centros cívicos con personal y acceso; con energía operativa protegen a residentes y reducen los casos sanitarios. Una sequía de 30 días reduce 45% la fuente de agua; se aplican restricciones comerciales (35% menos uso no esencial y 12% de penalización al factor de actividad) o cisternas (+30 m³/día, 10 días, $1.200). La cobertura insuficiente en hogares afecta servicios y aprobación. Online/Offline; pantalla Ciudad > Clima; guardados migran al esquema 38. Pruebas: Online y Offline midieron calor, restricciones, escasez, preparación y cisternas; refugios bajaron casos estimados de 45 a 13. Chromium móvil/escritorio revisado sin desborde horizontal ni errores JavaScript. No se probó LAN física.

- Alfa 0.52 · Fase 27 (parcial): los daños de tormenta en calles y edificios municipales abren expedientes de recuperación. La inspección municipal cuesta $150 y requiere un día de juego. Tras el informe, se puede adjudicar la reparación a una de tres constructoras con distinto precio y plazo; el contrato paga al iniciar, asigna cuatro trabajadores y completa por días. La reparación restaura la condición del activo y cierra el expediente. Se integra con presupuesto compartido, capacidad laboral y registro urbano en Online/Offline; guardados migran al esquema 37. No incluye contratación de obras privadas, seguros ni reconstrucción por destrucción total.


- Alfa 0.51 · Fase 27 (parcial): cinco días antes de la tormenta regional de 18 mm se pronostican escorrentía, capacidad de drenaje y exposición geográfica con base en terreno, calles y edificios. El evento anticipado incluye parcelas/activos vulnerables; la alerta se actualiza al resolverse el episodio con el daño previsto y observado. Con riesgo moderado/alto se pueden desplegar bombas móviles y limpiar sumideros por $850; durante ese episodio la capacidad pluvial aumenta 25%, reduciendo agua acumulada y zonas afectadas. Online/Offline comparten las reglas; guardados migran al esquema 36. En el mapa inicial preparado, la prueba bajó agua acumulada de 1.202 a 228 m³ y de 13 a 3 parcelas anegadas. El pronóstico sigue siendo determinista y solo describe la región costera de Puerto Claro.


- Alfa 0.50 · Fase 26 (parcial): los camiones calculan recorridos sobre la red vial, distribuyen contenedores entre camiones municipales y de depósitos, y enlazan paradas con transferencia o disposición final. Se representan rutas y vehículos circulando por ellas. Los contenedores guardan hasta 2 t; los alcanzados se vacían a un ritmo de 0,15 t/día y los aislados acumulan hasta rebalsar hacia la basura sin recolectar. El acceso vial define qué contenedores aportan capacidad diaria. Online y Offline comparten reglas; guardados migran al esquema 35.


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

## Alfa 0.73 · Fase 33 (parcial)

- La población registrada envejece una vez por año: 18 años habilita búsqueda de empleo, 67 años jubila al residente y libera su puesto. Cada cuatro años hay nacimientos condicionados por edad adulta, capacidad de vivienda y $180 de caja del hogar; afectan población, demanda futura .
- Viviendas, comercios y hoteles privados mayores de 20 años pierden condición anualmente. Al caer debajo de 70% aparece una necesidad concreta en el distrito. La constructora elegida debe disponer de cuatro trabajadores y materiales; el capital privado paga materiales y mano de obra, la ciudad cobra permiso. La obra progresa durante 24–36 días y la inspección devuelve condición/calidad a 85%, registra rehabilitación y amplía dos plazas residenciales.
- Ciudad > Evolución presenta grupos de edad, condición, inmuebles antiguos, obras activas, historial decenal y decisiones de rehabilitación. El 3D señala inmuebles deteriorados y usa andamios durante obras.
- Disponible en Online y Offline; sincronizado por estado del anfitrión o guardado local. Esquema 57.
- Avance de fase 33: 20% orientativo según el método estable ya documentado. No es el progreso global. Falta probar la partida de 30 años y completar ciclos económicos, inversión regional finita y escenarios pequeños, metropolitanos, portuarios y turísticos.

### Verificación Alfa 0.73

- Python: compilación y pruebas de transición 17→18 y 66→67, liberación de empleo, desgaste por edad, alta de renovación, descuento de lote/capital, permiso compartido, avance de cuadrilla 36 días, inspección/restauración/calidad/capacidad, nacimiento condicionado y registro de década. Resultado: pasó.
- Online HTTP: con una sala anfitriona local abierta, acción de rehabilitación produjo una sola obra compartida, necesidad en estado «en obra» y permiso de $100. Resultado: pasó.
- Offline en Chromium: el control Ciudad > Evolución ejecutó inicio de contrato, consumió materiales y capital y registró la obra; sin errores JS.
- Interfaz: móvil 390×844 y escritorio 1440×900; panel sin desborde horizontal. En móvil se puede desplazar hasta el botón de rehabilitación; las categorías y tarjetas permanecen legibles. Resultado: pasó.
- Pendiente de esta fase: corrida de aceptación continua de 30 años y las variantes pequeña/metropolitana/portuaria/turística. Multijugador entre dos computadoras físicas y despliegue Vercel no se validaron en este entorno.


## Alfa 0.74 · mercados regionales finitos (fase 33, parcial)

Tres ciudades externas reciben bienes con demanda mensual total de 265 unidades y presupuesto comprador conjunto de $6.450. La oferta disponible para Puerto Claro se calcula según la capacidad competitiva de sus comercios abiertos con personal y acceso por calles a la salida regional (x=23) o a un puerto operativo. Precio, calidad/condición, servicios, plantilla y distancia por ruta afectan la participación. Se reparte el cupo y el presupuesto por cuota ponderada; cada firma queda limitada por ambos. Las unidades exportadas se descuentan del inventario y el ingreso exportador no supera el presupuesto asignado. La falta de insumos o solvencia sigue causando ventas bajas/cierres mediante el sistema empresarial existente. Los mercados se renuevan mensualmente; no generan compradores ilimitados dentro del período.

Ciudad > Puerto presenta volumen potencial, presupuesto, destinos competidores, participación y exportaciones vendidas. Motor autoritativo Online y motor Offline implementan la misma regla; esquema de guardado 58 conserva el informe y el historial mensual. Fase 33: 25% orientativo, con el criterio por fase previamente documentado. No es una estimación global del juego: el roadmap no define pesos comparables entre fases y el total no se promedia.

### Verificación Alfa 0.74

- Verificado: Python compileall, `node --check` para game.js/offline.js y validez JSON de notas.
- Motor Online: una ruta ausente asigna cero compradores; al conectar la salida regional hubo 118 unidades disponibles en prueba de asignación. Un cierre mensual realista vendió 127 de 127 unidades asignadas por su propio estado y registró $1.778 frente a un presupuesto capturado de $3.091; los límites de unidades y dinero pasaron.
- Motor Offline en Chromium: guardado de esquema 57 migró a 58, avanzó del día 29 al cierre mensual con salida conectada y seis comercios; se asignaron y vendieron 116 de 116 unidades, con $1.624 de $2.826 de presupuesto capturado. No hubo errores JavaScript.
- Interfaz Puerto: Chromium a 390×844 y 1440×900 comprobó texto, panel completo desplazable y ausencia de desborde horizontal o de popup. La inspección visual móvil mostró encabezados, navegación, informe y embarques legibles. Se corrigió puntuación redundante en la guía de acceso.
- LAN entre dos equipos físicos, Vercel y aceptación de fase 33 a 30 años quedan pendientes.


## Alfa 0.75 · inversión privada y selección de habitantes (fase 33, parcial)

El mercado regional finito puede generar una propuesta para un comercio cuando quedan al menos 12 ventas mensuales sin cubrir, hay una parcela comercial libre conectada al corredor de salida, la caja privada cubre construcción más reserva operativa, una empresa constructora tiene capacidad y siete trabajadores, y el municipio puede pagar el permiso. La oferta expira en 90 días; rechazar no consume dinero ni terreno y abre un enfriamiento de 90 días. Aceptarla verifica el identificador vigente y crea un proyecto privado real: permiso a la tesorería, capital al circuito de obra, constructor, cuadrilla, materiales/etapas e inspección previa a apertura. Disponible Online y Offline, esquema 60.

Al seleccionar una vivienda, el panel muestra su padrón con edad, estado laboral, empleador, salario y transporte disponible. Peatones y vehículos con ruta simulada son seleccionables en el mapa y muestran actividad, ruta y perfiles de pasajeros cuando existen. Los vehículos ambientales sin perfil siguen siendo decorativos. La navegación de categorías de Ciudad se desplaza horizontalmente con rueda y gesto táctil; al cambiar de categoría la pestaña activa permanece visible.

Avance fase 33: 30% orientativo bajo el criterio fijo por fase. Falta comprobar trayectorias de 30 años, supervivencia empresarial y ciclos entre mandatos, junto con escenarios pequeños, metropolitanos, portuarios y turísticos. El progreso global permanece sin estimar: faltan pesos globales estables basados en criterios de aceptación verificables para todas las fases.

### Verificación Alfa 0.75

- `python -m py_compile server.py`, `node --check` en `offline.js`, `game.js` y `world3d.js`, y análisis JSON del historial: correctos. Guardados Online/Offline actualizan esquema 60.
- Online: API creó una propuesta con ventas regionales sin atender; aceptación exacta inició contrato privado con siete trabajadores, cobró el permiso y registró el costo privado; el segundo intento de aceptar la misma oferta fue rechazado como duplicado.
- Offline: Chromium acelerado cruzó el cierre mensual, generó oferta en parcela conectada (día 31, 35 unidades potenciales pendientes en el informe; una oferta vigente y vencimiento 90 días), y aceptó esa inversión. La obra quedó privada con siete trabajadores; tesorería pasó de $49.704 a $49.272 (permiso $432) y capital privado de $26.000 a $22.832 (costo contractual $3.168). La prueba usó un guardado controlado y no simula 30 años.
- Chromium 390×844 y 1440×900: el panel Ciudad cabe sin overflow horizontal del documento; la tira de categorías supera el ancho disponible, sus etiquetas no se recortan y puede desplazarse. Captura móvil revisada. El contenido de roster y actores está vinculado a perfiles en el código; aún falta una pasada manual de inspección sobre hogares y actores en un mapa renderizado con la escena final.
- No se probó LAN entre dos equipos físicos ni Vercel. Esas comprobaciones siguen pendientes.


## Alfa 0.76 · migración con registro personal coherente

Se corrigió el circuito de migración que antes alteraba ocupación/población sin crear ni retirar residentes en la misma transacción Online. Cada llegada ahora queda en el padrón con ID reproducible, edad y etapa de vida; la fracción de personas elegibles recibe habilidades y preferencias laborales existentes. Al salir, se elimina un perfil concreto, se libera la plaza laboral si estaba ocupada y se ajustan ocupación, población, alquiler individual e ingreso tributario futuro. Las llegadas siguen limitadas por aprobación, vacantes y capacidad laboral agregada. Offline ya agregaba perfiles, pero no asignaba edad; ahora la cohorte y los estados concuerdan con Online. No cambia la estructura del guardado.

Avance fase 21: 60% orientativo por el criterio de cobertura; fase 33 permanece en 30% porque todavía no hay una simulación de 30 años aceptada ni escenarios comparativos. El progreso global sigue sin estimar por falta de ponderaciones globales verificables.

### Verificación Alfa 0.76

- Python valida llegadas de siete personas con padrón igual a ocupación, edades/etapas coherentes, perfiles laborales para elegibles y crecimiento poblacional por siete. La salida de cinco personas mantiene igual la suma de residentes y ocupantes y reduce población por cinco.
- Offline en Chromium cruzó el cierre mensual: siete residentes llegaron con edad, etapa y perfil; población y padrón sumaron 627, ocupación total también 627.
- Se ejecutaron compilación Python y chequeos JavaScript. No se cambió la interfaz; no se requirió revisión visual nueva.
- Trayectoria de 30 años, LAN física y Vercel aún pendientes.


## Alfa 0.77 · delegación municipal opcional

La gestión puede delegar la aprobación de comercios privados hasta un tope elegible ($0, $500, $1.000 o $1.500). Si el permiso queda dentro del límite, la oferta cumple los requisitos de mercado y hay caja, capital privado y cuadrilla disponibles, Online y Offline generan el contrato y registran permiso, anticipo y siete trabajadores. Conservan las etapas e inspección; Offline aún no bloquea su avance por inventario de materiales. Fuera del límite queda como propuesta manual. Sin migración de esquema: la política se agrega al libro de inversiones y se normaliza al usarlo.

Verificación: prueba autoritativa Online creó la propuesta y contrato con $432 de permiso, $3.168 de inversión privada, anticipo de $634 y 7 trabajadores; con tope $0 no creó obra ni movió fondos. Chromium móvil 390×844 y escritorio 1440×844: panel Ciudad > Puerto legible, sin overflow horizontal, solapamientos ni errores JS. La simulación multidecenal completa y LAN física siguen pendientes.


## Alfa 0.78 · contratos visibles entre mandatos

Cada nuevo contrato de construcción registra el mandato y el día en que se adjudicó. Gobierno > Obras y compromisos resume los proyectos activos con etapa, empresa, trabajadores, pagos realizados y saldo pendiente, separado entre fondos municipales y privados; señala cuáles provienen de mandatos anteriores. El acta electoral guarda la cartera al momento del voto, y la renovación del gobierno conserva el proyecto, su etapa y los pagos. No se modificó el esquema 60. La cobertura actual incluye proyectos estándar; no integra todavía todas las rehabilitaciones especiales, deuda y planes de mantenimiento en una sola cartera.

Prueba Online: una obra pública heredada con saldo $6.000 apareció en la cartera electoral; tras la renovación mantuvo el mismo ID y saldo. Offline Chromium avanzó la misma obra un día durante la elección, guardó en el acta el saldo de $5.885 y la dejó activa bajo el mandato siguiente. Chromium 390×844 y 1440×844: tarjeta de compromisos en Gobierno legible, sin overflow horizontal ni errores JS. Simulación de 30 años, LAN física y Vercel siguen pendientes.


## Alfa 0.79 · zonificación y crecimiento privado

- Pintura por arrastre de zonas verdes residenciales, azules comerciales y amarillas industriales. Solo una parcela libre junto a calle terminada es elegible; cambiar el color cambia el permiso. En el guardado nuevo, ninguna parcela vacía viene zonificada por defecto.
- La demanda residencial acumula personas con posibilidad laboral y queda pendiente mientras falte vivienda o empleo. Solo la llegada real reduce el contador. Las viviendas nuevas terminan vacías; promotores privados usan caja municipal para permisos, capital, materiales regionales y cuadrillas para contratar la obra.
- El crecimiento comercial automático exige demanda regional sin atender y zona pintada. Una fábrica privada requiere zona industrial, ofrece 20 puestos y produce mercancías solo con personal y servicios básicos; su inventario se vende por el mercado de insumos a los comercios mediante rutas/costos existentes.
- Offline y Online tienen zonificación, backlog de hogares, promoción residencial, fábrica y compra de stock industrial local. Límite actual: el constructor Offline todavía avanza sin consumir materiales; la promoción comercial automática se comparte, pero su tubería de obra mantiene esa limitación.
- Comprobado: sintaxis Python/JavaScript/JSON; Online inicia obra residencial solo en zona permitida, compra materiales y reserva permiso/capital; sin zona no hay obra. En escenario de fábrica Online, 16 unidades se produjeron y 15 se compraron por comercios desde proveedor local.
- Verificado en Offline: migración con demanda pendiente inicia vivienda zonificada; 25 unidades fabriles producidas con 20 puestos, 18 atendidos, servicios al 100% y compra local de las 25 unidades por comercios. UI comprobada en Chromium a 390×844 y 1440×900, sin overflow horizontal ni errores JS; la ficha de suelo muestra la demanda y permisos. LAN física y Vercel siguen sin probarse.
- Fases actualizadas conforme al criterio orientativo por fase en múltiplos de 5: 1=70%, 4=55%, 5=65%, 16=20%, 17=55%, 18=50%, 20=50%. El juego completo permanece sin estimación global porque el roadmap no define pesos totales.


## Alfa 0.80 · zonificación, demanda persistente y fábricas locales

- Las parcelas vacías empiezan sin permiso. Herramientas verde residencial, azul comercial y amarillo industrial pintan con arrastre y permiten cambiar el uso de parcelas libres conectadas a calles.
- La presión residencial queda guardada como hogares candidatos sin alojamiento. Se genera por aprobación y empleo potencial, se mantiene aunque no haya suelo autorizado y solo baja al entrar personas reales. El promotor residencial inicia como máximo una obra por cierre mensual y verifica permiso, capital, materiales, empresa, cuadrilla, acceso y demanda. Las viviendas inspeccionadas esperan residentes; no añaden población por terminarse.
- Los permisos comerciales permiten inversión automática cuando hay ventas regionales no cubiertas. La parcela industrial habilita una fábrica privada con puestos, costos, salarios, servicios y producción. Su inventario se ofrece a las tiendas por precio y ruta, se descuenta de stock al comprarse y añade ingresos/costos al circuito empresarial. El agotamiento de caja cierra la fábrica y libera empleos.
- La pantalla Ciudad > Suelo separa permisos, demanda residencial, trabajos zonificados y producción local. Se conservan categorías compactas; la navegación sigue siendo desplazable horizontalmente.

### Verificación Alfa 0.80

- `python -m py_compile server.py`, `node --check game.js`, `node --check offline.js` y validación JSON de las notas: correctos.
- Pruebas de mecánica registradas: pintura/recoloración atómica; no se inicia una casa sin zona; promoción residencial Online compra materiales y consume permiso/capital; el backlog solo se reduce con mudanzas; la fábrica local genera stock con personal y servicios y tiendas lo compran como pedido con origen vial. Offline comprobó crecimiento residencial pendiente y producción/venta local.
- Chromium a 390×844 y 1440×900: Ciudad > Suelo sin overflow horizontal de página, controles de categoría desplazables, texto visible y sin errores JavaScript.
- Guardado esquema 60, con migración aditiva de `housingDemand` y `localIndustry`. La construcción general Offline aún no descuenta inventario de materiales. Materias primas industriales, competencia entre fábricas y LAN entre equipos físicos siguen pendientes; Vercel no se probó.
- El progreso global sigue sin estimación: no existe una ponderación verificable de las 34 fases. Se conservan los avances por fase en múltiplos de 5 con el método publicado.

## Alfa 0.81 · crecimiento privado autónomo y cooperación abierta

- Pintar una parcela verde, azul o amarilla concede el permiso de uso. El jugador no necesita iniciar vivienda, comercio ni fábrica: los promotores usan la demanda y el empleo observados para proponer y contratar automáticamente obras privadas por etapas cuando hay acceso, caja municipal para permisos, capital, contratista y recursos.
- Las viviendas requieren demanda persistente ligada a aprobación y empleo potencial; la demanda solo se consume al mudarse personas reales. Los comercios nuevos responden tanto a compras locales que quedan sin atender como a pedidos regionales. Las fábricas aparecen si existen ventas o compras de insumos en comercios activos y parcelas industriales; conservan los requisitos económicos y de contratista.
- La pantalla de parcela ahora explica el crecimiento autónomo y muestra usos residenciales, comerciales e industriales con los colores del sistema. La construcción manual ya no es necesaria para esos tres tipos; servicios públicos e infraestructura siguen siendo decisiones municipales.
- Los referentes municipales del modo cooperativo son optativos y organizativos. Cualquier anfitrión o invitado conserva todas las acciones, herramientas y controles, incluida velocidad/pausa y guardado/carga; el servidor no valida por cartera. Cada jugador puede reasignar referentes activos.
- Límites: Offline ya tenía una simulación de obra simplificada que no descuenta materiales; este hito no afirma paridad material con Online. La sincronización LAN física y la prueba de despliegue Vercel no se realizaron.

### Verificación Alfa 0.81

- `python -m py_compile server.py`, `node --check game.js`, `node --check offline.js` y `git diff --check`: correctos.
- Verificado en el servidor Online: parcela verde inicia vivienda ante demanda acumulada, parcela amarilla inicia fábrica tras actividad de ventas o compras de insumos del comercio, y demanda de hogares no atendida inicia local en zona azul. También se comprobó que el crecimiento automático absorbe propuestas manuales disponibles de guardados anteriores.
- Verificado en Offline por navegador: en un cierre mensual se iniciaron vivienda, fábrica y comercio por demanda local con capital, caja, zona y contratistas disponibles. No se inició vivienda cuando el backlog quedó en cero.
- API LAN de dos participantes simulados: el invitado reasignó una cartera, zonificó, cambió velocidad y pausa, guardó, inició otra ciudad y cargó; las siete acciones respondieron correctamente y el anfitrión autoritativo se conservó. No equivale a prueba física entre dos equipos.
- Chromium 390×844 y 1440×900: menús y mapa sin overflow horizontal ni errores JavaScript; la ficha de parcelas y peatones abrió sin desbordar el viewport. Los mandos de zona se dispusieron en grilla adaptable.
- Fases actualizadas a 5 puntos por el método publicado: 4=60%, 5=70%, 17=60%, 18=55%, 20=55%. No se calcula porcentaje global porque las fases no tienen pesos comunes definidos.


## Alfa 0.82 · grano, procesamiento y venta local

- La procesadora ya no crea alimentos sin materia prima. La cooperativa regional ofrece 320 unidades iniciales de grano, cupo de reposición mensual de 180 y tope de stock de 600. Las empresas encargan según capacidad, pagan precio, flete y demora; la carga se descuenta al salir y viaja desde la entrada vial regional.
- La fábrica transforma hasta el límite del insumo, personal, servicios y almacenamiento terminado. Se registran importaciones recibidas, producción, compras de comercios, costos, ventas y rentabilidad. Los comercios no pueden comprar el grano crudo como si fuera producto minorista. La planta vende alimentos por la misma infraestructura de proveedores y transferencias que ya usa el comercio.
- Offline usa el mismo cupo regional, pedidos con ETA vial, inventario de grano, producción y ventas. Sus trayectos de compras aún usan su motor de días estimados, y la construcción Offline sigue sin consumo de materiales.
- Los pedidos regionales se dibujan como camiones 3D seleccionables. La ficha de la procesadora muestra existencias, último pedido y costo, faltante, producción, stock terminado y compras comerciales.

### Verificación Alfa 0.82

- Online: la procesadora pidió 36 unidades, la cooperativa redujo su stock; la carga llegó al cabo de la ruta y la siguiente producción convirtió 18 unidades de grano.
- Offline en navegador: llegaron pedidos de 54 y 27 unidades por calles conectadas; el siguiente cierre produjo 27 alimentos con 19 trabajadores. También se verificó que los pedidos de grano no se ofrecen a comercios como insumos minoristas.
- Chromium 390×844 y 1440×900: el panel de abastecimiento ajusta sus columnas al ancho del modal; sin desborde horizontal de página ni errores JS. La ruta de grano se ve como camión 3D.
- Fase 18 pasa de 55% a 60% usando el criterio documentado de saltos de cinco puntos. El progreso global sigue sin estimación por falta de ponderación de las 34 fases. LAN física y Vercel no se probaron.


## Alfa 0.83 · demoras contractuales por desempeño (fase 19)

- Cada proyecto activo revisa una vez por ciclo de 30 días el riesgo de plazo. La probabilidad usa la confiabilidad histórica de la empresa y si está ocupada toda su capacidad contratada; un resultado estable derivado de obra, ubicación y ciclo permite reproducir la misma partida tras guardar/cargar.
- Si se detecta demora, no avanza el trabajo ese día, el plazo se amplía 2–5 días y el pago certificado sigue el avance sobre el nuevo plazo. Se guarda el total de días, ciclo revisado y causa. Las tarjetas de contratos muestran la demora cuando existe; los eventos registran la causa y el ajuste.
- Online y Offline aplican la misma fórmula. No cambia el precio adjudicado ni se crean multas ficticias: costos por cambios, reclamos y garantías quedan pendientes para etapas posteriores de fase 19.

### Verificación Alfa 0.83

- `python -m py_compile server.py`, `node --check game.js`, `node --check offline.js`, `node --check world3d.js`, JSON de notas y `git diff --check`: correctos.
- Online: `tick_one_day()` con una obra de riesgo registró +4 días, no avanzó esa jornada y guardó su ciclo; un escenario sin incidencia avanzó con normalidad y tampoco duplicó la revisión. Se probaron las tres constructoras y el rango de 2–5 días. Offline en Chromium: la misma coordenada/ciclo registró +4 días, el plazo pasó de 60 a 64 y el avance se reanudó al día siguiente; un caso sin incidencia mantuvo su calendario. La tarjeta exhibe la causa.
- Chromium 390×844 y 1440×900: texto de demora legible en la tarjeta, sin overflow horizontal de página/tarjeta ni errores JS. LAN física y Vercel no probados.
- Fase 19 sube de 30% a 35%: confiabilidad y capacidad ahora afectan el calendario del proyecto en ambos motores. El total global sigue sin estimarse por falta de ponderaciones verificables para las 34 fases.


## Alfa 0.84 · certificados por hitos físicos (fase 19)

- Se conserva el anticipo del 20%. El saldo restante se paga en partes iguales al completar las etapas físicas definidas por cada proyecto. El avance diario entre etapas no genera pagos. El registro guarda el número y nombre de hito, día, porcentaje físico, monto certificado y acumulado pagado.
- Si falta caja para un certificado municipal, la obra se suspende antes de consumir materiales o avanzar; si termina, su saldo adjudicado completo habrá sido certificado. Las compras privadas permanecen financiadas al contratar y transfieren sus certificados a la constructora al completar cada etapa. En rescates, el anticipo nuevo se distribuye entre las etapas físicas pendientes, sin recertificar la estructura ya construida.
- UI de obras: cada tarjeta muestra hitos certificados y monto pagado/total; usa los datos persistidos en ambos modos. No agrega una nueva pantalla ni toca el mapa.

### Verificación Alfa 0.84

- Online: sin pago en el día intermedio; a 20% físico certifica el primer 16% del contrato; los cinco hitos pagan el saldo completo y la vía se habilita al final. Con tesorería vacía se suspende antes del primer hito y conserva el avance previo.
- Offline en Chromium: el importe `paid` y la caja de constructora se actualizan al completar un hito, y el guardado conserva la historia/cumulado. Tarjeta visible a 390×844 y 1440×900: monto y etapa legibles, sin desborde horizontal ni error JS.
- Comprobaciones Python/JavaScript y `git diff --check`: correctas. LAN física y Vercel no probados. Fase 19 sube de 35% a 40%; global no estimable por falta de ponderación verificable de las 34 fases.


## Alfa 0.85 · retención, garantía e inspección de defectos (fase 19)

- Contratos públicos nuevos pagan 20% de anticipo y hasta 70% por hitos; el 10% final se deposita en `finance.contractEscrow` al completar la recepción provisional. Contratos privados y guardados antiguos siguen sin retención, para no cambiar compromisos ya adjudicados.
- La caja debe cubrir el último certificado y la retención antes de consumir materiales o completar la obra. Sin fondos, se suspende con avance y garantía intactos.
- Tras 30 días, la inspección reproducible libera el pago o detecta una falla según la calidad y confiabilidad histórica de la constructora. El defecto reduce 12 puntos de calidad y bloquea el fondo. Reclamar reparación ocupa tres trabajadores durante cinco días; la inspección posterior restaura la calidad original y paga la retención una sola vez.
- Obras muestra hasta ocho garantías recientes, saldo en custodia, días de inspección/reparación y acción de reclamo.

### Verificación Alfa 0.85

- Online: certificado final 90% del contrato; defecto retuvo el saldo, redujo calidad y una reparación de cinco días restauró calidad y liberó exactamente el fondo. Repetir la revisión no duplicó pagos.
- Offline en Chromium: una obra pública completó su certificado y dejó $100 de $1.000 en escrow; con $700 de tesorería se suspendió en avance 0 sin crear garantía. La acción visible de reclamo cambió el estado a reparación por cinco días.
- UI Obras revisada en 390×844 y 1440×900, sin desbordamiento horizontal; captura móvil confirmó título, saldo, estado y botón legibles. `py_compile`, `node --check` y `git diff --check` correctos. Offline detectó un defecto, bloqueó escrow, ejecutó cinco días de reparación, restauró calidad y liberó el saldo una sola vez. LAN física y Vercel siguen sin probarse.
- Fase 19 sube de 40% a 45% con el criterio estable por fase. Progreso global no estimable: faltan pesos verificables comunes para las 34 fases.


## Alfa 0.86 · órdenes de cambio contractual (fase 19)

- Una incidencia de sitio, calculada de forma reproducible al cruzar el primer hito, puede detener la obra y emitir una propuesta de alcance. La propuesta guarda la causa, el adicional (8–14% del contrato, mínimo $100), plazo (4–8 días) y efecto de rechazarla (−12 puntos de calidad final). Se diferencia la interferencia de una red enterrada no relevada del suelo distinto al estudio inicial.
- Aprobar requiere tesorería libre después de los compromisos públicos, incrementa el precio y rebasea el calendario desde el avance físico actual; no retrocede hitos ni progreso. Rechazar prosigue con el contrato original y aplica la penalidad en calidad y garantía. Las dos decisiones son de un solo uso, generan evento e historial persistente; Online y Offline.
- Pruebas Online por HTTP: aprobación y extensión sin pérdida de avance, caja insuficiente deja solicitud pendiente, rechazo aplica la penalidad, repetir decisión recibe conflicto. Offline en Chromium: aprobación y guardado de precio/plazo/estado. `py_compile`, `node --check`, JSON y `git diff --check` correctos. Revisión visual de la tarjeta en móvil/escritorio sin overflow horizontal; el layout del popup continúa bajo validación final. LAN física y Vercel no probados. Fase 19: 50%. Global no estimable sin ponderación verificable para las 34 fases.

## Alfa 0.87 · extracción local de áridos (fase 18)

- La segunda fábrica privada que se termina puede especializarse como cantera; la primera conserva su rol histórico de procesadora de alimentos. Tiene 20 empleos, capital y costo operativo propios, reserva geológica inicial de 2.400 unidades, límite de patio de 360 y una producción máxima de 48 unidades por ciclo, limitada por dotación y electricidad/agua/saneamiento. Los costos sin ventas pueden cerrar la instalación.
- Cantera local agrega stock de áridos a los proveedores. Las constructoras lo compran con la misma orden de materiales y flujo de descarga; el pedido debita stock, acredita a la empresa y recorre calles desde la cantera a patio o depósito. Corralones e importadores siguen funcionando cuando falta oferta local. Economía enseña reserva y stock.
- Verificado en Online: con servicios completos, 12 trabajadores produjeron 18 unidades; reserva de 31 limitó el siguiente ciclo a 13; contrato compró 10, pagó $289, descontó inventario y registró ruta desde la planta. UI del resumen de cantera y del pedido revisada en 390×844 y 1440×900 sin desborde ni ocultamiento. `py_compile`, `node --check`, JSON y diff correctos. Pedidos Offline, hormigonera/concreto, madera/acero y LAN física siguen pendientes. Fase 18: 65%; progreso global no estimable sin pesos comunes verificables.


## Alfa 0.88 · hormigonera y consumo de hormigón (fase 18)

- La siguiente inversión industrial privada posterior a la cantera puede especializarse como hormigonera; la procesadora de alimentos existente se conserva. La planta contrata personal, paga nómina/costo operativo, requiere los tres servicios urbanos y compra áridos finitos de la cantera activa. La compra descuenta existencias, paga a la cantera y crea un pedido industrial con origen, ruta y tiempo de viaje.
- Al recibir el pedido por carretera, la planta transforma dos áridos en una unidad de hormigón, limitada por mano de obra, servicios y patio (240). Las ventas por el proveedor `Hormigonera local` acreditan a la fábrica; también quedan proveedores regionales como alternativa. El hormigón ya forma parte de recetas de vivienda, calles, edificios públicos, transporte e infraestructura; se migra como 0 en los inventarios existentes y una carencia detiene la obra por el flujo común de materiales.
- Verificado por simulación Online: 20 puestos/servicios completos → 30 áridos; pedido con origen físico y cuatro tramos; recepción → 15 hormigones (2:1), inventario y pago de tres unidades a la firma. `material_plan(home)` exige 7 unidades; `missing_materials` marca el hormigón como bloqueo durante el hito de colada si falta el inventario y lo despeja al reponerlo. Un test HTTP real de `orderMaterials` confirmó venta local desde el origen físico de la hormigonera, ingreso a la firma y rechazo 409 de un lote sin stock sin debitar al contratista. También se comprobó migración del stock faltante en una partida anterior. `py_compile`, `node --check`, JSON y `git diff --check` correctos. Economía inspeccionada en Chromium a 390×844 y 1440×900: caja dentro del viewport, página sin overflow, sin elementos ocultos ni errores JS.
- Alcance actual: solo motor Online/LAN; Offline todavía carece de compras/órdenes de materiales. La falta de hormigón se propaga por las recetas y la lógica común Online de materiales; queda probar explícitamente la detención de un contrato HTTP cuando el material está ausente y un contrato Online end-to-end tras entrega de hormigón. Madera/acero locales y LAN física siguen pendientes. Fase 18: 70% (criterio por incrementos verificables de cinco puntos); avance global no estimable porque siguen faltando pesos comunes verificables para las 34 fases.

- Alfa 0.90 · Fase 18 (parcial): se incorpora la tercera cadena productiva local, madera → aserradero → obras. El bosque tiene reserva finita y regeneración mensual; la planta consume dos troncos por unidad, necesita puestos cubiertos y servicios de electricidad, agua y saneamiento, paga nómina/operación y puede cerrar por insolvencia. Los pedidos de obra descuentan madera física del stock y acreditan ingresos al aserradero. Online/Offline: verificada la producción y venta a contratistas, con reserva, inventario, caja y salarios consistentes; Chromium confirmó compra local desde el origen vial del aserradero. Economía revisada a 390×844 y 1440×900, sin overflow horizontal ni errores JS. `py_compile`, `node --check` y `git diff --check` correctos. Pendiente: pruebas de cierre y reactivación por insolvencia/servicios, cadena de acero y almacenes/comercio físico ampliado. No se probó LAN entre equipos físicos.

- Alfa 0.91 · Fase 18 (parcial): la cuarta cadena industrial transforma acero regional en componentes locales de construcción. La metalúrgica compra acero del Corralón por carretera, lo recibe como insumo en ruta, y lo convierte 1:1 en componentes; capacidad de hasta 24/ciclo según plantilla y servicios, con límite de almacén, nómina, gasto operativo e insolvencia. Los componentes se venden desde stock físico a las obras y el cobro acredita la caja de la empresa. Online y Offline, esquema de ciudad existente migrado con proveedor/inventario añadido. Prueba del motor Online: 20 puestos, 100% de servicios y 30 aceros en planta produjeron 24 componentes; se ordenaron 18 aceros con ruta de un tramo, y la venta de 8 abonó $2.208 y dejó 16 componentes. `py_compile`, `node --check` y diff check pasan. Pendiente prueba visual Economía a 390×844/1440×900 y obra completa detenida/reanudada por componentes en ambos motores; LAN física sin probar. Fase 18: 85%; progreso global no estimable por falta de ponderación común verificable.


## Alfa 0.92 · paridad de especializaciones industriales

Offline excluye las fábricas especializadas del proceso alimentario mensual, evitando proveedor fantasma y segunda liquidación de gastos. Se publicaron pruebas automatizadas Online/Offline de bloqueo por componentes y reanudación tras entrega, con inventario, caja y finalización de obra controlados. El workflow de sintaxis, JSON y dos suites concluyó correctamente en GitHub Actions (run 41260659327). Fase 18=85%, global sin estimación verificable. No se ejecutaron pruebas visuales, LAN física ni Vercel.


## Alfa 0.93 · simetría industrial y nuevas cadenas funcionales

La cantera y hormigonera locales ahora funcionan también Offline con inventario físico, personal, servicio, caja privada, reserva geológica, entrega por camión y transformación 2:1. El inventario del corralón no se infla al comprar a las plantas; las compras locales restan stock privado e ingresan efectivo a la empresa productora. El tipo de planta se asigna a la adjudicación del contrato y se respeta en inspección/apertura tanto si la obra es manual como si es promovida automáticamente. Nuevo capital operativo de $4.200 se descuenta de los promotores Offline antes de iniciar la obra. Guardados anteriores admiten fallback si el proyecto no tenía `industryType`.

Tests GitHub Actions: sintaxis, JSON, reservas, producción, pedidos y transformación Online/Offline; se agregó prueba de interfaz de Economía a 390×844 y 1440×900 con captura automática. No se probaron LAN física ni publicación en Vercel. Fase 18=90%; progreso global sin estimación.


## Alfa 0.94 · instalaciones industriales reutilizables tras insolvencia

Se implementó en `server.py` y `offline.js` la reapertura privada de fábricas cerradas con identidad de nuevo operador, demanda causal, suelo compatible, inversión y permiso ($4.200 operación + $900 rehabilitación + $200 permiso), cinco operarios por siete días, acceso y servicios verificables en inspección. Los proveedores pierden inventarios de empresas quebradas, la nueva empresa no recibe existencias gratis y una cantera conserva el remanente geológico. Se preservan cronología y capital origen; los proyectos que están rehabilitando ocupan capacidad de contratistas. Se añadió Economía/ficha con estado, motivo de suspensión y costos. Tests Online y Offline agregados a GitHub Actions. Fase 17 65%, fase 18 90%, global sin ponderación verificable. LAN física y Vercel no examinados.


## Alfa 0.95 · licitación industrial competitiva

Online y Offline cotizan cada planta industrial con su propio inventario, factor de precio (0.8–1.35 de tarifa base) y distancia vial. Cada pedido manual de construcción compra el lote completo a una sola planta conectada al menor costo total, guarda el origen físico y debita al ganador. La firma recibe el valor del producto, mientras el transportista acredita el flete; no se duplican ingresos. La hormigonera también licita compras automáticas de áridos entre canteras, con restricciones de caja y stock. Precios responden a ventas acumuladas y stock ocioso. Economía y el modal de materiales muestran cotizaciones reales, límites de lotes y rutas. Se amplían tests de ambos motores y revisión con Chromium móvil/escritorio. Fase 17=70%, 18=90%; global no estimado.


## Alfa 0.96 · mercado privado material y empleo variable

El desarrollo automático en suelo zonificado y los comercios privados delegados contratan suministros por mercado real con inventarios, rutas, precio, caja y almacenamiento. La adjudicación produce pedidos de `supply.orders` y no inserta materiales directos al patio; la descarga habilita el avance. El costo se descuenta del capital del inversor, sin deuda municipal ni emisión artificial. Los proveedores locales y transportistas cobran solo su parte. El nuevo mercado laboral privado expande una vacante al pagar equipamiento y tener demanda solvente, o reduce hasta dos tras dos meses de ventas débiles. Residentes despedidos buscan otro empleo y la capacidad de metalurgia puede aumentar cuando se ocupan nuevas plazas. Se agregaron pruebas de regresión Online/Offline y sigue disponible la validación de interfaz a 390×844 y 1440×900. Fase 17=75%, fase 18=90%, global sin estimación. LAN física y Vercel pendientes.


## Alfa 0.97 · contratos de suministro industrial con fondos retenidos

Implementados en ambos motores acuerdos cantera/hormigonera que inmovilizan stock, descuentan caja privada, reparten entregas semanales y acreditan productor/transporte solo al llegar. En corte vial los camiones esperan; al vencer sin entrega se cancelan las remesas restantes, se restituyen pagos y material al productor activo. La contabilidad `supply.tradeContracts` guarda remesas, escrow, ingresos, devolución, pérdidas por quiebra y estado final. Economía muestra esta información. Tests de integración nuevos y regresiones de industria actualizadas. Alcance limitado a áridos; falta cobertura contractual para otros sectores, penalizaciones y renegociación explícita. Fase 17 80%, fase 18 90%, sin avance global calculable.

## Alfa 0.98 · renegociación de vencimientos industriales

Online y Offline admiten `renegotiateTradeContract` para acuerdos activos, una vez, cuando hay remesas pendientes con plazo vigente y corte vial comprobado, ambas firmas abiertas y dinero de compensación. La extensión de 14 días exige pago directo del 5% del contrato (mínimo $20) entre empresas, sin modificar lotes reservados ni fondos en custodia. Se persisten causa, fecha, días y compensación; el panel Economía permite decidir. Tests Online/Offline y verificación responsive integrados al CI. La cobertura de fase 17 sigue en 80% y 18 en 90%; el global carece de ponderación. LAN física/Vercel sin probar.

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
