# CIUDAD VIVA — ROADMAP MAESTRO DE JUGABILIDAD Y REALISMO PROFUNDO

**Versión:** 2.0 — Realismo profundo (ampliación integral)  
**Propósito:** hoja de ruta de jugabilidad para otra IA, con 34 fases (0–33), reglas, dependencias, situaciones de prueba y condiciones de entrega. Objetivo principal: realismo de gestión y construcción urbana; la política es una consecuencia de los resultados, no el género.  
**Género:** simulador urbano de alto realismo: constructoras, suelo, economía privada, logística, servicios, transporte, patrimonio y mantenimiento; cooperativo con consecuencias electorales.  
**Referencias de experiencia:** libertad urbanística, escala y lectura visual de un gran *city builder* 3D; profundidad en permisos, constructoras, obras por etapas, servicios y gestión municipal. **No copiar activos, interfaz ni contenido de otras obras.**

> **Límite de este documento:** SOLO jugabilidad. No incluye lenguajes, frameworks, servidores, conectividad, estructura de archivos, despliegue, motores gráficos ni instrucciones de programación. La IA desarrolladora debe transformar cada fase en funciones jugables verificables, sin reemplazar las mecánicas definidas por soluciones automáticas o decorativas.


**Lectura recomendada para otra IA:** empezar por las reglas innegociables y las fases 0–15; continuar con las fases 16–33 en el orden de dependencias del capítulo 4; usar los escenarios A–J y la lista de aceptación final como pruebas. No reemplazar fases existentes por menús o simulaciones de apariencia.

---

## 1. VISIÓN Y REGLAS INNEGOCIABLES

El jugador dirige la **ciudad como alcalde/intendente** y, cuando juega con amigos, sus compañeros integran **el mismo equipo de gobierno municipal**. El desafío principal consiste en construir una ciudad funcional, atractiva y económicamente sostenible. Cada decisión urbanística consume tiempo, dinero, capacidad de obra y recursos reales del mundo del juego.

**Reglas que no deben perderse durante el desarrollo:**

1. **La ciudad no se construye con apariciones instantáneas.** Todo proyecto nuevo atraviesa planificación, aprobación, contratación, preparación de terreno, obra, inspección y habilitación. Incluso los edificios privados requieren tiempo y recursos.
2. **Construir no es lo mismo que operar.** Un hospital terminado necesita personal, presupuesto, agua, energía y acceso vial para prestar servicio. Una vivienda terminada necesita condiciones para ser habitada.
3. **El crecimiento tiene causas.** Viviendas, comercios e industrias privados aparecen solo cuando existen demanda, suelo permitido, inversión y condiciones mínimas; no porque el jugador los coloque gratuitamente.
4. **Las obras son decisiones.** Hay múltiples constructoras, cada una con precios, plazos, calidad, capacidad disponible y riesgos distintos.
5. **La economía tiene entradas y salidas explicables.** Recaudar impuestos, pedir préstamos, contratar obras y mantener servicios genera efectos visibles y diferidos.
6. **Los habitantes tienen necesidades y expectativas.** Sus decisiones de mudarse, trabajar, desplazarse, protestar o votar responden a la evolución de la ciudad.
7. **La política es una capa de evaluación, no el género principal.** Hay apoyo ciudadano, promesas de gestión, elecciones y eventual destitución; no se exige simular campañas ideológicas complejas.
8. **La derrota es compartida.** En cooperativo todos gobiernan el mismo municipio. Si el partido del equipo pierde la elección o el gobierno es destituido, esa partida competitiva termina para todos.
9. **Sin límites artificiales de expansión o funciones por pago.** La dificultad para crecer se basa en presupuesto, urbanismo, demanda, capacidad operativa y consecuencias, no en bloqueos de contenido.
10. **La información esencial es comprensible.** Toda caída de población, déficit, retraso o pérdida de apoyo debe mostrar causas y posibles respuestas, sin ocultar penalizaciones arbitrarias.
11. **Realismo profundo por defecto.** Las inversiones requieren financiación, propiedad del suelo, proyectos, permisos, suministros, trabajadores y tiempo. Lo construido tiene operación, mantenimiento y vida útil.
12. **Las empresas privadas son agentes económicos.** Pueden competir, invertir, expandirse, contratar personal, quebrar y dejar obras abandonadas. No son simples edificios que imprimen dinero.
13. **Puertos y aeropuertos son sistemas completos.** Requieren lugar viable, varias obras, demanda, operadores, acceso terrestre, capacidad limitada y costos permanentes.
14. **El turismo tiene visitantes y alojamientos reales.** Hoteles privados, temporadas, eventos, empleo y consecuencias sobre alquileres y servicios; los turistas no son residentes permanentes.
15. **La ciudad conserva historia.** Los barrios evolucionan con estilos arquitectónicos, demoliciones, reconversiones, patrimonio, envejecimiento y renovación a lo largo de décadas.
16. **Los bienes y el dinero se conservan.** Ningún recurso, empleo, viaje, vivienda, mercancía o habitante surge sin un origen explicable.
17. **Profundidad sin clics inútiles.** Los procesos de cada empresa y cada red tienen consecuencias, pero los trabajos rutinarios pueden delegarse con presupuesto y estándares de calidad.
18. **No obligar una infraestructura imposible.** Un puerto necesita costa navegable; un aeropuerto demanda suelo y rutas viables. Los proyectos grandes no se habilitan por nivel ni tienen una demanda garantizada.

### 1.1. Fantasía jugable

**«Somos un equipo de gobierno. Planificamos y contratamos obras, vemos cómo la ciudad se levanta de verdad, gestionamos lo construido y tratamos de seguir en el cargo gracias a los resultados».**

### 1.2. Lo que el juego NO debe ser

- Un editor de maquetas en el que hacer clic significa que el edificio está listo.
- Un juego de elecciones con una ciudad de fondo.
- Un constructor donde todos los ciudadanos estén felices por defecto.
- Una simulación en la que el dinero sea la única restricción: también importan tiempo, acceso, trabajadores, materiales y mantenimiento.
- Un juego con castigos inesperados sin advertencias previas.

### 1.3. Alcance del «realismo profundo»

**Realista no significa que un año de juego dure un año real:** el calendario es acelerado, pero la lógica de costos, construcción, recursos, plazos relativos, comportamiento económico y externalidades debe conservar consistencia. El jugador puede planificar a escala municipal y, cuando quiera, intervenir en contratos, turnos, logística o proyectos específicos. La simulación no necesita animar una persona por cada habitante si mantiene balances y decisiones territoriales coherentes.

**Cinco ampliaciones obligatorias de la versión 2.0:** (1) puerto operativo, (2) aeropuerto operativo, (3) turismo y hoteles privados, (4) desarrolladores y empresas en competencia con quiebras/obras abandonadas, y (5) barrios históricos con transformación arquitectónica y social. Además se incluyen empleo, redes técnicas, riesgos, suelo, contratos avanzados, hacienda y mantenimiento.

---

## 2. BUCLES CENTRALES DEL JUEGO

### 2.1. Bucle corto: 1–5 minutos de juego real

**Observar un problema → consultar sus causas → diseñar una solución → comparar opciones → dar una orden → comprobar las primeras consecuencias.**

Ejemplo: un barrio no tiene agua → revisar cobertura y capacidad → proyectar cañería → comparar coste y duración → adjudicar obra → ver llegar equipo de trabajo → seguir el avance.

### 2.2. Bucle medio: 5–30 minutos

**Planificar un barrio → financiar infraestructuras → abrir obras → resolver demoras → habilitar servicios → observar mudanzas, empleo, tránsito y recaudación.**

Ejemplo: crear un barrio residencial puede exigir acceso vial, agua, energía, desagües y zonificación antes de que las viviendas privadas comiencen a edificarse.

### 2.3. Bucle largo: una gestión municipal

**Definir prioridades → ejecutar un programa de obras → mantener cuentas y servicios → responder a crisis → evaluar apoyo ciudadano → ganar o perder la elección.**

El ciclo electoral tiene **4 años dentro del juego**. La partida puede guardarse y reanudarse entre sesiones; los jugadores no están obligados a completar un mandato de una sola vez.

---

## 3. PRINCIPIOS DE TIEMPO, DIFICULTAD Y ESCALA

Estas son **cifras provisionales de balance**, no restricciones definitivas. Deben estar centralizadas como parámetros de diseño para ajustar la experiencia tras probarla.

| Parámetro | Propuesta inicial | Objetivo jugable |
|---|---|---|
| Ritmo normal | 1 año de juego = 30 minutos reales | Elección cada ~2 horas a velocidad normal |
| Velocidades | Pausa / x1 / x2 / x4 | Permitir planificar y acelerar esperas |
| Mandato | 4 años de juego | Arco estratégico claro |
| Construcción de casa pequeña | 4–12 semanas de juego | Nunca instantánea |
| Comercio pequeño | 6–16 semanas | Tiempo proporcional a complejidad |
| Escuela pequeña | 3–8 meses | Obra y puesta en servicio relevantes |
| Hospital u obra de infraestructura grande | 6–24 meses | Proyecto estratégico de varios hitos |
| Frecuencia del presupuesto | Balance mensual, detalle anual | Facilitar lectura de flujos |
| Revisión política | Mensual; elección cada 4 años | Evitar sorpresas electorales |
| Guardado | Disponible durante el juego, fuera de situaciones excepcionales definidas | Soportar sesiones cooperativas discontinuas |

**Modo de referencia:** «Realismo profundo». La simulación aplica reglas completas de finanzas, operaciones, propiedad, proveedores, población, desgaste y costos de ciclo de vida. Si se ofrecen perfiles Relajado/Normal/Exigente, **solo ajustan el margen de error y la dificultad económica**, nunca eliminan las relaciones causales. El calendario acelerado de la tabla es provisional y debe calibrarse sin confundir velocidad temporal con profundidad de simulación.

**Regla de diseño:** todas las unidades de duración se expresan en tiempo del juego. Los jugadores ven además una previsión legible de su equivalente aproximado a la velocidad actual.

---

# ROADMAP DE DESARROLLO DE JUGABILIDAD

Cada fase incluye: **objetivo**, **sistemas que deben existir**, **reglas jugables**, **tareas para la IA** y **criterios de aceptación**. No comenzar una fase nueva si el núcleo de la anterior no funciona en una partida de prueba.

## FASE 0 — CONSTRUIR EL «ESQUELETO» JUGABLE

**Prioridad:** crítica.  
**Objetivo:** que la ciudad tenga tiempo, reglas, recursos, estados y consecuencias observables antes de multiplicar edificios y decoraciones.

### Sistemas y reglas

- Una **partida** tiene nombre, fecha de inicio, fecha actual, dificultad, tesorería, población, estado del mandato, estadísticas y objetivos.
- El mundo distingue **terreno**, **parcela**, **tramo vial**, **infraestructura**, **edificio**, **obra activa**, **servicio público**, **empresa**, **barrio** y **habitante/hogar simulado**. No confundir edificios con obras.
- Cada elemento jugable posee un **estado** claro: propuesto, aprobado, contratado, en construcción, suspendido, finalizado, habilitado, operativo, deteriorado, cerrado o demolido según corresponda.
- El tiempo puede avanzar, pausarse y acelerarse; no pueden completarse varias etapas de una obra sin transcurrir el tiempo requerido.
- Deben existir indicadores de tesorería, ingresos, gastos, población, empleo, cobertura de servicios, satisfacción y apoyo del gobierno, aunque inicialmente usen reglas sencillas.
- Se inicia con una localidad pequeña que tiene una base económica mínima: calles, algunos hogares, una conexión exterior y fondos suficientes para tomar decisiones. No empezar con una ciudad completamente vacía e inmóvil.

### Tareas para la IA

- [ ] Definir recursos, estados y reglas que interactúan entre sí.
- [ ] Establecer calendario, velocidades y eventos mensuales.
- [ ] Crear un municipio inicial consistente para pruebas.
- [ ] Hacer que cada cambio significativo aparezca en un registro de acontecimientos.
- [ ] Mostrar la causa principal detrás de cada indicador que sube o baja.

### Criterios de aceptación

- [ ] Una partida puede transcurrir un año de juego sin cifras negativas imposibles o estados contradictorios.
- [ ] Pausar detiene avance de obras, consumos periódicos y calendario electoral.
- [ ] No se puede gastar dos veces el mismo dinero reservado para una obra.
- [ ] El jugador puede explicar por qué cambió al menos un indicador de la ciudad.

---

## FASE 1 — TERRENO, PARCELAS, CALLES Y URBANIZACIÓN

**Prioridad:** crítica.  
**Objetivo:** permitir diseñar un municipio con una lógica territorial creíble.

### Sistemas y reglas

1. **Terreno con variaciones:** llanura, pendientes, ríos, costa o accidentes simples. Un proyecto debe respetar accesibilidad y, cuando corresponda, nivelación.
2. **Parcelas edificables:** una parcela tiene superficie, frente a calle, zonificación, valor del suelo, accesibilidad e instalaciones disponibles.
3. **Trazado vial:** calles locales, avenidas y caminos de conexión. Construir una nueva calle exige un proyecto y una obra; no aparece terminada al dibujarla.
4. **Intersecciones y accesos:** edificios que requieren transporte por carretera deben tener conexión utilizable.
5. **Barrio y distrito:** la ciudad puede organizarse en zonas con nombres, población, calidad de vida y necesidades distintas.
6. **Expansión orgánica:** habilitar nuevas áreas de desarrollo consume recursos y trae costos de infraestructura. Evitar límites fijos por pagos o niveles arbitrarios.
7. **Derribos y modificaciones:** demoler tiene coste, demora, ruido, residuos y posibles compensaciones o malestar vecinal.
8. **Herramientas de planificación:** previsualizar trazas, pendientes, costo aproximado, conflictos y efecto esperado antes de aprobar.

### Tareas para la IA

- [ ] Permitir seleccionar terrenos, delimitar zonas y proponer calles.
- [ ] Distinguir «proyecto dibujado» de «calle terminada».
- [ ] Mostrar terrenos sin acceso y parcelas no aptas.
- [ ] Calcular un costo básico del proyecto según longitud, relieve y tipo de vía.
- [ ] Introducir valor y atractivo inicial del suelo.

### Criterios de aceptación

- [ ] Una casa no puede ser habilitada si la parcela carece de acceso exigido.
- [ ] Una calle nueva empieza como obra y se vuelve transitable al terminarse.
- [ ] Una parcela mal ubicada genera advertencias, no un edificio que funciona por arte de magia.
- [ ] El jugador puede expandir un barrio sin destruir la estructura de la ciudad existente.

---

## FASE 2 — CONSTRUCTORAS, CONTRATACIONES Y OBRAS POR ETAPAS

**Prioridad:** máxima: es la mecánica distintiva del proyecto.  
**Objetivo:** que construir sea un proceso visible, planificable y con riesgos.

### Ciclo obligatorio de toda obra

1. **Anteproyecto:** elegir qué se quiere construir y dónde; mostrar función, capacidad, coste estimado, plazo y requerimientos.
2. **Permisos y factibilidad:** comprobar zonificación, accesos, suministro previsto, presupuesto y compatibilidad urbana.
3. **Licitación o elección de empresa:** recibir opciones con precio, plazo, calidad, disponibilidad y reputación.
4. **Adjudicación:** firmar contrato; reservar anticipo o presupuesto acordado.
5. **Movilización:** la constructora prepara equipos y obreros; la obra no progresa sin capacidad asignada.
6. **Preparación del terreno:** limpieza, excavación, nivelación y cimentación.
7. **Estructura:** se levanta progresivamente el volumen físico del edificio o la infraestructura.
8. **Instalaciones y terminaciones:** conexión de servicios, interiores, equipamiento y accesos.
9. **Inspección:** detectar posibles defectos o incumplimientos, con obligación de corregirlos.
10. **Recepción y habilitación:** la obra pasa a ser un edificio utilizable; recién entonces puede prestar su función.

### Variables de una constructora

| Variable | Efecto sobre la decisión |
|---|---|
| Precio | Costo inicial y pagos por avance |
| Plazo prometido | Fecha prevista de entrega |
| Calidad | Durabilidad, riesgo de fallas y mantenimiento futuro |
| Capacidad de trabajo | Cantidad y magnitud de obras simultáneas |
| Especialidad | Ventaja en vivienda, carreteras, puentes o edificios públicos |
| Reputación | Historial de entregas, retrasos y defectos |
| Recursos disponibles | Riesgo de interrupción o de necesitar subcontratar |
| Cláusulas de contrato | Multas, ampliaciones de plazo, garantías y pagos |

**Perfiles iniciales de ejemplo:**

- **Económica:** precio bajo, calidad moderada, plazos más inciertos, buena para obras simples.
- **Equilibrada:** precio/plazo/calidad medios, cumplimiento estable.
- **Especializada:** cara, alta calidad y mejor rendimiento en proyectos complejos.

Ninguna empresa debe ser siempre óptima. La contratación varía según disponibilidad, urgencia, tipo de obra y situación del presupuesto. **No confundir «rápida» con «instantánea».**

### Eventos posibles de obra

- Lluvias o terreno difícil: retraso razonado.
- Escasez de materiales: progreso suspendido parcial o totalmente.
- Error de estimación: solicitud de ampliación de contrato.
- Empresa sobrecargada: menor productividad hasta liberar equipos.
- Inspección fallida: corregir defectos antes de habilitar.
- Entrega anticipada: premio reputacional acotado, si el contrato lo prevé.
- Accidente laboral o incumplimiento: costo adicional, investigación y posible caída de apoyo.

### Decisiones del jugador

- Elegir la empresa, comparar ofertas y adjudicar.
- Financiar de golpe o por hitos cuando el contrato lo permita.
- Pausar, cancelar, acelerar mediante recursos adicionales o renegociar.
- Cambiar de constructora, asumiendo penalidades y tiempos de transición.
- Inspeccionar y rechazar una obra defectuosa.
- Ordenar la demolición de una estructura abandonada o insegura.

### Tareas para la IA

- [ ] Definir los diez estados del ciclo constructivo y sus transiciones válidas.
- [ ] Presentar al menos tres ofertas comparables por obra cuando haya empresas disponibles.
- [ ] Crear una lista de obras municipales con coste pactado, gasto ejecutado, etapa actual, avance físico, causa de demora y fecha estimada.
- [ ] Prohibir que un edificio cumpla su función antes de habilitarse.
- [ ] Hacer visibles movimientos de obra: terreno cercado, excavación, cimientos, estructura, terminaciones y retiro de equipos.
- [ ] Agregar penalidades y alternativas cuando un contrato fracasa.

### Criterios de aceptación

- [ ] Construir una escuela lleva tiempo, requiere empresa y finaliza con habilitación.
- [ ] Dos constructoras producen resultados distintos bajo condiciones comparables.
- [ ] Una obra puede detenerse, reanudarse, exceder el plazo y terminar sin quedar corrupta.
- [ ] El presupuesto muestra cuánto ya se pagó, cuánto está comprometido y cuánto falta.
- [ ] Si se cancela una obra, no aparece mágicamente completa ni se devuelve todo el dinero gastado.

---

## FASE 3 — MATERIALES, EQUIPOS Y LOGÍSTICA DE CONSTRUCCIÓN

**Prioridad:** alta.  
**Objetivo:** añadir profundidad al tiempo de construcción mediante suministros y movimiento dentro de la ciudad.

### Sistemas y reglas

- Categorías iniciales de material: **áridos/cemento, acero, madera, componentes técnicos y equipamiento**. No simular cientos de insumos en el inicio.
- Toda obra tiene demanda estimada por categoría y etapa.
- Los materiales llegan de proveedores externos o establecimientos locales; necesitan una conexión vial funcional.
- Las rutas largas, la congestión y la falta de proveedores pueden encarecer o demorar entregas.
- Las empresas cuentan con cuadrillas y equipos limitados. Varias obras simultáneas compiten por capacidad.
- Se puede priorizar una obra sobre otra o pagar costos razonables de urgencia, pero la aceleración tiene límite.
- Los depósitos, obradores y accesos temporales ocupan espacio y pueden molestar a vecinos.
- Las cadenas de suministro locales pueden mejorar costos y empleo cuando la ciudad madura.

### Tareas para la IA

- [ ] Relacionar cada etapa de obra con materiales y equipos concretos.
- [ ] Permitir faltantes y reabastecimiento sin bloquear permanentemente la ciudad.
- [ ] Mostrar «retrasada por acero», «sin acceso de camiones» o «sin cuadrilla» en vez de un genérico «obra pausada».
- [ ] Introducir costos de urgencia y replanificación.

### Criterios de aceptación

- [ ] Cortar temporalmente el acceso de suministros afecta al plazo de una obra activa.
- [ ] Reponer el material faltante permite continuar sin reiniciar el avance.
- [ ] Iniciar demasiadas obras simultáneas tiene una consecuencia previsible.

---

## FASE 4 — ZONIFICACIÓN, MERCADO INMOBILIARIO Y CRECIMIENTO PRIVADO

**Prioridad:** máxima.  
**Objetivo:** crear barrios vivos sin que el alcalde coloque y complete manualmente cada casa privada.

### Tipos de suelo iniciales

- **Residencial baja densidad:** casas, dúplex y pequeños conjuntos.
- **Residencial media densidad:** edificios y viviendas compactas.
- **Comercial:** negocios, oficinas pequeñas y servicios privados.
- **Industrial/logístico:** fábricas, talleres y depósitos con emisiones y tráfico.
- **Mixto:** combinación regulada de vivienda y actividad económica.
- **Equipamiento público / verde / protegido:** usos municipales, parques, reservas y restricciones especiales.

### Reglas esenciales

1. **Zonificar es permitir, no construir.** Al marcar una parcela como residencial, no aparece una casa automáticamente.
2. Surge un **promotor privado** cuando hay demanda suficiente, suelo habilitado, conectividad y expectativas de rentabilidad.
3. El promotor tramita el proyecto y contrata una constructora; el edificio atraviesa las mismas fases visibles, aunque el municipio no pague toda la obra.
4. Viviendas construidas pueden permanecer vacías si no hay empleo, accesibilidad o servicios.
5. Los alquileres y valores inmobiliarios responden a oferta, demanda, calidad barrial, servicios y contaminación.
6. Las mayores densidades requieren infraestructura de mayor capacidad y pueden congestionar vías existentes.
7. El abandono y deterioro deben poder revertirse con políticas y mejoras urbanas.
8. La expansión no garantiza crecimiento: construir demasiados barrios sin empleo genera vacancia y presión sobre el presupuesto.

### Tareas para la IA

- [ ] Mostrar demanda por vivienda, comercio e industria con explicación.
- [ ] Simular al menos un promotor privado que decide cuándo iniciar obra.
- [ ] Exigir constructora y tiempo también para crecimiento privado.
- [ ] Crear estados de parcela: disponible, anunciada, solicitada, en obra, ocupada, vacía y abandonada.
- [ ] Distinguir propiedad privada de inversión pública, para no cobrar al municipio cada casa privada.
- [x] Elegir zonificación de baja o alta densidad para viviendas, comercios e industrias; ajustar capacidad de residentes y empleos y reflejarla en sus modelos 3D (Alfa 0.272).

### Criterios de aceptación

- [ ] Una zona residencial sin trabajo ni servicios suficientes no se llena por sí sola.
- [ ] Mejorar accesibilidad y servicios puede estimular nuevas construcciones privadas tras una demora razonable.
- [ ] Construir demasiado suelo residencial puede generar casas vacías.
- [ ] Los edificios privados nunca aparecen terminados de inmediato.

---

## FASE 5 — POBLACIÓN, HOGARES, NECESIDADES Y MIGRACIÓN

**Prioridad:** máxima.  
**Objetivo:** que la ciudad tenga residentes con motivos para quedarse o irse.

### Dimensiones de bienestar

- Disponibilidad y asequibilidad de vivienda.
- Empleo y salario aproximado por sector.
- Acceso a salud, educación y seguridad.
- Tiempo de viaje al trabajo y a servicios.
- Agua, electricidad, saneamiento, residuos y conectividad.
- Calidad del entorno: contaminación, ruido, parques y seguridad vial.
- Carga fiscal percibida y calidad del gasto municipal.

### Reglas y comportamientos

- Las personas están agrupadas en **hogares y perfiles** con necesidades distintas; no todos priorizan lo mismo.
- La población evoluciona por mudanzas de entrada y salida, formación de hogares y cambios demográficos simplificados.
- Un hogar compara atractivo local, costo de vida y oportunidad laboral antes de mudarse.
- La satisfacción ciudadana se calcula por barrio y después se agrega a escala municipal, evitando que un barrio rico o céntrico oculte crisis en otros.
- Los problemas persistentes provocan emigración, viviendas vacías, protestas o caída de apoyo.
- Las mejoras no surten efecto de inmediato: un nuevo servicio puede necesitar meses del juego para reflejarse en confianza y migración.

### Tareas para la IA

- [ ] Incorporar hogares con al menos tres perfiles de necesidades.
- [ ] Mostrar población total, crecimiento, migración neta y satisfacción por barrio.
- [ ] Vincular migración a empleo, vivienda, servicios y costo de vida.
- [ ] Hacer distinguible «ciudad sin habitantes» de «ciudad con población insatisfecha».

### Criterios de aceptación

- [ ] Cerrar una fuente importante de empleo puede provocar salida gradual de población.
- [ ] Crear viviendas sin empleo no genera inmigración ilimitada.
- [ ] Distintos barrios pueden tener niveles de satisfacción claramente diferentes.

---

## FASE 6 — SERVICIOS E INFRAESTRUCTURA URBANA BÁSICA

**Prioridad:** máxima.  
**Objetivo:** que el funcionamiento diario dependa de redes y capacidad, no solo de edificios construidos.

### Redes obligatorias

1. **Electricidad:** producción o compra externa, capacidad, distribución, consumo y cortes.
2. **Agua potable:** captación o conexión, tratamiento, distribución, demanda y presión/cobertura simplificada.
3. **Saneamiento:** recolección y tratamiento de aguas residuales; impacto sanitario y ambiental.
4. **Residuos:** recolección, capacidad de transferencia/tratamiento, rutas y costos.
5. **Conexión exterior:** entrada/salida de personas y mercancías, imprescindible en etapas iniciales.

### Reglas esenciales

- Un servicio nuevo necesita tanto **construcción** como **puesta en marcha** y **mantenimiento mensual**.
- La cobertura geográfica no equivale a capacidad suficiente: un barrio puede estar conectado y sufrir cortes por sobrecarga.
- No todo servicio mejora la ciudad: plantas ruidosas, vertederos o centrales contaminantes crean externalidades.
- Desatender infraestructura reduce fiabilidad, aumenta costos de reparación y perjudica la satisfacción.
- Los cortes deben propagar efectos: falta de electricidad puede afectar comercios, bombeo de agua y hospitales según las dependencias.

### Tareas para la IA

- [ ] Construir una cadena completa para electricidad y agua: origen → red → consumo → problema si falta capacidad.
- [ ] Añadir costo operativo y degradación por falta de mantenimiento.
- [ ] Incluir vistas de demanda, cobertura y fallas por barrio.
- [ ] Notificar preventivamente antes de alcanzar la saturación.

### Criterios de aceptación

- [ ] Duplicar la población sin ampliar servicios termina generando déficit de capacidad.
- [ ] Una central construida pero sin presupuesto operativo no produce a capacidad plena.
- [ ] Una falla de red produce consecuencias identificables y se puede reparar.

---

## FASE 7 — MOVILIDAD, TRÁNSITO Y TRANSPORTE PÚBLICO

**Prioridad:** alta.  
**Objetivo:** que la disposición de viviendas, trabajos y servicios determine tráfico y productividad.

### Sistemas y reglas

- Los habitantes realizan desplazamientos regulares entre vivienda, empleo, escuela, comercio y servicios.
- Existe jerarquía vial: calles locales, avenidas y conectores regionales, con capacidad, velocidad y costo de mantenimiento diferentes.
- Intersecciones y cruces pueden convertirse en cuellos de botella.
- El transporte de materiales usa la misma infraestructura y puede empeorar congestión durante grandes obras.
- Las primeras opciones de movilidad son **caminar, automóvil y autobús**. Bicicletas, trenes, metro y carga ferroviaria quedan para etapas posteriores.
- Las líneas de autobús requieren recorridos, paradas, flota y presupuesto operativo.
- El acceso deficiente a empleos reduce productividad, ocupación y satisfacción; mejorar la movilidad puede elevar valor del suelo.

### Tareas para la IA

- [ ] Representar viajes por origen/destino y carga por vías.
- [x] Diferenciar calles locales, avenidas, rutas regionales y autopistas por precio, mantenimiento, capacidad, velocidad, estacionamiento y acceso a parcelas (Alfa 0.272).
- [x] Animar recorridos peatonales y de otros modos dentro de sus ventanas de trabajo, regreso, escuela, compras, servicios y paseo.
- [x] Hacer que los peatones cedan el paso en intersecciones señalizadas y que los colectivos se detengan para embarcar y desembarcar pasajeros.
- [ ] Mostrar congestión, tiempos de viaje y zonas aisladas.
- [ ] Permitir crear y ajustar rutas de autobús.
- [ ] Hacer que construir una avenida cause perturbaciones temporales antes de producir mejoras.

### Criterios de aceptación

- [ ] Una ciudad extendida con una sola avenida registra embotellamientos.
- [ ] Abrir un acceso alternativo puede aliviar congestión.
- [ ] Una línea de autobús bien ubicada reduce tiempos de viaje a una fracción de usuarios, pero cuesta dinero todos los meses.

---

## FASE 8 — ECONOMÍA, EMPLEO, IMPUESTOS Y PRESUPUESTO

**Prioridad:** máxima.  
**Objetivo:** que el éxito urbano exija administrar recursos escasos y efectos de mediano plazo.

### Fuentes de ingresos

- Impuestos residenciales o inmobiliarios.
- Impuestos o tasas a comercios y actividades industriales.
- Tasas por servicios municipales cuando corresponda.
- Transferencias y ayudas extraordinarias sujetas a condiciones simples.
- Multas, licencias y otros ingresos secundarios, sin convertirlos en fuente principal abusiva.

### Gastos municipales

- Obras nuevas y ampliaciones de contrato.
- Nóminas y operación de servicios.
- Electricidad, agua, residuos y transporte público.
- Mantenimiento de calles, parques e infraestructuras.
- Intereses y amortización de deuda.
- Emergencias, compensaciones y reparaciones.

### Reglas esenciales

1. Mostrar **saldo disponible, dinero reservado y obligaciones futuras** por separado.
2. Elaborar presupuesto mensual y previsión de al menos 12 meses del juego.
3. Subir impuestos aumenta recaudación potencial, pero puede reducir atractivo, inversión y apoyo.
4. Bajar impuestos no debe crear riqueza automáticamente: su efecto es gradual y depende del contexto.
5. Crear empleos requiere actividad productiva real y trabajadores accesibles.
6. El presupuesto puede entrar en déficit; la deuda ofrece alivio temporal, no elimina gastos futuros.
7. Gastar todo en grandes construcciones puede dejar sin fondos la operación diaria.
8. Cada medida importante debe mostrar beneficios, costos, riesgos y población beneficiada/perjudicada.

### Tareas para la IA

- [ ] Crear un presupuesto que cuadre ingresos, gastos, reserva y deuda.
- [ ] Incorporar impuestos ajustables con efectos diferidos.
- [ ] Diferenciar inversión de capital, gastos operativos y obligaciones contractuales.
- [ ] Crear vínculos entre empleo, población, consumo y recaudación.
- [ ] Avisar sobre insolvencia antes de que ocurra.

### Criterios de aceptación

- [ ] Construir cinco servicios nuevos sin poder mantenerlos produce problemas reales.
- [ ] Un aumento agresivo de impuestos mejora caja inicialmente, pero puede degradar demanda y apoyo.
- [ ] La deuda tiene costo y calendario de pago visibles.
- [ ] La partida puede recuperarse de un déficit moderado con decisiones razonables.

---

## FASE 9 — SERVICIOS PÚBLICOS, SALUD, EDUCACIÓN Y SEGURIDAD

**Prioridad:** alta.  
**Objetivo:** generar decisiones de cobertura, capacidad, calidad y prioridades por distrito.

### Servicios por incorporar

| Servicio | Qué necesita además del edificio | Qué aporta | Qué ocurre si falla |
|---|---|---|---|
| Centro de salud/hospital | Personal, equipo, energía, accesibilidad | Salud y respuesta a emergencias | Enfermedad, insatisfacción, emergencias desatendidas |
| Escuela | Docentes, plazas, suministros, movilidad | Educación y atractivo residencial | Saturación y menor oportunidad futura |
| Policía/seguridad | Personal, vehículos, cobertura | Prevención y respuesta | Inseguridad y deterioro barrial |
| Bomberos | Dotación, vehículos, tiempos de respuesta | Reduce daños y riesgo de propagación | Incendios con mayores pérdidas |
| Parques y recreación | Mantenimiento, acceso y seguridad | Calidad de vida y valor del entorno | Deterioro y menor satisfacción |
| Protección civil | Preparación y presupuesto | Respuesta a incidentes | Crisis más costosas y lentas |

### Reglas esenciales

- **Capacidad ≠ cobertura ≠ calidad.** Un hospital cercano puede estar saturado o sin recursos.
- Mejorar presupuesto puede elevar calidad, pero no sustituye la ampliación física si no hay espacio.
- Un barrio periférico puede tener servicios insuficientes pese a que la media municipal parezca buena.
- La demanda crece con población y condiciones locales.
- Priorizar un sector puede generar tensiones distributivas en otros.

### Tareas para la IA

- [ ] Añadir indicadores por servicio: cobertura, capacidad utilizada, calidad, costo y población no atendida.
- [ ] Crear al menos un problema de saturación y una respuesta de ampliación funcional.
- [ ] Integrar tiempos de acceso al resultado del servicio.

### Criterios de aceptación

- [ ] Una escuela terminada y sin presupuesto no educa a plena capacidad.
- [ ] Eliminar una estación de bomberos empeora el riesgo de sectores anteriormente cubiertos.
- [ ] Los jugadores pueden decidir entre abrir una instalación nueva y reforzar una existente.

---

## FASE 10 — MEDIOAMBIENTE, CALIDAD DE VIDA Y DESARROLLO URBANO

**Prioridad:** media-alta.  
**Objetivo:** que la ciudad no se reduzca a recaudar más y construir más edificios.

### Mecánicas

- **Contaminación del aire, agua y suelo** producida por actividades, plantas y tránsito; difusión y efectos locales simplificados.
- **Ruido** de avenidas, industrias y obras; malestar en residencias próximas.
- **Espacios verdes** que mejoran bienestar y atractivo según acceso y mantenimiento.
- **Densidad y uso mixto** para reducir distancias, con exigencias mayores de infraestructura.
- **Calidad y desgaste edilicio:** edificios viejos demandan mantenimiento, renovación o inspecciones.
- **Riesgos ambientales** por construir en zonas inundables o de pendiente, advertidos desde la planificación.
- **Desigualdad territorial:** barrios con distintas cargas de contaminación, movilidad y acceso a oportunidades.

### Tareas para la IA

- [ ] Hacer visibles efectos territoriales positivos y negativos de cada proyecto.
- [ ] Permitir remediación, reubicación y renovación urbana con costo y duración.
- [ ] Mostrar cómo crece o disminuye la brecha de bienestar entre barrios.

### Criterios de aceptación

- [ ] Ubicar industria pesada junto a viviendas genera una desventaja persistente.
- [ ] Crear un parque mejora un área cercana sin solucionar por sí solo la falta de agua o empleo.
- [ ] Renovar un barrio degradado es posible, pero tiene costo y efectos sociales.

---

## FASE 11 — APOYO CIUDADANO, ELECCIONES Y DESTITUCIÓN

**Prioridad:** alta después de estabilizar la gestión; nunca debe desplazar al núcleo constructor.  
**Objetivo:** que los resultados del gobierno tengan consecuencias políticas verificables.

### 11.1. Filosofía

El jugador **es alcalde o intendente**, y sus amigos forman parte de un único **partido/equipo de gobierno ficticio**. La ideología partidaria no define el juego. La ciudadanía vota en función de su experiencia urbana: servicios, empleo, costo de vida, vivienda, tránsito, calidad ambiental, cumplimiento de compromisos y estabilidad fiscal.

### 11.2. Aprobación ciudadana

- Indicador general de **0 a 100** y desglose por barrio.
- Componentes sugeridos: servicios 25%, economía/empleo 20%, vivienda/costo de vida 15%, movilidad 10%, seguridad/salud ambiental 15%, gestión presupuestaria 10%, confianza en promesas 5%.
- Los pesos son orientativos y pueden variar por perfil de hogar o barrio.
- No convertir satisfacción y apoyo en lo mismo: un vecino puede estar satisfecho con su barrio pero desconfiar del gobierno por una promesa incumplida.
- Las variaciones deben tener **inercia**. Un nuevo hospital no cambia la opinión de toda la población en un segundo, y una medida aislada no borra cuatro años de gestión.
- Mostrar las principales tres causas a favor y en contra del gobierno y cómo evolucionaron en los últimos meses.

### 11.3. Promesas de gestión

- Al iniciar mandato, el equipo elige **2–4 compromisos medibles**: reducir congestión, aumentar cobertura de agua, sumar empleo, equilibrar cuentas, mejorar escuelas, etc.
- Cada promesa tiene fecha límite y umbral verificable; promesas imposibles deben advertirse.
- El cumplimiento aporta confianza; incumplir resta apoyo de manera gradual y proporcionada.
- No premiar spam de proyectos irrelevantes que solo cambien una cifra superficial.

### 11.4. Elecciones cada cuatro años de juego

1. Calendario electoral visible desde el inicio del mandato.
2. A 12 meses del evento, mostrar evaluación de promesas y estimación de voto.
3. A 6 meses, incorporar debates de gestión muy simples: prioridades de obras y presupuesto; **no** un minijuego político independiente.
4. A 3 meses, mostrar sondeos por distrito y escenarios posibles.
5. Al finalizar el mandato, realizar una votación entre el partido del equipo y una oposición ficticia.
6. La votación se basa principalmente en satisfacción, apoyo y resultados de gobierno; la variabilidad aleatoria debe ser **pequeña, visible y no decisiva por sí sola en resultados claros**.
7. Si el partido del equipo gana, comienza un nuevo mandato con retos mayores. Si pierde, **termina la partida competitiva para todos los jugadores de ese gobierno**.
8. Al perder, mostrar un informe de gestión con fortalezas, errores, obras destacadas y motivos de derrota; ofrecer comenzar nueva ciudad o revisar la ciudad final en modo de observación, sin seguir gobernando como si nada hubiera pasado.

### 11.5. Destitución extraordinaria

- Es posible antes de una elección, pero **no** por un único error pequeño.
- Activadores posibles: crisis fiscal extrema sostenida, colapso prolongado de servicios esenciales, corrupción contractual probada en eventos del juego o pérdida crítica y sostenida de legitimidad.
- Propuesta inicial: apoyo inferior a 15/100 durante 90 días de juego **más** al menos una crisis grave documentada. Se debe revisar este umbral en pruebas de balance.
- Debe existir una secuencia de alertas: advertencia → posibilidad de corrección → procedimiento de destitución → resultado.
- Si hay destitución, se pierde la partida compartida con un informe claro.

### 11.6. Cálculo electoral transparente (guía de diseño)

En cada distrito se estima la intención de voto gubernamental a partir de **satisfacción local, aprobación general, situación económica, cumplimiento de promesas y estabilidad de servicios**. La intención final de la ciudad se pondera por la población habilitada para votar en cada distrito. La oposición se beneficia del deterioro del gobierno; no hace falta construir una simulación partidaria completa.

**Protecciones de diseño:** límites razonables a las variaciones súbitas, ninguna derrota inexplicable por azar, no duplicar penalizaciones de una misma crisis y no usar una sola estadística aislada para decidir el resultado.

### Tareas para la IA

- [ ] Separar satisfacción ciudadana, confianza en el gobierno e intención de voto.
- [ ] Añadir apoyo y causas por barrio.
- [ ] Incorporar promesas medibles y seguimiento de mandato.
- [ ] Simular una elección completa con evaluación final y continuación o derrota.
- [ ] Crear destitución con advertencias, plazos y condiciones verificables.

### Criterios de aceptación

- [ ] Mejorar servicios de varios barrios aumenta apoyo gradualmente y de forma explicable.
- [ ] Una ciudad con economía, servicios y promesas sostenidamente malos puede perder elecciones.
- [ ] Una ciudad gestionada correctamente puede ganar sin un evento aleatorio imprescindible.
- [ ] Si el partido pierde, todos los compañeros reciben el mismo resultado de derrota.
- [ ] La destitución no ocurre instantáneamente por una sola obra fallida.

---

## FASE 12 — JUEGO COOPERATIVO: DECISIONES Y RESPONSABILIDADES

**Prioridad:** crítica para la experiencia social.  
**Objetivo:** que construir con amigos sea útil, coordinado y divertido, no una pelea por la misma herramienta.

> Esta fase cubre **exclusivamente las reglas jugables de cooperación**, no cómo se conectan los jugadores ni cómo funcionan los códigos de sala.

### Reglas propuestas

- Todos pertenecen a **un único gobierno municipal** y comparten ciudad, presupuesto, contratos, aprobación, elecciones y resultado final.
- El creador de la partida es, por defecto, **alcalde/anfitrión**; puede asignar o retirar responsabilidades.
- Funciones opcionales para amigos: **Urbanismo y Obras**, **Economía y Hacienda**, **Servicios Públicos**, **Movilidad y Medioambiente**. Los cargos ayudan a organizarse, no bloquean permanentemente acciones para una persona.
- Cualquier jugador autorizado puede proponer obras, pero el municipio no debe gastar dos veces el mismo presupuesto por decisiones simultáneas.
- **Umbrales de autorización:** proyectos pequeños se pueden aprobar por responsable; proyectos muy caros, endeudamiento importante o demoliciones críticas requieren aprobación del alcalde o votación del equipo según configuración.
- Registrar quién propuso, aprobó y modificó cada obra o política para poder discutir decisiones.
- Se debe ver qué compañero está inspeccionando una obra o editando un presupuesto, sin impedir que otros observen.
- Pausa y cambios de velocidad: anfitrión decide por defecto; en cooperativo se puede activar votación para x2/x4 y pausa de planificación.
- Si el alcalde se retira temporalmente, la partida puede pausarse o delegar autoridad a otro jugador habilitado. Esta regla depende de la configuración de la sesión y debe ser visible.
- **Nadie puede expulsar a otro de la partida política por un simple desacuerdo** salvo permisos explícitos de administración de sala; las consecuencias de gestión son colectivas.

### Modos jugables

1. **Un jugador:** alcalde controla todos los sistemas.
2. **Cooperativo libre:** todos pueden construir y gestionar, con confirmaciones para gastos grandes.
3. **Cooperativo por áreas:** cada jugador tiene responsabilidades preferentes; el alcalde conserva coordinación general.

### Tareas para la IA

- [ ] Incorporar propuestas de obra que otro jugador pueda revisar y aprobar.
- [ ] Separar permisos de gestión cotidiana y decisiones estratégicas mayores.
- [ ] Mostrar un historial compartido de decisiones.
- [ ] Incorporar votación opcional para presupuestos extraordinarios y medidas conflictivas.
- [ ] Unificar elecciones, victoria y derrota de todo el equipo.

### Criterios de aceptación

- [ ] Dos amigos pueden gestionar transporte y construcción al mismo tiempo sin duplicar gastos.
- [ ] Un gasto grande exige la aprobación configurada y deja registro.
- [ ] Ningún jugador posee una tesorería individual que rompa el presupuesto común.
- [ ] La derrota electoral afecta a toda la partida, no solo al alcalde.

---

## FASE 13 — CRISIS, INSPECCIONES, PROTESTAS Y ACONTECIMIENTOS

**Prioridad:** media-alta.  
**Objetivo:** producir historias emergentes vinculadas a la gestión, sin depender de eventos aleatorios injustos.

### Familias de acontecimientos

1. **Obras y contratos:** falta de insumos, sobrecostes, errores constructivos, quiebra o incumplimiento de contratista.
2. **Servicios:** avería eléctrica, contaminación de agua, saturación hospitalaria, huelga de residuos.
3. **Movilidad:** accidente importante, colapso de intersección, corte por reparación, sobrecarga de camiones.
4. **Economía:** caída de actividad comercial, apertura de fábrica, aumento de precios de materiales, oportunidad de subvención.
5. **Sociedad:** protesta por impuestos, queja vecinal por ruido, reclamo por vivienda, apoyo a una obra demandada.
6. **Ambientales:** tormenta fuerte, inundación localizada, ola de calor, incendio de pastizales, sequía leve.

### Regla de un acontecimiento bien diseñado

**Señal previa (cuando sea razonable) → aparición → diagnóstico → opciones con costos y tiempos → consecuencias → evaluación posterior.**

Ejemplo: se pronostican tormentas → desagües ya están saturados → ocurre anegamiento → el jugador decide medidas temporales y obras definitivas → hay costo económico, social y político proporcional a la preparación previa.

### Tareas para la IA

- [ ] Crear una biblioteca inicial de al menos 12 eventos causales con alternativas de respuesta.
- [ ] Relacionar probabilidad y severidad con la condición de la ciudad.
- [ ] Permitir prevenir, mitigar o reparar; no todos los eventos deben resolverse pagando instantáneamente.
- [ ] Evitar encadenar crisis idénticas sin oportunidad razonable de recuperación.

### Criterios de aceptación

- [ ] Dos ciudades con diferentes sistemas de drenaje sufren consecuencias distintas ante la misma tormenta.
- [ ] Una crisis mal gestionada afecta a población y apoyo de manera explicable.
- [ ] El jugador dispone de medidas reales de prevención y recuperación.

---

## FASE 14 — PROGRESIÓN, ESPECIALIZACIÓN Y METAS DE CIUDAD

**Prioridad:** media.  
**Objetivo:** sostener partidas largas sin convertir funciones básicas en desbloqueos artificiales.

### Progresión recomendada

- El jugador empieza con las herramientas fundamentales disponibles. Los proyectos complejos se vuelven **viables** al desarrollar población, presupuesto, capacidad administrativa y demanda.
- No bloquear parques, viviendas, calles básicas, hospitales o elecciones tras niveles de experiencia arbitrarios.
- Introducir especializaciones urbanas emergentes: ciudad universitaria, industrial, turística, portuaria, tecnológica o residencial.
- Crear objetivos opcionales por mandato y por desarrollo: reducir contaminación, ampliar transporte, equilibrar cuentas, alcanzar cobertura de agua del 95%, disminuir desempleo o revitalizar un barrio.
- La dificultad crece porque aumentan **interdependencias, mantenimiento, expectativas y escala**, no porque los ciudadanos exijan milagros sin causa.
- Permitir jugar de forma tranquila construyendo una buena ciudad, sin obligaciones repetitivas de microgestión.

### Metas no electorales

- **Ciudad funcional:** servicios esenciales, equilibrio de caja y viviendas ocupadas.
- **Ciudad conectada:** tiempos de viaje razonables y transporte público sostenible.
- **Ciudad resiliente:** red de servicios robusta y capacidad de respuesta ante crisis.
- **Ciudad inclusiva:** brechas menores entre distritos.
- **Ciudad próspera:** actividad económica y buen nivel de vida sin endeudamiento descontrolado.

### Estado de trabajo · Alfa 0.244

- [x] Objetivos voluntarios de ciudad funcional, conectada, resiliente, inclusiva y próspera con indicadores y umbrales visibles.
- [x] El objetivo elegido avanza en cierres mensuales sostenidos, conserva historial al completarse y puede pausarse o cambiarse.
- [x] Seguimiento compartido entre participantes LAN y persistencia en partidas Online y Offline; no modifica elecciones ni desbloquea herramientas.
- [ ] Especializaciones emergentes por estructura económica y trayectorias de desarrollo urbano de largo plazo.
- [ ] Ampliar objetivos ambientales, de transporte y revitalización y validar su equilibrio en partidas largas.

### Criterios de aceptación

- [ ] Es posible construir una ciudad saludable sin perseguir una única estrategia dominante.
- [ ] El municipio conserva desafíos relevantes después de ganar la primera elección.
- [ ] Ninguna función fundamental depende de compras, pases o límites arbitrarios de contenido.

---

## FASE 15 — EXPERIENCIA DE JUEGO, INFORMACIÓN Y EQUILIBRIO

**Prioridad:** transversal; cerrar antes de declarar la versión jugable completa.  
**Objetivo:** convertir muchos sistemas en decisiones comprensibles y agradables.

### Información que el jugador debe poder consultar

- **Resumen de ciudad:** población, hogares, empleo, dinero, ingresos/gastos, aprobación, fecha electoral, alertas.
- **Vista de obras:** empresa, etapa, avance, pagos, suministros pendientes, días de retraso, calidad estimada.
- **Vista de terreno:** zonificación, accesibilidad, servicios, valor del suelo y restricciones.
- **Vista de servicios:** cobertura y capacidad, no solo posición de edificios.
- **Vista de tráfico:** congestionamiento, rutas y tiempos de viaje.
- **Vista de barrios:** población, calidad de vida, problemas y apoyo político.
- **Vista de políticas:** promesas, cambios de impuestos, efectos esperados y efectos observados.
- **Registro de decisiones:** quién decidió qué, cuándo y con qué consecuencias.
- **Vista económica avanzada:** ingresos por actividad, firmas abiertas/cerradas, empleo, inversiones, inventarios, importaciones/exportaciones, solvencia.
- **Vista de infraestructura regional:** rutas, capacidad, colas y rentabilidad de puertos/aeropuertos; conectividad con hoteles, fábricas y centros de carga.
- **Vista patrimonial y temporal:** edad, estilo, reformas, protección, edificios vacíos, obras inconclusas y rehabilitaciones.
- **Vista de resiliencia:** inundabilidad, fiabilidad de redes, criticidad de activos y planes de emergencia.

### Reglas de claridad

- Toda orden irreversible importante pide confirmación con costo y efecto probable.
- Los indicadores deben tener información emergente de «por qué cambió» y «qué se puede hacer».
- Los eventos deben priorizar urgencias reales; no inundar la partida con notificaciones decorativas.
- Construir debe sentirse satisfactorio: animación progresiva de la obra, llegada de materiales, hitos, inspección y apertura.
- Las estimaciones de proyecto son aproximadas, pero la incertidumbre debe estar señalada (ej.: plazo 6–8 semanas).
- Incorporar tutorial de primera hora centrado en **calles → servicios → contratación → primera obra → mudanzas → presupuesto → apoyo**.

### Criterios de aceptación

- [ ] Un nuevo jugador entiende cómo construir su primera escuela sin explicación externa.
- [ ] Un jugador puede detectar el motivo de un déficit y responder antes de una quiebra.
- [ ] Hay información suficiente para anticipar una posible derrota electoral.
- [ ] La ciudad tiene etapas constructivas claramente distinguibles visualmente.

---

# BLOQUE DE REALISMO PROFUNDO — FASES 16 A 33

> **Alcance:** las fases siguientes amplían las 16 fases originales (0–15). No reemplazan su núcleo. Introducen procesos económicos, físicos, sociales y administrativos que deben interactuar con las constructoras, las finanzas, los barrios, la movilidad, los servicios y las elecciones ya definidos. **Los valores son parámetros de balance ficticios**, no datos técnicos ni normativas universales. Todas las cifras se muestran con unidades y pueden calibrarse según el tamaño del mapa.
>
> **Criterio de realismo:** un sistema nuevo debe crear decisiones de inversión, operación, riesgo y mantenimiento. Si un puerto, aeropuerto, hotel o empresa funciona solamente por colocar un edificio o pulsar un botón, la fase está incompleta.

## FASE 16 — GEOGRAFÍA, GEOLOGÍA, CATASTRO Y DERECHO DE SUELO

**Prioridad:** alta antes de infraestructuras mayores. **Depende de:** fases 1, 2, 4 y 10.  
**Objetivo:** que la geografía, la propiedad y las restricciones condicionen el urbanismo y el costo de las obras.

### Funcionamiento jugable

1. Cada parcela registra superficie en m², pendiente, elevación, uso permitido, titularidad (municipal, privada o protegida), valor de referencia, acceso vial y servidumbres. No toda superficie del mapa es legalmente edificable.
2. El suelo distingue resistencia de cimentación, permeabilidad y riesgo de asentamiento, con **información imperfecta** antes de un estudio. El jugador puede financiar estudios geotécnicos para reducir incertidumbre; la diferencia entre estimación y hallazgo real causa ajustes razonados del proyecto.
3. Los ríos tienen cauce, cuenca, zonas de desborde y efecto aguas abajo; las costas tienen profundidad, exposición a temporales y requerimientos de dragado si se usan como puerto.
4. Montañas, humedales y áreas protegidas elevan el costo, exigen mitigaciones o impiden obras. Cambiar regulaciones no hace desaparecer daños ambientales ni la resistencia vecinal.
5. Antes de ensanchar una avenida o construir equipamientos se requiere disponibilidad de suelo: compra, convenio, expropiación excepcional con compensación o rediseño. El dinero municipal no equivale a propiedad automática.
6. El catastro muestra parcelas vacantes, edificios, usos mixtos, titularidad, valores, riesgos y disputas; se actualiza tras subdivisiones, fusiones o cambios de zonificación.
7. Delimitar una zona de expansión exige plan de accesos y servicios, cálculo de costo por vivienda estimada y superficie reservada para drenaje y equipamientos.
8. Las obras que alteran la topografía generan movimientos de tierra, gasto de transporte, taludes y potenciales efectos de escorrentía en barrios vecinos.

### Decisiones que habilita

- Elegir entre una traza corta y costosa (pendiente alta, múltiples compras) y otra más larga con menor costo total.
- Encargar o no un estudio de suelo; aceptar mayores incertidumbres de cimentación.
- Proteger humedales o urbanizarlos, asumiendo pérdida de absorción y mayores costos futuros.
- Comprar terrenos estratégicos anticipadamente, inmovilizando capital y evitando conflictos posteriores.

### Tareas para la IA

- [ ] Crear fichas de parcela con restricciones y propiedad diferenciada.
- [ ] Permitir inspección de riesgos y estudios previos con precio, duración y utilidad real.
- [ ] Incorporar adquisiciones de terrenos y costos sociales por desplazamientos.
- [ ] Conectar excavaciones, rellenos y superficie impermeabilizada con drenaje y obras.

### Criterios de aceptación

- [ ] Un puente sobre suelo difícil cuesta más y requiere mayor plazo que uno equivalente sobre suelo favorable.
- [ ] Una avenida no puede ocupar una parcela privada sin adquirir derechos o rediseñarse.
- [ ] Modificar un cauce puede aumentar riesgo aguas abajo, y el juego indica causa y sector afectado.

---

## FASE 17 — EMPRESAS PRIVADAS, INVERSIÓN Y COMPETENCIA REAL

**Prioridad:** máxima para la economía avanzada. **Depende de:** fases 4, 5 y 8.  
**Objetivo:** sustituir la aparición automática de negocios por un tejido empresarial que toma decisiones de inversión, contratación y cierre.

### Funcionamiento jugable

1. Cada empresa posee sector, capital de trabajo, caja, costos fijos, capacidad física, trabajadores, productividad, reputación, proveedores, clientela y riesgo de insolvencia. **La empresa privada usa su propio dinero**, no el presupuesto municipal.
2. Los sectores se conectan por oferta y demanda: comercio minorista, industria, construcción, logística, tecnología, servicios profesionales, hotelería y alimentación. Un negocio puede necesitar insumos comprados a otro negocio.
3. Los empresarios evalúan **demanda solvente**, costo del suelo, alquiler, impuestos, salarios, acceso a proveedores, energía, agua, transporte y competencia existente antes de abrir.
4. Cuando hay una oportunidad, la empresa busca local, financia proyecto, solicita permisos, contrata obra si hace falta, compra equipamiento y abre progresivamente. Inaugurar no garantiza ganancias.
5. Empresas competidoras pueden diferenciar precio, calidad y cobertura; la competencia afecta márgenes, salarios, precios al consumidor y quiebras. No existe “un negocio por cada cuadrícula” sin mercado.
6. Una empresa sin demanda acumula pérdidas, reduce personal, renegocia alquiler, cierra temporalmente o entra en insolvencia. Sus instalaciones quedan vacías y pueden ser reutilizadas por otra firma.
7. El municipio puede crear condiciones —mejoras viales, formación, normas claras, fiscalidad, suelo industrial, incentivos temporales— pero no ordenar arbitrariamente el éxito de las empresas.
8. Debe haber entradas y salidas regionales: una ciudad pequeña puede importar productos y exportar parte de su producción. Las importaciones **tienen costo y requieren conectividad**.
9. El empleo generado debe reflejar turnos, productividad y capacidad, no una cifra fija desconectada de ventas. Si baja la producción, cambian las necesidades laborales.
10. El jugador ve **tasa de apertura/cierre**, supervivencia empresarial, locales vacantes, productividad, precios y sectores saturados, por barrio.

### Ejemplo de cadena causal

Se inaugura un polígono industrial sin suficiente electricidad → las fábricas operan con interrupciones → aumentan costos por unidad → pierden contratos → reducen plantillas → cae la recaudación y se desocupan viviendas cercanas. Instalar capacidad energética ayuda, pero no restituye inmediatamente a los clientes perdidos.

### Tareas para la IA

- [ ] Definir balances de caja privados y decisiones independientes del alcalde.
- [ ] Incluir al menos tres empresas que compitan por una misma clientela sin generar ingresos de la nada.
- [ ] Simular entrada, expansión, despido, cierre y posible recuperación.
- [ ] Exponer causas empresariales: mercado, precios, logística, servicios, salarios y alquiler.
- [ ] Evitar incentivos que creen rentabilidad infinita o empresas sin consumidores.

### Criterios de aceptación

- [ ] Dos comercios próximos compiten y no necesariamente prosperan ambos.
- [ ] Un negocio puede quebrar aunque el edificio continúe intacto.
- [ ] Reducir costos de transporte mejora margen de empresas que realmente lo utilizan, no de toda la ciudad por igual.

---

## FASE 18 — INDUSTRIAS, CADENAS DE SUMINISTRO Y COMERCIO REGIONAL

**Prioridad:** alta. **Depende de:** fases 3, 7, 8 y 17.  
**Objetivo:** que la actividad económica produzca, almacene, transforme y transporte mercancías con límites materiales.

### Funcionamiento jugable

1. Crear cadenas verificables: **áridos → hormigón → obra**, **madera → aserradero → materiales**, **alimentos → procesado → supermercados/hoteles** y **acero importado/local → fabricación → construcción**.
2. Cada instalación productiva requiere parcela compatible, trabajadores, servicios, consumo energético, capacidad de almacenamiento, insumos por unidad y salida comercial. Puede operar a fracción de capacidad.
3. El inventario no aparece instantáneamente: entradas por proveedores, tiempo de descarga, reservas, transformación, mermas y envíos de salida. Las entregas atrasadas se trasladan a obras y comercios.
4. Las fábricas tienen costos marginales, capacidad nominal y mantenimiento. Una planta sobrecargada puede fallar o emitir más contaminación; una planta subutilizada puede ser inviable.
5. El comercio exterior usa corredores reales: autopista, ferrocarril, puerto o aeropuerto, según tipo de carga. Tarifas, tiempo de tránsito, congestión y fiabilidad afectan competitividad.
6. El almacenamiento evita faltantes pero inmoviliza capital, consume suelo y puede generar riesgo de incendios o pérdidas por caducidad.
7. La ciudad puede especializarse en actividades según recursos, ubicación y formación, sin convertir una especialización en “bonificación global +20%” carente de explicación.
8. La logística de última milla tiene horarios, rutas de camiones, vehículos autorizados y conflictos con barrios residenciales.
9. Debe existir un **balance de mercancías por categoría**: existencia inicial + producción + importaciones − consumo − exportaciones − mermas = existencia final.

### Decisiones

- Incentivar industria local o aceptar dependencia de importaciones.
- Financiar acceso ferroviario a una zona fabril o ampliar autopista.
- Autorizar grandes depósitos cerca del centro con ahorro logístico pero impacto sobre camiones, suelo y ruido.

### Tareas para la IA

- [ ] Incorporar al menos tres cadenas materiales completas con inventario.
- [ ] Distinguir escasez de materia prima de falta de transporte o de trabajadores.
- [ ] Mostrar entradas/salidas y cuello de botella dominante de cada cadena.
- [ ] Vincular exportaciones con pagos recibidos por empresas y tributos pertinentes, no con dinero municipal gratuito.

### Criterios de aceptación

- [ ] Cerrar un acceso principal de camiones puede paralizar una obra aun con efectivo disponible.
- [ ] Agregar depósitos reduce interrupciones temporales pero encarece operación.
- [ ] Exportar más de lo producido o de lo almacenado es imposible.

---

## FASE 19 — LICITACIONES AVANZADAS Y DIRECCIÓN DE OBRAS COMPLEJAS

**Prioridad:** máxima para el realismo constructivo. **Depende de:** fases 2, 3, 16 y 18.  
**Objetivo:** llevar el sistema de constructoras más allá del temporizador: capacidad, contratos, riesgos, certificaciones y calidad.

### Funcionamiento jugable

1. Diferenciar **proyecto conceptual → anteproyecto → proyecto ejecutivo → permisos → licitación → adjudicación → ejecución → inspección → recepción provisional → garantía**. Cada etapa consume tiempo y puede revelar información nueva.
2. Una obra mediana o grande tiene tareas con dependencias. Ejemplo: el hormigonado de una losa depende de encofrado, acero, hormigón y condiciones meteorológicas; no todo puede progresar simultáneamente.
3. Las constructoras registran disponibilidad de cuadrillas por oficio, flota, capital, contratos vigentes, subcontratistas y especializaciones. Aceptar demasiadas obras reduce rendimiento o fuerza a subcontratar.
4. Los pliegos comparan **precio total estimado, flujo de pagos, plazo, riesgo, antecedentes, calidad, mantenimiento esperado y garantías**, no solo la oferta más barata.
5. Los pagos se certifican por hitos o avance físico verificable. Adelantos, retenciones, penalidades y ampliaciones de obra deben figurar claramente.
6. Los cambios de alcance (sumar carriles, ampliar superficie, rediseñar una estación) exigen recalcular cantidades, presupuesto y plazo; no “editar gratis” una obra avanzada.
7. Clima, hallazgos geotécnicos, conflictos laborales, demoras de permisos, equipamiento importado y quiebra de contratistas afectan tareas específicas.
8. El jugador puede reforzar recursos, reasignar cuadrillas, renegociar, ejecutar garantías, reemplazar empresa, pausar o cancelar. Cada alternativa tiene costos y plazos comparables.
9. Las inspecciones distinguen **seguridad, cumplimiento de proyecto, calidad estructural y requisitos de habilitación**. Fallar una inspección exige reparación trazable.
10. Recepcionar una obra no la vuelve eterna: empieza un período de garantía y luego su ciclo de mantenimiento. Vicios ocultos pueden aparecer con probabilidad ligada a calidad e inspección.
11. Licitaciones cuestionables generan revisión administrativa y retrasos; una investigación debe basarse en señales del sistema y permitir defensa/corrección, no castigar por azar sin motivo.

### Ejemplo

Una escuela tiene la estructura terminada, pero falta equipamiento importado y el cableado no supera inspección. La obra se mantiene físicamente avanzada; el jugador elige esperar, cambiar de proveedor o pagar una reparación. **No se habilita ninguna aula** hasta cumplir seguridad y capacidad operativa.

### Tareas para la IA

- [ ] Dividir proyectos grandes en tareas, hitos de pago y ruta crítica aproximada.
- [ ] Simular subcontratación y límites de equipos por empresa.
- [ ] Incorporar órdenes de cambio, multas, garantía y reclamos contractuales.
- [ ] Mostrar avance físico frente a avance financiero; nunca confundir porcentajes.
- [ ] Habilitar rescate de obras inconclusas sin reiniciarlas de cero.

### Criterios de aceptación

- [ ] Cambiar empresa con 60% de obra no reinicia ni completa mágicamente el edificio.
- [ ] Un contratista barato puede terminar más caro por demoras o defectos sin estar predestinado a fallar.
- [ ] Una falla crítica impide habilitación y exige solución visible.

---

## FASE 20 — MERCADO DE VIVIENDA, ALQUILERES, DESARROLLADORES Y ABANDONO

**Prioridad:** máxima. **Depende de:** fases 4, 5, 16, 17 y 19.  
**Objetivo:** simular el ciclo inmobiliario completo, desde adquisición de suelo hasta envejecimiento, vacancia y renovación.

### Funcionamiento jugable

1. Cada inmueble registra titularidad, superficie útil, unidades, antigüedad, eficiencia, estado estructural, valor, alquiler o precio de venta, ocupación y gastos de mantenimiento.
2. La demanda proviene de hogares reales y capacidad de pago; el alquiler depende de oferta, localización, accesibilidad, calidad, servicios y vacancia. Los salarios limitan cuánto se puede pagar.
3. El promotor estima costo de tierra + proyecto + permisos + construcción + financiamiento + riesgo versus ingresos esperados. Puede posponer o descartar un proyecto aunque la zona permita construirlo.
4. Las construcciones privadas siguen todas las etapas de obra, con trabajadores y materiales, aunque el municipio no pague su costo. La burocracia y los impuestos sí modifican viabilidad y plazos.
5. La oferta nueva tarda meses o años en responder a escasez; no puede aparecer inmediatamente cuando se encarece el alquiler.
6. Es posible la **especulación inmobiliaria**: retener terrenos o viviendas vacías esperando mayores precios; ello tiene costos de mantenimiento, impuestos, intereses y riesgo.
7. Los barrios pueden atravesar inversión, consolidación, saturación, deterioro, abandono y rehabilitación. No aplicar “ruina” global por cumplir años: importan mantenimiento, demanda e impactos externos.
8. **Obras abandonadas**: si un desarrollador quiebra o pierde financiación, quedan cimientos/estructura, cercado, riesgo de seguridad y deterioro; deben poder venderse, refinanciarse, reasignarse a otra constructora o demolerse con costo.
9. Viviendas abandonadas pueden afectar seguridad percibida, valor de parcelas contiguas, salud y recaudación. La recuperación necesita inversión, remediación y demanda efectiva.
10. Renovar una zona puede aumentar alquileres y provocar desplazamiento. Introducir políticas de vivienda asequible, rehabilitación asistida, mezcla social, derechos de relocalización y vivienda pública con costos explícitos.
11. No permitir que las autoridades “pinten de rico” un barrio sin cambiar empleo, hogares, servicios y estructura urbana.

### Decisiones

- Promover construcción densa o proteger tejido de baja altura.
- Ofrecer suelo a desarrolladores con requisitos de vivienda asequible.
- Comprar un complejo a medio construir para terminarlo como vivienda pública.
- Rehabilitar una avenida histórica sin expulsar a todos sus residentes.

### Tareas para la IA

- [ ] Incorporar precios/alquileres de inmuebles con capacidad de pago de hogares.
- [ ] Simular balances y decisiones de al menos dos desarrolladores que compiten por suelo.
- [ ] Crear abandono de obra, edificio vacío y edificio inhabitable como estados diferentes.
- [ ] Implementar rescate, venta, rehabilitación, demolición y política de vivienda social.
- [ ] Medir viviendas vacantes, déficit habitacional, asequibilidad y hogares desplazados por barrio.

### Criterios de aceptación

- [ ] Zonificar más lotes no provoca construcción si los promotores prevén pérdidas.
- [ ] Una obra a medio hacer permanece visible, cuesta mantenerla segura y puede reactivarse.
- [ ] Una política de rehabilitación puede reducir abandono pero elevar precios si no acompaña la asequibilidad.

---

## FASE 21 — MERCADO LABORAL, SALARIOS, CUALIFICACIONES Y DESIGUALDAD

**Prioridad:** alta. **Depende de:** fases 5, 8, 9 y 17.  
**Objetivo:** reemplazar la relación artificial “un edificio = N empleos” por una economía laboral sensible a capacitación y accesibilidad.

### Funcionamiento jugable

1. Los hogares poseen composición, personas activas, edades, nivel educativo aproximado, ingresos, gastos básicos y lugar de residencia. El bienestar no se representa solo con un índice universal.
2. Las empresas demandan ocupaciones diferenciadas: construcción, operarios, conductores, personal sanitario, docentes, técnicos, administración y servicios. Cada puesto requiere competencias y salario.
3. Una vacante no se llena si los candidatos no están capacitados, no pueden llegar al trabajo o exigen un salario superior al ofrecido. Puede haber simultáneamente desempleo y puestos vacantes.
4. La educación técnica, secundaria, superior y capacitación laboral modifican lentamente el conjunto de habilidades disponibles. Sus resultados llegan con retraso y dependen de plazas, docentes y accesibilidad.
5. Los trabajadores eligen entre oportunidades según remuneración neta, tiempo de viaje, estabilidad y costo de vida. La emigración de profesionales puede deteriorar servicios avanzados.
6. Salarios altos pueden atraer población y elevar demanda comercial, pero aumentan costos a empresas y presión sobre alquileres; salarios bajos pueden impulsar empleo precario y pobreza laboral.
7. El transporte público y la disponibilidad de vivienda cerca de empleos modifican la oferta laboral efectiva, no solamente el índice de tráfico.
8. Se contabiliza **población en edad laboral, ocupados, desempleados que buscan empleo, personas fuera del mercado de trabajo, vacantes y puestos sin cubrir** sin contar dos veces a la misma persona.
9. Introducir heterogeneidad social por barrio: ingresos, carga de alquiler, acceso sanitario, calidad educativa, vulnerabilidad a crisis y capacidad de ahorro.
10. Los servicios sociales tienen alcance y costo: asistencia alimentaria temporal, refugio, formación, transporte subsidiado o apoyo de alquiler. Deben atender necesidades causales sin producir dinero arbitrario.
11. Los indicadores de calidad de vida muestran promedios y distribución; una ciudad con promedio alto puede contener barrios con problemas críticos.

### Ejemplo

Se abre una planta tecnológica con 500 puestos anunciados, pero solo 130 trabajadores poseen la formación requerida y una parte vive a 90 minutos. La planta comienza parcialmente operativa; invertir en formación y movilidad mejora contratación después de varios ciclos. No se generan 500 trabajadores capacitados en el instante de inaugurar.

### Tareas para la IA

- [ ] Conectar demanda laboral de empresas con competencias, salarios, vivienda y transporte.
- [ ] Permitir programas de formación con duración, presupuesto y capacidad.
- [ ] Mostrar indicadores de desempleo, vacantes, ingresos y carga habitacional por distrito.
- [ ] Agregar migración por oportunidades económicas y efectos secundarios sobre servicios.

### Criterios de aceptación

- [ ] Abrir una empresa especializada no garantiza cubrir todas las plazas de inmediato.
- [ ] Mejorar transporte puede bajar desempleo por accesibilidad sin construir nuevas empresas.
- [ ] Un boom de empleo puede coexistir con crisis de vivienda y pérdida de bienestar.

---

## FASE 22 — MOVILIDAD AVANZADA: AUTOS, AUTOBUSES, TRENES, METRO Y CARGA

**Prioridad:** alta, especialmente para ciudades medianas y grandes. **Depende de:** fases 7, 18 y 21.  
**Objetivo:** construir un sistema de movilidad donde capacidad, frecuencia, transferencias y congestión expliquen los viajes.

### Funcionamiento jugable

1. Cada desplazamiento tiene origen, destino, motivo, horario probable, modo, tiempo esperado y costo. Los ciudadanos pueden elegir caminar, bicicleta, auto, autobús, tranvía, tren o metro según disponibilidad y costo generalizado.
2. La elección modal considera tiempo total **puerta a puerta**: caminata, espera, viaje, transbordo y estacionamiento. Un metro veloz pero inaccesible puede perder frente al autobús.
3. Las vías tienen carriles, capacidad, velocidad, cruces, semáforos, pendientes, carga pesada permitida y deterioro. Cambiar una intersección afecta flujos cercanos; no hay capacidad infinita por aumentar la categoría vial.
4. Las líneas de transporte requieren trazado, paradas/estaciones, unidades, frecuencia, capacidad, tarifas, personal, depósito, mantenimiento, energía o combustible y presupuesto operativo.
5. Los autobuses sufren la congestión salvo que haya carriles exclusivos; los trenes requieren vías, señalización, estaciones, mantenimiento, cruces o pasos a distinto nivel.
6. Metro y ferrocarril exigen adquisición de suelo, túneles/viaductos, obra civil prolongada, equipamiento, pruebas y habilitación. Una estación no aparece operativa con solo marcar una parada.
7. El transporte de cargas posee rutas, centros de transferencia, horarios, toneladas y capacidad de descarga; puede usar camión, tren, barco o avión cuando existe infraestructura correspondiente.
8. El estacionamiento ocupa suelo, genera circulación de búsqueda y puede tener precio. Las políticas de estacionamiento inciden en demanda de auto y comercio local.
9. **Demanda inducida:** ampliar carriles puede reducir congestión inicialmente y atraer nuevos viajes después; ninguna autopista debe mejorar el tráfico global para siempre por una bonificación fija.
10. Accidentes, mantenimiento y obras imponen desvíos; el jugador puede coordinar fases de construcción para reducir perjuicios.
11. Medir viajes realizados, viajes no satisfechos, tiempo promedio/percentiles, accesibilidad a empleo, emisiones, carga vehicular y ocupación del transporte.

### Decisiones

- Comparar corredor BRT, tren de superficie o metro por costo total de inversión/operación, demanda y plazo.
- Elegir tarifa del transporte y subsidio, asumiendo impactos en uso y presupuesto.
- Restringir camiones en ciertos horarios o invertir en acceso industrial separado.

### Tareas para la IA

- [ ] Implementar elecciones de modo sensibles a cobertura, frecuencia, tiempo y costo.
- [ ] Hacer que la frecuencia dependa de flota, personal y recursos efectivamente disponibles.
- [ ] Incorporar trenes/metros con obra e inspección completas, capacidad y transbordos.
- [ ] Separar flujos de viajeros y mercancías, con ocupación física compartida de corredores cuando aplique.
- [x] Mostrar paradas reales con apertura de puertas y embarque/desembarque basado en la demanda de pasajeros simulada.
- [x] Representar el acceso peatonal a viajes en colectivo y la llegada a los edificios de origen y destino según las rutinas existentes (Alfa 0.268; visual, sin cambiar la demanda ni los tiempos simulados).
- [x] Representar el estacionamiento temporal junto a destinos de trabajo y visita usando viajes en auto reales y límites visuales de ocupación (Alfa 0.269; solo visual).
- [x] Animar la llegada de trenes a estaciones operativas con pasajeros en andenes y descensos hacia la calle, condicionados por el servicio y la demanda existentes (Alfa 0.269; solo visual).
- [x] Ampliar las celdas 50% y los modelos del mundo 3D 35%, conservando selección, cámara y coordenadas de juego (Alfa 0.270; base espacial para incorporar más categorías viales).
- [x] Ensanchar las calles con veredas, un carril de circulación por sentido y una franja de estacionamiento junto a cada vereda; animar la entrada en reversa y la salida de los autos estacionados (Alfa 0.271; visual, sin cambiar la economía).
- [x] Asignar espacios de estacionamiento físicos de calles y garajes a los viajes; la falta de plazas añade búsqueda y los garajes municipales cobran solo por su ocupación pico (Alfa 0.272).
- [x] Permitir configurar sentido único, carril de autobús y restricción de camiones por tramo; las rutas de autos, colectivos y carga obedecen las reglas y muestran la dirección en el mapa (Alfa 0.272).

### Criterios de aceptación

- [ ] Una línea de metro construida sin trenes o energía no mueve pasajeros.
- [ ] Mejorar frecuencia de una línea útil aumenta usuarios, pero también gastos operativos.
- [ ] Un área industrial aislada por ruta saturada pierde competitividad aunque tenga depósitos llenos.

---

## FASE 23 — PUERTOS MARÍTIMOS, FLUVIALES Y LOGÍSTICA DE TERMINALES

**Prioridad:** alta en mapas con costa o río navegable; no forzar puertos en ciudades sin acceso al agua. **Depende de:** fases 16, 18, 19 y 22.  
**Objetivo:** desarrollar puertos funcionales que se construyen, operan y conectan con el hinterland regional.

### Funcionamiento jugable

1. El puerto requiere costa adecuada, profundidad de canal, protección ante oleaje, suelo para terminales, acceso vial/ferroviario y permisos ambientales. La geografía define qué tipo de instalación es viable.
2. Tipos de infraestructura: muelles, diques, rompeolas, dragado, grúas, patios de contenedores, silos, depósitos frigoríficos, terminal de graneles y terminal de pasajeros cuando corresponda.
3. Cada terminal define tipos de carga compatibles, capacidad anual y **productividad por hora o jornada**, limitadas por puestos de atraque, grúas, turnos laborales y espacio de almacenamiento.
4. Las embarcaciones llegan según contratos comerciales, demanda de carga, rutas disponibles, calado y fiabilidad del puerto. No aparecen barcos a intervalos arbitrarios independientemente de las mercancías.
5. La carga atraviesa etapas: solicitud de atraque → espera → amarre → descarga/carga → inspección/gestiones → traslado a patio/depósito → salida por carretera/ferrocarril.
6. Los cuellos de botella generan colas y costos: camiones, trenes, grúas, acceso al canal o patios llenos. Ampliar un muelle no resuelve automáticamente una autopista saturada.
7. Dragado, sedimentación, mantenimiento de grúas, seguridad, incendios, contaminación de agua, ruido y emisiones representan costos y riesgos operativos.
8. La competencia con otros puertos regionales influye en volumen de carga, precios y acuerdos; un puerto sobredimensionado puede perder dinero por baja utilización.
9. Las terminales de pasajeros/cruceros requieren control de flujos de visitantes y conexión a la oferta turística urbana; los visitantes generan demanda, pero también congestión y residuos.
10. Las obras portuarias se ejecutan por contratos y etapas (dragado, pilotes, muelles, equipos, pruebas), con calendarios más largos y riesgos geotécnicos.

### Indicadores y decisiones

- Indicadores: toneladas y contenedores por período, ocupación de atraques, tiempo medio de espera, capacidad de patio, costo por tonelada, resultado operativo, empleos, emisiones.
- Decidir entre ampliar depósitos o mejorar acceso ferroviario, especializarse en contenedores/graneles, modificar tarifas, profundizar canal o restringir operaciones ruidosas.

### Tareas para la IA

- [ ] Crear cadena completa mercancía → terminal → almacenamiento → transporte → cliente con cantidades conservadas.
- [ ] Exigir profundidad/accesos y obras previas para habilitar muelles.
- [ ] Implementar colas y productividad limitada, además de costos y mantenimiento.
- [ ] Conectar puertos con exportación/importación y mercado laboral.

### Criterios de aceptación

- [ ] Un puerto sin conexión terrestre puede recibir carga pero se congestiona al no poder evacuarla.
- [ ] Instalar una grúa mejora capacidad solo si existen atraques, energía, personal y demanda suficientes.
- [ ] Un puerto sobredimensionado puede operar con pérdidas pese a contar con infraestructura magnífica.

---

## FASE 24 — AEROPUERTOS Y REDES AÉREAS QUE FUNCIONAN DE VERDAD

**Prioridad:** alta para grandes ciudades y polos turísticos; opcional según escala. **Depende de:** fases 16, 19, 21 y 22; se conecta con la fase 25 cuando esta esté disponible.  
**Objetivo:** convertir los aeropuertos en grandes inversiones logísticas y de transporte, no en edificios de pasajeros instantáneos.

### Funcionamiento jugable

1. La ciudad necesita una superficie apta: relieve, vientos predominantes, obstáculos, ruido, accesos, suelo y restricciones ambientales; el costo de expropiaciones y reasentamientos es significativo.
2. Componentes separados: pista, calles de rodaje, plataforma, terminal, estacionamientos, carga aérea, combustible, torre/servicios de control, equipos de emergencia y conexión a la ciudad.
3. Construcción obligatoria por etapas: adquisición/terraplenado → drenaje → pavimento y señalización → terminal/equipos → inspección de seguridad → pruebas operativas → habilitación gradual.
4. La demanda de pasajeros depende de población, ingresos, turismo, conexiones regionales, precio aproximado y atractivo de destinos. Una terminal de lujo no crea viajeros automáticamente.
5. Las aerolíneas ficticias eligen abrir rutas según demanda probable, costos de escala, tasas y competencia. Pueden cancelar rutas que pierden dinero.
6. El aeropuerto tiene límites distintos: movimientos por hora, puestos de plataforma, pasajeros por terminal, procesamiento de equipaje, seguridad y acceso terrestre. Mejorar uno de ellos no resuelve todos.
7. Las demoras surgen por meteorología, saturación de pista/terminal, mantenimiento, falta de personal o fallas de equipamiento. No representar averías como eventos sin explicación.
8. El acceso al aeropuerto es parte de su desempeño: congestión en la entrada, autobuses insuficientes o ausencia de tren empeoran la experiencia y reducen demanda captada.
9. La carga aérea acepta mercancías de alto valor o urgentes con costo elevado; no reemplaza económicamente al transporte marítimo de materiales a granel.
10. Ruido, emisiones, ocupación territorial y crecimiento periférico producen conflictos urbanos persistentes. El jugador puede restringir operaciones nocturnas, invertir en mitigación o ampliar a costa del entorno.
11. El aeropuerto debe registrar contratos, ingresos por tasas/servicios/comercio y costos de seguridad, limpieza, mantenimiento, personal, deuda y renovación de pistas.
12. Una segunda pista solo es útil con demanda, separaciones y capacidad complementaria compatibles. Su autorización puede ser un proyecto de varios mandatos.

### Indicadores y decisiones

- Pasajeros por período, rutas activas, asientos ofrecidos, movimientos de aeronaves, puntualidad, utilización de pista/terminal, ruido por barrio, resultado operativo y acceso medio.
- Elegir entre terminal regional modesta, ampliación escalonada o megaproyecto; negociar rutas sin garantizarlas; priorizar enlace ferroviario o nueva playa de estacionamiento.

### Tareas para la IA

- [ ] Separar demanda de pasajeros, capacidad de terminal y capacidad de pista.
- [ ] Simular ofertas de rutas con evaluación económica de aerolíneas ficticias.
- [ ] Incorporar habilitación por etapas y operación posterior con gastos.
- [ ] Aplicar impactos de ruido y accesibilidad por sectores reales del mapa.

### Criterios de aceptación

- [ ] Una terminal sin pista habilitada, personal ni rutas no genera pasajeros.
- [ ] Construir una pista adicional sin necesidad no produce beneficios mágicos y aumenta mantenimiento.
- [ ] Una mejora ferroviaria puede aumentar pasajeros captados sin añadir un solo avión por decreto.

---

## FASE 25 — TURISMO, HOTELES, EVENTOS Y ECONOMÍA VISITANTE

**Prioridad:** alta después de la economía y la accesibilidad. **Depende de:** fases 17, 20, 22; se potencia con 23 y 24.  
**Objetivo:** incorporar visitantes reales, alojamiento, estacionalidad y efectos sobre la ciudad.

### Funcionamiento jugable

1. Distinguir turistas de un día, visitantes alojados, viajeros de negocios y pasajeros en tránsito. Cada segmento usa distintos transportes, servicios y presupuestos.
2. El atractivo depende de patrimonio, costa, naturaleza, seguridad, calidad urbana, accesibilidad, precios, cultura, actividades y reputación. Un parque pequeño no convierte a toda la ciudad en destino internacional.
3. Los hoteles son **negocios privados**: sus desarrolladores evalúan demanda, financiamiento, precio del suelo, construcción, tarifas, costos de personal y rentabilidad antes de edificarlos.
4. Un hotel exige licencia, obra, equipamiento, agua, energía, limpieza, suministros y empleados. Puede tener habitaciones fuera de servicio, ocupación parcial o cerrar por pérdidas.
5. La demanda se mueve por temporadas, fines de semana, eventos, clima y economía regional. La ocupación sube y baja; las camas vacías cuestan dinero.
6. Crear equipamientos turísticos requiere planificación: paseo costero, museo, centro de congresos, estadio, feria o reserva natural. También necesitan mantenimiento y acceso.
7. Los visitantes consumen hospedaje, comida, transporte, comercios y ocio; el dinero llega primero a empresas que venden servicios, y el municipio obtiene ingresos solamente por tributos/tasas aplicables.
8. Los impactos negativos son medibles: alquiler temporal que reduce vivienda disponible, precios al alza, ruido, basura, presión sobre agua, saturación de transporte y empleo estacional.
9. Los grandes eventos requieren organización, prevención, limpieza, transporte adicional y capacidad sanitaria; pueden dejar déficit si el costo público supera los beneficios captados.
10. La ciudad puede optar por turismo de masas, de naturaleza, cultural, de congresos o equilibrado. Cada estrategia modifica inversiones, estacionalidad y externalidades.
11. Los cruceros y vuelos solo suman visitantes si las terminales existen y las rutas/servicios son viables; no se duplica población residente al llegar un barco.

### Indicadores y decisiones

- Llegadas por origen/modo, pernoctaciones, plazas hoteleras, ocupación, gasto estimado, empleo, contribución fiscal neta, presión sobre vivienda y servicios.
- Decidir cupos o regulación de alquiler temporario, apoyo a eventos, inversión patrimonial, promoción turística y medidas de convivencia.

### Tareas para la IA

- [ ] Simular flujo de visitantes separado de residentes y su gasto económico.
- [ ] Incorporar hoteles con inversión privada, plazos de obra, ocupación y costos.
- [ ] Crear temporadas y eventos con demanda condicionada y costos logísticos.
- [ ] Mostrar beneficios y perjuicios del turismo por distrito, no solo un indicador agregado.

### Criterios de aceptación

- [ ] Un hotel construido en una ciudad poco atractiva puede mantenerse vacío y quebrar.
- [ ] Una feria importante aumenta visitas durante un período limitado y requiere servicios adicionales.
- [ ] El turismo excesivo puede mejorar ingresos y simultáneamente empeorar alquileres y congestión.

---

## FASE 26 — REDES DE SERVICIOS COMPLETAS Y SEGURIDAD DE SUMINISTRO

**Prioridad:** máxima en ciudades densas. **Depende de:** fases 6, 18, 19, 22 y 27 para riesgos climáticos.  
**Objetivo:** dejar atrás los radios de cobertura mágicos y simular capacidad, flujo, demanda variable y vulnerabilidad de redes urbanas.

### Funcionamiento jugable

1. **Electricidad:** fuentes de generación local, compra externa, potencia disponible, picos de demanda, subestaciones, líneas de distribución, cortes, pérdidas técnicas simplificadas y respaldo para instalaciones críticas.
2. **Agua potable:** fuente, potabilización, almacenamiento, bombeo, troncales, presión/capacidad simplificada, conexiones domiciliarias y consumo distinto por hogares, industria y turismo.
3. **Cloacas y tratamiento:** caudal generado, capacidad de colectores, estaciones elevadoras, planta depuradora, vertido tratado y consecuencias sanitarias/ambientales del rebalse.
4. **Drenaje pluvial:** superficie impermeable, lluvia, capacidad de sumideros/canales, lagunas de retención y zonas anegables. No confundir agua potable, cloacas y pluviales como una sola red.
5. **Residuos:** generación por tipo de actividad, recolección según flota y turnos, contenedores, transferencia, reciclado, disposición final y capacidad/costos. Un vertedero no tiene almacenamiento infinito.
6. **Gas o calefacción urbana (si existe en escenario):** suministro, capacidad de red y seguridad, con alternativa eléctrica; nunca obligatorio para todas las ciudades.
7. **Conectividad digital/telecomunicaciones:** infraestructura, cobertura útil, capacidad y costo para empresas/vecinos. Su falla afecta servicios que dependan de ella, no una penalización universal arbitraria.
8. **Dependencias cruzadas:** un apagón puede parar bombeo; una inundación puede dañar subestaciones; una avería de la planta de agua puede causar problemas sanitarios que eleven demanda hospitalaria.
9. Hay consumo diario y estacional: verano con mayor demanda de energía/agua; temporada turística con más residuos; industrias de alto consumo y grandes pérdidas si se corta suministro.
10. El municipio puede ampliar, mantener, redundar, reparar, gestionar demanda y establecer tarifas/subsidios. Una planta nueva tarda en construirse y necesita operadores capacitados.
11. Las pérdidas, fugas, instalaciones ilegales y mantenimiento diferido aumentan la ineficiencia. Una red vieja puede funcionar, pero con mayor riesgo y gasto.
12. Medir **capacidad instalada, capacidad utilizable, demanda media, pico, pérdidas, fiabilidad, población afectada y costo total**. No premiar sobrecapacidad ilimitada.

### Decisiones

- Construir una nueva planta o reducir pérdidas de la red existente.
- Instalar respaldo en hospitales antes de un pico de consumo.
- Ampliar tratamiento de aguas o restringir temporalmente industrias contaminantes.

### Tareas para la IA

- [ ] Distinguir capacidad, cobertura, caudal/carga, fiabilidad y operación por red.
- [ ] Crear eventos encadenados con impactos limitados y rastreables.
- [ ] Añadir mantenimiento preventivo, reparación y renovación de tramos.
- [ ] Mostrar balances por unidad física: MW/MWh, m³/día, toneladas/día, etc., donde corresponda.

### Criterios de aceptación

- [ ] Un barrio conectado puede recibir servicio insuficiente si la demanda excede capacidad.
- [ ] Reparar una fuga reduce pérdida de agua pero no aumenta mágicamente capacidad de tratamiento.
- [ ] Un apagón sin respaldo puede afectar bombeo y hospitales en el área dependiente.

---

## FASE 27 — CLIMA, HIDROLOGÍA, DESASTRES Y RESILIENCIA URBANA

**Prioridad:** alta en mapas vulnerables. **Depende de:** fases 10, 13, 16, 19 y 26.  
**Objetivo:** que los riesgos físicos sean parcialmente previsibles, diferenciados por territorio y modificables mediante decisiones de planificación.

### Funcionamiento jugable

1. Cada región define patrones climáticos y peligros compatibles con su geografía. **No introducir terremotos, tornados, sequías, huracanes o nevadas en todos los mapas indistintamente.**
2. Las lluvias se convierten en escorrentía según intensidad, pendiente, suelo absorbente, pavimento y capacidad pluvial. Los ríos aumentan caudal y pueden desbordarse; la topografía delimita daños.
3. Sequías afectan fuentes de agua, agricultura, vegetación y demanda de riego. Olas de calor elevan consumo eléctrico, demanda sanitaria y riesgo de incendio, sobre todo en barrios vulnerables.
4. Tormentas fuertes, vientos, heladas o nieve pueden cortar transporte, afectar obras, causar interrupciones de servicios y aumentar costos de mantenimiento según infraestructura disponible.
5. Las infraestructuras poseen exposición, vulnerabilidad y redundancia. Un hospital sobre zona inundable y sin energía de respaldo es más frágil que uno situado en terreno elevado y con equipos adecuados.
6. Toda amenaza tiene, cuando sea plausible, información previa con incertidumbre: pronóstico, mapa de exposición, inspecciones y recomendaciones. Los episodios excepcionales pueden ser difíciles de prever, pero no injustificadamente inevitables.
7. El jugador puede ejecutar drenajes, defensas costeras, áreas absorbentes, restauración de humedales, arbolado, alertas, refugios, centros de emergencia, protocolos y seguros/ayudas donde existan.
8. Una protección mitiga, no elimina universalmente el riesgo: un dique puede desplazar agua a otro distrito o resultar insuficiente ante un fenómeno mayor.
9. Los daños distinguen víctimas/afectados simulados, viviendas inhabitables, pérdida de inventario, deterioro vial, reparaciones de servicios, interrupciones empresariales y desplazamiento temporal de hogares.
10. Después del desastre se requieren evaluación, limpieza, obras de reparación, financiación y recuperación social. El daño no desaparece automáticamente cuando termina la lluvia.
11. El cambio climático puede modelarse en partidas de décadas como **evolución gradual de riesgos regionales**, evitando transformar cada año en una catástrofe por puro azar.
12. Una respuesta política acertada mejora confianza de manera proporcional; una tragedia grande no siempre indica mala gestión si hubo preparación adecuada, información e intervención efectiva.

### Decisiones

- Proteger un barrio inundable con obras costosas o reubicar gradualmente hogares expuestos.
- Conservar humedales a costa de limitar urbanización rentable.
- Gastar en prevención hoy o asumir mayores costos esperados en futuros episodios.

### Tareas para la IA

- [ ] Generar mapas legibles de exposición y vulnerabilidad por barrio.
- [ ] Relacionar riesgo efectivo con peligro, suelo, activos construidos y medidas de protección.
- [ ] Implementar pronóstico, preparación, incidente, respuesta y recuperación.
- [ ] Calcular pérdida económica y disrupción de servicios sin borrar activos al instante por una tirada aleatoria.
- [x] Vincular la intensidad y dirección del viento visual con la estación y la lluvia; animar vegetación, hojas, banderas, humo y agua.

### Criterios de aceptación

- [ ] Una misma tormenta afecta distinto a dos barrios con drenajes y pendientes diferentes.
- [ ] Una defensa mal ubicada puede reducir daños localmente y agravarlos aguas abajo.
- [ ] La reconstrucción necesita contratos, tiempo, materiales y presupuesto.

---

## FASE 28 — SALUD, EDUCACIÓN, SEGURIDAD Y PROTECCIÓN SOCIAL PROFUNDAS

**Prioridad:** alta. **Depende de:** fases 5, 9, 21, 26 y 27.  
**Objetivo:** convertir los servicios sociales en instituciones con personal, especialidades, demanda y resultados medibles.

### Funcionamiento jugable

1. **Salud:** separar atención primaria, emergencias, especialidades y hospitalización; cada centro dispone de médicos, enfermería, ambulancias, turnos, camas, insumos y capacidad diagnóstica según su tipo.
2. La demanda sanitaria varía con población, edades, contaminación, clima, lesiones y enfermedades ficticias agregadas; evitar representar individuos con diagnósticos sensibles innecesarios.
3. La accesibilidad se calcula por tiempo de viaje y posibilidad real de atención. Un hospital lleno no cubre a todos por encontrarse a pocos kilómetros.
4. **Educación:** infancia y jóvenes ocupan plazas en jardines/escuelas; docentes y aulas determinan grupos y calidad. Secundaria, técnica y educación superior forman habilidades a mediano/largo plazo.
5. La expansión de una escuela requiere proyecto y obra; los docentes, materiales y servicios se contratan/financian de forma independiente.
6. **Bomberos y emergencias:** dotaciones con turnos, equipos, ambulancias, estaciones, combustible y tiempos de llegada. La capacidad puede estar ocupada atendiendo otro incidente.
7. **Seguridad pública:** atención de incidentes, prevención territorial, patrullaje y medidas urbanas; no reducir criminalidad a un simple radio mágico, ni vincular delitos de forma determinista con grupos sociales protegidos.
8. **Servicios sociales:** asistencia a hogares desplazados, personas sin vivienda, adultos mayores y familias vulnerables mediante programas medibles en costo, capacidad y resultados.
9. **Salud ambiental:** agua insegura, contaminación, calor y residuos elevan riesgos y demanda de servicios, dando valor real a inversiones preventivas.
10. Las prioridades generan trade-offs: reforzar atención primaria puede evitar hospitalizaciones futuras, pero no reemplaza cirugías; aumentar patrullaje no sustituye buen alumbrado y espacio público mantenido.
11. Medir listas de espera, cobertura efectiva, ocupación, tiempos de respuesta, resultado educativo, abandono escolar, personal faltante, equidad distrital y costo por usuario atendido.

### Tareas para la IA

- [ ] Incorporar al menos dos niveles de complejidad en salud y educación.
- [ ] Relacionar accesibilidad, trabajadores, instalaciones y presupuesto con resultados.
- [ ] Permitir ampliar una institución existente y comparar con construir otra.
- [ ] Mostrar demanda insatisfecha diferenciada por barrio y grupo etario simulado.

### Criterios de aceptación

- [ ] Un hospital nuevo sin médicos no reduce listas de espera.
- [ ] Un colegio saturado puede mejorar al contratar docentes solo mientras existan aulas suficientes.
- [ ] Mejorar agua potable puede disminuir demanda sanitaria con demora coherente.

---

## FASE 29 — HACIENDA MUNICIPAL, DEUDA, CRÉDITO Y PLANIFICACIÓN PLURIANUAL

**Prioridad:** máxima para administración realista. **Depende de:** fases 8, 17, 19, 21 y 26.  
**Objetivo:** que una ciudad pueda crecer, endeudarse, invertir y entrar en crisis con una contabilidad municipal entendible y consistente.

### Funcionamiento jugable

1. Diferenciar **caja**, ingresos devengados, cobros efectivamente recibidos, gastos comprometidos, pagos realizados, inversiones en curso, mantenimiento diferido y deuda. No tratar dinero prometido como dinero disponible.
2. El presupuesto desglosa gastos de personal, servicios, mantenimiento, subsidios, transferencias, intereses, amortización e inversión de capital. Las constructoras reciben desembolsos vinculados con contratos.
3. Los ingresos se sustentan en bases económicas observables: valuación inmobiliaria, actividad comercial, tasas por servicios y transferencias, con morosidad y recaudación efectiva.
4. Las alícuotas fiscales tienen efectos graduales sobre contribuyentes distintos. Subir recaudación demasiado puede reducir actividad, aumentar incumplimientos o desplazar demanda según contexto.
5. La deuda define capital, tasa, plazo, calendario de servicio, condiciones y riesgo de refinanciación. Un nuevo préstamo no produce riqueza: adelanta capacidad de gasto y genera obligaciones.
6. Los proyectos grandes necesitan **costo del ciclo de vida**: diseño, adquisición de suelo, obra, equipamiento, operación, mantenimiento, renovación y cierre; priorizar costo inicial bajo puede salir más caro.
7. Planificación plurianual: metas y obras a 1, 4, 10 y 20 años, con previsiones por escenarios de población, inflación ficticia, salarios, recaudación y demanda de servicios.
8. Establecer fondos de reserva para emergencias, mantenimiento y obligaciones previsibles, con costos de oportunidad por capital inmovilizado.
9. Ingresos extraordinarios (venta de tierras, ayudas puntuales, transferencias) no deben considerarse permanentes para financiar nóminas estructurales sin advertencia.
10. Permitir concesiones o asociaciones público-privadas con pagos futuros, tarifas, reparto de riesgo y posibilidad de fallos contractuales; no presentar financiación privada como gratis.
11. La inversión territorial produce beneficios económicos y sociales indirectos, pero la relación entre costo y recaudación adicional debe explicarse y tardar en manifestarse.
12. Introducir calificación de solvencia ficticia y restricciones suaves de crédito según capacidad de pago; si la tesorería entra en peligro, ofrecer reprogramación, austeridad, ingresos y ayuda extraordinaria con contrapartidas.
13. Mantener una conciliación: **caja final = caja inicial + cobros − pagos**; obligaciones comprometidas no desaparecen por cambiar de mandato.

### Decisiones

- Financiar el aeropuerto con deuda o invertir primero en agua y transporte.
- Subir impuestos, reducir gasto operativo o posponer un proyecto antes de caer en insolvencia.
- Contratar obra barata de alta mantención o una más cara con mejor costo total de vida útil.

### Tareas para la IA

- [ ] Mostrar caja, compromisos, deuda, déficit, flujo de efectivo y proyección de 12/48 meses.
- [ ] Hacer auditoría de entradas y salidas de fondos para impedir generación o duplicación de dinero.
- [ ] Incorporar presupuestos plurianuales y prioridades por programa.
- [ ] Calcular costo total de ciclo de vida antes de aprobar infraestructuras grandes.
- [ ] Incluir escenarios optimista, base y adverso, con supuestos explícitos.

### Criterios de aceptación

- [ ] Una obra iniciada con caja disponible puede provocar insolvencia futura si no se contemplan pagos y operación.
- [ ] Refinanciar deuda alivia caja inmediata pero puede aumentar costo total.
- [ ] La recaudación no crece sin que cambien bases imponibles, tasas o cumplimiento.

---

## FASE 30 — BARRIOS HISTÓRICOS, PATRIMONIO Y EVOLUCIÓN ARQUITECTÓNICA

**Prioridad:** alta para partidas de varias décadas. **Depende de:** fases 4, 16, 20 y 25.  
**Objetivo:** que los barrios tengan historia material, valor cultural y transformación gradual en lugar de reemplazarse por edificios modernos cada cierto tiempo.

### Funcionamiento jugable

1. Cada edificio registra **año de construcción, estilo/arquetipo, uso original, reformas, estado de conservación, relevancia patrimonial y ocupación**. Su apariencia histórica es coherente con su período y contexto urbano.
2. La arquitectura evoluciona por **épocas urbanas** propias del universo del juego: fundación, expansión industrial, modernización, densificación y renovación contemporánea. No asignar estilos reales de una ciudad específica de forma obligatoria.
3. Los desarrolladores eligen proyectos compatibles con época, demanda, materiales y regulación; edificios nuevos no sustituyen por arte de magia todo el tejido antiguo.
4. Un barrio puede conservar casas antiguas, sumar locales en plantas bajas, reconvertir fábricas en viviendas o experimentar sustitución por torres si el mercado y las normas lo permiten.
5. El patrimonio se clasifica por niveles: inventariado, protección parcial, protección integral, entorno de valor. Alteraciones tienen permisos, costos y alternativas; la conservación no equivale a prohibir toda mejora.
6. Los edificios protegidos pueden necesitar refuerzos, accesibilidad universal, eficiencia energética e instalaciones modernas. Restaurar requiere constructoras especializadas, materiales y tiempo.
7. Un inmueble histórico deteriorado puede cerrar por seguridad; protegerlo sin financiar mantenimiento puede producir abandono. La preservación compite con otras necesidades municipales reales.
8. El valor cultural incide sobre identidad local, bienestar, turismo y atractivo, pero no compensa automáticamente falta de vivienda, servicios o empleo.
9. Las transformaciones grandes pueden causar **desplazamiento por aumento de alquileres**; preservar fachada no garantiza conservar residentes. Introducir intervenciones de alquiler, vivienda asequible o rehabilitación con condiciones sociales.
10. La ciudad conserva huellas de su historia: antiguas vías férreas, zonas industriales recicladas, ampliaciones sucesivas, monumentos y barrios surgidos alrededor de infraestructuras.
11. Los mapas de barrio permiten comparar fotografías/mapas urbanos ficticios de décadas pasadas y estadísticas de uso, densidad, precios y población.

### Decisiones

- Restaurar mercado histórico o construir uno nuevo en otra zona.
- Proteger la trama de calles antigua frente a una avenida rápida.
- Reconversión industrial con mezcla de vivienda y cultura, acompañada de mitigación social.

### Tareas para la IA

- [ ] Añadir antigüedad, reformas y estado de conservación a inmuebles.
- [ ] Crear cambios arquitectónicos graduales condicionados por demanda y normativa.
- [ ] Permitir protección, restauración, reconversión y demolición, con costos y efectos diferentes.
- [ ] Registrar eventos históricos significativos en cada distrito, con consecuencias persistentes.

### Criterios de aceptación

- [ ] Un barrio de 80 años conserva parte reconocible de su tejido si no fue demolido.
- [ ] La restauración patrimonial requiere inversión y no elimina por sí sola la pobreza del barrio.
- [ ] La reconversión de una fábrica cambia su uso y empleo, pero mantiene costos de adaptación y efectos sobre residentes.

---

## FASE 31 — CICLO DE VIDA, MANTENIMIENTO, DEGRADACIÓN Y REHABILITACIÓN

**Prioridad:** máxima desde los primeros mandatos; profundizar en esta fase. **Depende de:** fases 2, 6, 10, 19, 20 y 29.  
**Objetivo:** hacer que lo construido siga costando recursos y envejezca de forma físicamente verosímil.

### Funcionamiento jugable

1. Cada activo —calle, puente, planta, red, escuela, edificio privado, puerto, aeropuerto— posee condición estructural, condición funcional, edad, capacidad, última inspección y plan de mantenimiento.
2. Distinguir **mantenimiento rutinario, preventivo, correctivo, rehabilitación mayor y sustitución**. Cada intervención tiene costo, plazo, recursos necesarios y posible cierre parcial.
3. El desgaste depende de edad, intensidad de uso, clima, calidad original, cargas y trabajos anteriores. Evitar que todo edificio pierda exactamente 1% de condición mensual.
4. La falta de mantenimiento eleva riesgo de fallo y costo esperado de reparación, pero no causa colapso instantáneo y universal al llegar a un porcentaje arbitrario.
5. Los activos críticos deben superar inspecciones periódicas. Fallos de seguridad pueden exigir reducir aforo, velocidad, carga o suspender operación hasta reparar.
6. Las viviendas y comercios privados también requieren reinversión; si propietarios no pueden financiarla, se deterioran, pierden ocupación, caen alquileres o se clausuran.
7. Las obras inconclusas se degradan si quedan expuestas. Su rescate exige inspección de estructura existente y presupuesto para terminar o corregir trabajos.
8. El jugador debe decidir entre mantener infraestructuras viejas, restaurarlas o construir reemplazos, comparando costo anual equivalente, capacidad, impacto territorial y perturbaciones.
9. **Planes anuales de mantenimiento** con prioridades de seguridad, servicio y costo. Una cartera de activos mal mantenida genera pasivos acumulados que pueden consumir futuros presupuestos.
10. Las reparaciones pueden cortar calles, reducir caudal, cerrar aulas y reordenar transporte, con posibilidad de programar trabajos en horas o temporadas de menor demanda.
11. Reportar inventario de activos, condición, inspecciones vencidas, presupuesto requerido, retrasos críticos, vida útil estimada y pérdidas por interrupciones.

### Tareas para la IA

- [ ] Crear estados y reglas de degradación diferenciados por tipo de activo.
- [ ] Distinguir mantenimiento corriente de rehabilitación y reemplazo.
- [ ] Incorporar inspecciones y restricciones temporales por seguridad.
- [ ] Permitir rescatar estructuras abandonadas con diagnóstico técnico.
- [ ] Introducir presupuesto plurianual de mantenimiento en todos los grandes proyectos.

### Criterios de aceptación

- [ ] Una calle muy usada y mal mantenida se deteriora más que una poco transitada bien conservada.
- [ ] Reparar una estación obliga a planificar cierres o pérdida parcial de capacidad.
- [ ] Un activo antiguo puede seguir funcionando si se mantiene y moderniza adecuadamente.

---

## FASE 32 — GOBIERNO MUNICIPAL, ORDENAMIENTO Y CONFIANZA CIUDADANA

**Prioridad:** alta para la evaluación del gobierno, pero subordinada a urbanismo y gestión. **Depende de:** fases 8, 11, 12, 16, 21 y 29.  
**Objetivo:** profundizar las decisiones administrativas sin convertir Ciudad Viva en un juego de política partidaria.

### Funcionamiento jugable

1. El gobierno del jugador define un **plan municipal** por mandato: prioridades de obras, servicios, presupuesto, ordenamiento, patrimonio y objetivos mensurables.
2. Diferenciar decisiones que puede tomar directamente el alcalde de medidas que requieren evaluación técnica, consulta o aprobación administrativa ficticia. Los procedimientos consumen tiempo, capacidad de personal y recursos; nunca deben ser burocracia repetitiva sin utilidad.
3. Los ciudadanos presentan reclamos localizados: corte de luz, tráfico, basura, ruido, alquileres, escuela saturada, riesgo de inundación. Cada reclamo está vinculado a un problema verificable.
4. El equipo puede realizar audiencias para grandes proyectos. La consulta aporta información sobre impactos, permite ajustes y modifica confianza, pero no sustituye evidencia técnica ni garantiza consenso universal.
5. La confianza depende de calidad del servicio, cumplimiento de promesas, transparencia presupuestaria, tratamiento de barrios vulnerables, gestión de crisis y respuesta a reclamos.
6. Distinguir **satisfacción con el barrio**, **aprobación del gobierno** e **intención de voto**. El entorno económico regional también influye, de modo que no todo resultado positivo o negativo se atribuye por completo al alcalde.
7. Las elecciones se mantienen cada cuatro años y evalúan resultados acumulados, promesas y expectativas. No introducir campañas, ideologías ni minijuegos electorales como actividad dominante.
8. El voto se calcula por distritos sobre personas habilitadas con diferencias demográficas razonables y pequeñas variaciones de incertidumbre; nunca basarlo en una única barra global.
9. Crisis prolongadas pueden iniciar mecanismos extraordinarios de destitución con alertas, procedimientos y posibilidad de recuperación, según las reglas ya definidas.
10. Si el partido del equipo pierde o es destituido, **la derrota es compartida y se cierra la gestión competitiva**. Se conserva la opción de observar la ciudad y revisar decisiones para aprender.
11. Registrar decisiones del equipo (incluidos acuerdos, contratos y cambios de políticas) y atribuir resultados sin penalizar a todos por un clic aislado no representativo.
12. Incorporar conflictos legítimos entre objetivos: construir vivienda puede chocar con protección de humedal; puerto y empleo con contaminación; turismo con alquileres; conservación con densificación.

### Decisiones

- Rediseñar un proyecto tras una audiencia vecinal o mantenerlo justificando compensaciones.
- Establecer metas de agua, transporte y vivienda con costo y fecha verificables.
- Distribuir inversión entre barrios en vez de maximizar solo aprobación del distrito más rico.

### Tareas para la IA

- [ ] Vincular reclamos, encuestas, aprobación y votos con estados reales del mapa.
- [ ] Implementar al menos tres conflictos de planificación que no tengan una solución perfecta.
- [ ] Exponer causas territoriales de la aprobación y del resultado electoral.
- [ ] Mantener registro de decisiones, promesas y cumplimiento a lo largo de mandatos.

### Criterios de aceptación

- [ ] Una audiencia puede revelar un perjuicio real y permitir mitigarlo antes de la obra.
- [ ] Mejorar un barrio puede recuperar apoyo allí sin borrar problemas de otras zonas.
- [ ] Una ciudad funcional puede ganar elecciones sin realizar acciones políticas desconectadas de la gestión.

---

## FASE 33 — SÍNTESIS, EQUILIBRIO DE LARGO PLAZO Y PARTIDAS DE DÉCADAS

**Prioridad:** cierre de realismo profundo. **Depende de:** las fases anteriores.  
**Objetivo:** demostrar que la ciudad funciona como un sistema interdependiente, con crecimiento, crisis, renovación y decisiones significativas después de muchos mandatos.

### Funcionamiento jugable

1. La simulación debe permitir mantener una ciudad durante varias décadas con cambios demográficos, envejecimiento de activos, transformación inmobiliaria, ciclos económicos y evolución de barrios.
2. El realismo se mide por **consistencia causal** y no por cantidad de indicadores. Cada recurso y flujo importante debe tener origen, destino, límites y costo. No utilizar multiplicadores globales para resolver problemas complejos.
3. Una expansión grande crea costos de suelo, obra, redes, mantenimiento, personal y movilidad; también puede producir más empleo e ingresos futuros, pero no de forma garantizada.
4. Las ciudades compiten por inversiones, habitantes y visitantes con alternativas regionales ficticias. La demanda exterior no es infinita y responde a condiciones del juego.
5. El diseño debe admitir especializaciones distintas: ciudad dormitorio, universitaria, industrial, portuaria, turística, metropolitana o mixta. Ninguna estrategia debe dominar en toda geografía y circunstancia.
6. Los proyectos de varios mandatos continúan operando sin “reinicio político”: deudas, contratos, obras, compromisos, evolución histórica y mantenimiento sobreviven a cada victoria electoral.
7. Las crisis severas deben ser difíciles pero razonablemente recuperables con planificación. Las derrotas electorales continúan siendo el límite competitivo establecido, no un castigo aleatorio por falta de microgestión.
8. La microgestión profunda es **opcional**: el jugador puede fijar políticas y prioridades generales para el trabajo rutinario, conservando capacidad de inspeccionar y modificar decisiones de detalle. La automatización es una función del equipo municipal, no dinero ni mano de obra gratis.
9. Crear herramientas de análisis de decisiones: comparativa antes/después, previsiones con intervalos, costo de ciclo de vida, distribución barrial de beneficios/cargas y causas de indicadores.
10. Las partidas largas deben ofrecer objetivos emergentes de rehabilitación, resiliencia, productividad, vivienda, transporte y patrimonio; no desbloqueos artificiales ni metas triviales de tamaño poblacional.

### Tareas para la IA

- [ ] Ejecutar escenarios de 20–50 años de juego sin duplicación de recursos o crecimiento imposible.
- [ ] Probar una ciudad pequeña, una metropolitana, una portuaria y una turística bajo reglas comunes.
- [ ] Evaluar trayectorias de deuda, empleo, suelo, materiales, demanda, contaminación y mantenimiento.
- [x] Añadir delegación administrativa opcional con presupuesto y consecuencias observables (Alfa 0.77; delegación limitada a propuestas comerciales, resto pendiente).
- [ ] Registrar decisiones que permiten ganar y perder de manera explicable durante mandatos sucesivos.

### Criterios de aceptación

- [ ] Una ciudad de 30 años muestra barrios de diferentes edades, rehabilitaciones, cierres y nuevos negocios.
- [ ] Un aeropuerto y un puerto pueden fracasar por falta de demanda y no por un azar incontrolable.
- [ ] Una crisis de suministros puede propagarse a obras, empleo, servicios y satisfacción, y una respuesta útil puede revertirla gradualmente.
- [ ] Ni el municipio ni las empresas crean dinero, mercancía, población, pasajeros o empleos sin causas identificables.

---

---

# 4. DEPENDENCIAS Y ORDEN REAL DE ENTREGA

**No implementar las 34 fases a la vez.** Priorizar una experiencia vertical completa y después extenderla.

| Entrega | Fases principales | Resultado jugable mínimo | No avanzar hasta que… |
|---|---|---|---|
| **A — Nace una ciudad** | 0–2 | Suelo, accesos, constructora y obra por etapas | Una escuela se construye, inspecciona y abre con gastos reales |
| **B — Demanda e inversión** | 3–5 | Materiales, promotores, hogares y viviendas graduales | No aparecen casas ni residentes sin inversión/demanda/capacidad |
| **C — Operación sostenible** | 6, 8, 9 | Redes, servicios, caja y costos mensuales | Crecer de más provoca saturación y falta de fondos con causas visibles |
| **D — Tránsito y entorno** | 7, 10 | Movilidad, contaminación y calidad barrial | Viajes y redes tienen capacidad y consecuencias territoriales |
| **E — Gestión evaluada** | 11, 12 | Cooperación, aprobación, elecciones y derrota compartida | El equipo pierde o gana por resultados, no azar dominante |
| **F — Simulación jugable estable** | 13–15 | Eventos causales, objetivos, información y balance | Una partida completa es comprensible y rejugable |
| **G — Ciudad y suelo reales** | 16–18 | Catastro, empresas privadas, fábricas y flujos | Propiedad, compras, stocks, producción y competencia tienen límites |
| **H — Obra y vivienda maduras** | 19–21 | Contratos avanzados, abandono, mercado inmobiliario y empleo | Se puede rescatar un edificio inconcluso sin reiniciar ni regalar obra |
| **I — Movilidad a gran escala** | 22 | Trenes/metro, autobuses, carga, frecuencias y transbordos | Los viajes se explican por capacidad, flota, tiempo y costo |
| **J — Plataformas regionales** | 23–25 | Puerto, aeropuerto y turismo con demanda y operación | Un aeropuerto/puerto sobredimensionado puede perder dinero |
| **K — Ciudad resiliente** | 26–28 | Redes profundas, clima, salud/educación/seguridad | Cortes, inundaciones y saturación se propagan por dependencias reales |
| **L — Finanzas e historia urbana** | 29–31 | Deuda plurianual, patrimonio y mantenimiento de activos | Pagar, reformar y sostener la ciudad importa tanto como inaugurar |
| **M — Gobierno y décadas** | 32–33 | Plan municipal, participación, auditoría y partidas de décadas | La ciudad puede atravesar 30 años coherentes y varios mandatos |

**Dependencias que deben tratarse como cimientos:** en las fases 0–15 ya reservar las nociones de caja/compromiso, titularidad pública-privada, unidad física de stock, antigüedad, mantenimiento, ingreso del hogar, empleo y capacidad de transporte; de lo contrario, añadir realismo al final obligaría a rehacer toda la economía. El requisito de jugabilidad del cooperativo se conserva desde el inicio, independientemente del orden en que se pruebe en detalle.

**Orden paralelo permitido:** la interfaz de información de la fase 15 puede crecer en todas las fases. Las reglas de cooperación de la fase 12 deben contemplarse desde el principio aunque su experiencia completa se pruebe en el Hito F.

---

# 5. MECÁNICAS TRANSVERSALES QUE LA IA DEBE RESPETAR

## 5.1. Causa → efecto → demora → información

Cada sistema debe cumplir estas cuatro condiciones:

1. **Causa concreta**: por ejemplo, no hay suficientes trabajadores en una obra.
2. **Efecto lógico**: su avance disminuye.
3. **Demora coherente**: incorporar trabajadores no completa inmediatamente el edificio.
4. **Información visible**: el jugador sabe que faltaba personal y cuánto puede mejorar la obra.

## 5.2. Edificios: separación estricta de estados

- **Planificado**: todavía no consume materiales de construcción.
- **Aprobado**: tiene permisos, pero no necesariamente obra adjudicada.
- **En construcción**: consume tiempo, materiales y capacidad.
- **Terminado**: la obra física concluyó; puede faltar inspección.
- **Habilitado**: legalmente puede funcionar.
- **Operativo**: cuenta con personal, suministros, conexiones y presupuesto.
- **Saturado**: opera, pero no alcanza para toda la demanda.
- **Cerrado**: deja de prestar servicio aunque el edificio exista.

## 5.3. Evitar simulaciones falsas

- No mostrar camiones decorativos si la falta de acceso jamás afecta una obra.
- No permitir construir hospitales infinitos sin costo de operación.
- No llamar «elección» a un lanzamiento de moneda independiente de la gestión.
- No crear demanda inmobiliaria infinita por marcar más zonas.
- No considerar «multijugador cooperativo» a tener varios cursores sin decisiones compartidas.

## 5.4. Tolerancia a errores

- Una decisión mala debe poder corregirse si queda tiempo y presupuesto.
- Deberá haber **advertencias de deterioro** antes de una crisis total.
- Permitir recuperación tras errores moderados; reservar la derrota irreversible a elecciones, destitución o las condiciones explícitas elegidas por el jugador.
- Los cambios profundos —demoliciones, nuevos impuestos, deuda mayor— deben tener un costo de reversión legible.

---

## 5.5. Principios ampliados de realismo (fases 0–33)

Estos principios aplican **desde la primera fase**, aun cuando las fases 16–33 se implementen después.

### 5.5.1. Balances físicos y económicos

| Sistema | Identidad o límite exigido | No permitir |
|---|---|---|
| Tesorería | Caja final = caja inicial + cobros − pagos | Pagar contratos con la misma reserva dos veces |
| Mercancías | Stock final = stock inicial + entradas + producción − salidas − consumo − pérdidas | Exportar más que inventario disponible |
| Vivienda | Hogares alojados ≤ capacidad de unidades habitables ocupables | Generar nuevos residentes sin alojamiento disponible |
| Empresas | Ventas ≤ demanda pagadora atendida y bienes/servicios disponibles | Negocios que ganan dinero sin clientes ni compradores |
| Trabajo | Puestos cubiertos ≤ puestos ofrecidos y trabajadores disponibles/compatibles | Llenar vacantes sin gente o habilidades |
| Obras | Avance depende de tareas, materiales, cuadrillas y accesos | Completar por esperar un reloj si faltan insumos críticos |
| Transporte | Pasajeros/carga transportada ≤ capacidad y flujos disponibles | Mover viajeros por una línea sin vehículos o estaciones |
| Servicios | Entrega efectiva ≤ capacidad operativa utilizable y suministro | Cobertura perfecta con planta apagada |
| Turismo | Visitantes y pernoctaciones dependen de demanda, accesos y plazas | Turistas infinitos por construir hoteles |

### 5.5.2. Capacidad, colas y demanda

Distinguir en todos los sistemas: **demanda potencial → demanda efectiva → capacidad física → capacidad operativa → cantidad efectivamente atendida → espera/rechazos**. Ejemplos: terminal aérea con muchas plazas pero pocas rutas, hospital con camas pero sin profesionales, puerto con grúas pero patio lleno y escuela con aulas pero sin docentes.

### 5.5.3. Costos de ciclo de vida y plazos

Una decisión de construir debe incluir: suelo, proyecto, permisos, contratación, etapa de obra, equipamiento, puesta en marcha, personal, insumos, mantenimiento, rehabilitación, cierre y deuda aplicable. El plazo estimado se da como **rango** si existen riesgos. Modificar un proyecto en ejecución no restituye materiales ni tiempos gastados.

### 5.5.4. Propiedad y responsabilidades

- **Municipio:** paga y opera lo de titularidad pública, o subsidia aquello que expresamente financia.
- **Empresa privada:** financia sus locales, su producción y sus construcciones con caja o crédito propio; puede recibir contratos o incentivos municipales transparentes.
- **Ciudadanos/hogares:** tienen ingresos, gastos, movilidad y decisiones residenciales; no pueden comprar vivienda o consumir de manera ilimitada.
- **Otros actores regionales:** proveedores, turistas, empresas y administraciones ficticias pueden introducir flujos, pero cada flujo debe explicarse.

### 5.5.5. Precisión sin convertirlo en un simulador imposible

Para mapas enormes puede representarse a la población en **hogares o grupos estadísticos** que conservan la consistencia de empleo, vivienda, viajes y demanda; no es obligatorio tener un personaje animado individual por cada ciudadano. Lo irrenunciable es que las decisiones agregadas produzcan consecuencias coherentes y territorialmente diferenciadas. No ocultar aproximaciones cuando el jugador consulte un diagnóstico.

### 5.5.6. Niveles de intervención del jugador

- **Estratégico:** presupuesto, ordenamiento, estándares de servicio, prioridades y planes a años vista.
- **Táctico:** elegir corredor de transporte, empresa constructora, traza, proyecto, programa de vivienda y contratos.
- **Operativo opcional:** turnos, inventario de seguridad, cronograma de obra, asignación de cuadrillas y frecuencia de buses.

El detalle existe, pero el jugador **no está obligado a pulsar cada camión o cada empleado**. Puede delegar operaciones rutinarias a áreas municipales con límites, costos y estándares configurables.

### 5.5.7. Tableros mínimos para el realismo profundo

- Economía: caja, deuda, compromisos, recaudación, balances privados y empleos.
- Obras: avance por tareas, materiales, trabajadores, obligaciones futuras y riesgos.
- Vivienda: alquiler/salario, vacancia, demanda, edificios sin terminar y rehabilitación.
- Transporte: viajes puerta a puerta, reparto modal, carga y cuellos de botella.
- Puerto y aeropuerto: demanda real, utilización, costos operativos y conexión terrestre.
- Turismo: visitantes distintos de residentes, pernoctaciones, presión en alquiler y servicios.
- Redes: caudales y capacidades, pérdidas, fallas, redundancia y demanda pico.
- Territorio y patrimonio: riesgos, propiedad, edad del tejido, demoliciones y restauraciones.
- Gobierno: satisfacción por barrio, reclamos, promesas, aprobación y proyección electoral.

---

# 6. PARÁMETROS INICIALES PARA PROBAR BALANCE

**Son valores orientativos; no se deben tratar como economía final obligatoria.** La IA debe iterarlos tras realizar partidas de prueba completas.

| Variable | Propuesta de prueba | Observación |
|---|---|---|
| Población inicial | 400–800 habitantes | Permite arrancar con una ciudad ya viva |
| Fondos iniciales | 12–18 meses de gastos operativos base | Margen para primeras obras sin dinero infinito |
| Constructoras disponibles | 3 empresas distintas | Contratos comparables |
| Obras municipales activas recomendadas al inicio | 1–3 | Más simultaneidad exige capacidad y fondos |
| Perfil de hogares | Trabajadores, familias y adultos mayores | Necesidades diferenciadas simples |
| Tipos de suelo inicial | Residencial, comercial, industrial y público | Expandir a densidades luego |
| Servicios iniciales | Energía, agua y residuos | Base indispensable |
| Frecuencia de revisión ciudadana | Cada mes de juego | Efectos con inercia |
| Umbral de advertencia de apoyo | 35/100 | Aviso, no derrota automática |
| Peligro extremo de destitución | Menos de 15/100 sostenido con crisis grave | Nunca consecuencia de un solo clic |
| Mandato | 4 años | Una elección cada ~2 h en x1 |
| Variación electoral incierta | Preferentemente ±2 puntos como máximo | No revertir resultados claramente ganados |

**Regla de equilibrio:** un jugador razonable debe poder sobrevivir a su primer mandato si planifica y corrige errores, pero no ganar automáticamente sin gestionar servicios, obras y finanzas.

---

# 7. ESCENARIOS OBLIGATORIOS PARA VERIFICAR EL JUEGO (A–J)

## Escenario A — «Un nuevo barrio»

**Situación inicial:** ciudad pequeña, demanda residencial moderada, presupuesto acotado.

**Secuencia esperada:**

1. El jugador observa demanda de vivienda.
2. Delimita nuevo suelo residencial y planifica calles, agua, energía y saneamiento.
3. Contrata empresas para obras municipales de infraestructura.
4. Las obras progresan por etapas; hay costos y entregas.
5. Al habilitarse servicios y accesos, promotores privados solicitan proyectos.
6. Los promotores construyen casas o departamentos con plazos reales.
7. Se ocupan las viviendas progresivamente si hay empleo y accesibilidad.
8. Cambian recaudación, demanda de servicios, tránsito y satisfacción.

**Falla si:** la zona se llena en un segundo, la casa no necesita obra, se generan habitantes sin vivienda, o el nuevo barrio funciona sin conexión básica.

## Escenario B — «La licitación equivocada»

**Situación inicial:** urge una escuela y existen tres propuestas de construcción.

**Secuencia esperada:**

1. El jugador compara ofertas.
2. Elige la más económica, con peor historial de cumplimiento.
3. La obra comienza y avanza por etapas.
4. Hay escasez de insumos o fallas que provocan demora.
5. El jugador puede exigir cumplimiento, renegociar, reforzar recursos o reemplazar empresa.
6. La escuela terminada necesita personal y presupuesto.
7. Recién entonces mejora la educación y cambia gradualmente la aprobación ciudadana.

**Falla si:** todas las empresas se comportan igual, la obra termina instantáneamente o inaugurar una escuela sin personal aumenta cobertura total.

## Escenario C — «La elección que perdimos»

**Situación inicial:** municipio con barrios de condiciones desiguales, cuatro años por delante.

**Secuencia esperada:**

1. El gobierno promete arreglar transporte y mejorar el abastecimiento de agua.
2. Los jugadores se concentran en edificios vistosos y desatienden redes y presupuesto.
3. Se acumulan congestión, cortes, atrasos y compromisos incumplidos.
4. La aprobación cae con avisos y causas desglosadas.
5. El gobierno intenta remontar; algunas medidas tardan en producir resultados.
6. Se vota al terminar el mandato.
7. La ciudadanía elige al partido opositor por razones ligadas a la gestión.
8. Todos los jugadores del equipo ven el informe de derrota y termina esa partida competitiva.

**Falla si:** el resultado electoral es azar puro, el grupo continúa gobernando pese a haber perdido, o nunca recibe advertencias.

---

## Escenarios adicionales de realismo profundo (D–J)

### Escenario D — «Puerto sin acceso»

1. Una ciudad costera dispone de fábricas exportadoras y presupuesto limitado.
2. El equipo construye un muelle moderno sin ampliar el enlace por carretera/ferrocarril.
3. Llegan mercancías, pero se llenan patios y se forman colas de camiones.
4. El puerto cobra por servicios, pero acumula sobrecostos, pierde confiabilidad y puede perder clientes.
5. Ampliar accesos o sumar depósito cambia resultados después de un plazo y una obra real.

**Falla si:** el muelle exporta carga ilimitada o la mejora portuaria incrementa mágicamente la capacidad vial.

### Escenario E — «Aeropuerto sin viajeros»

1. El municipio financia una terminal sobredimensionada con deuda.
2. Se completan obras e inspecciones, pero el mercado aéreo disponible es pequeño.
3. Las aerolíneas ficticias ofrecen pocas rutas; la terminal permanece subutilizada.
4. Los intereses y costos operativos presionan la tesorería, y los vecinos sufren ruido donde existan operaciones.
5. Una mejora del turismo y del acceso al aeropuerto puede atraer rutas gradualmente, sin garantizar rentabilidad.

**Falla si:** una terminal vacía genera millones de pasajeros por sí sola o no tiene costos de mantenimiento.

### Escenario F — «El barrio histórico se transforma»

1. Un distrito posee fábricas antiguas, edificios valiosos y viviendas baratas con ocupación estable.
2. Un promotor intenta demoler para construir torres de alto valor; otra opción es restaurar y crear uso mixto.
3. El equipo compara inversión, empleo, alquileres, patrimonio, desplazamiento y demanda real.
4. La intervención elegida avanza por permisos, obra y ocupación gradual.
5. Tras varios años, el barrio muestra cambios arquitectónicos, económicos y demográficos consistentes.

**Falla si:** el patrimonio se restaura de golpe, la renovación no cambia alquileres o los vecinos desaparecen sin registro.

### Escenario G — «Obra quebrada y recuperación»

1. Una empresa constructora acumula pérdidas y abandona un hospital al 55% de avance físico.
2. Quedan materiales, deuda contractual, instalaciones incompletas y riesgo de deterioro.
3. El municipio puede exigir garantías, inspeccionar, contratar reemplazo o cancelar.
4. Recuperar la obra requiere presupuesto adicional, materiales, permisos y tiempo restante.
5. El hospital solo brinda servicio tras inspección, equipamiento y contratación de personal.

**Falla si:** el hospital aparece completo al cambiar de empresa, o cancelar devuelve todo el gasto.

### Escenario H — «Boom turístico y vivienda inaccesible»

1. Nuevas atracciones, eventos y conexiones elevan visitas.
2. Crecen hoteles y alquileres temporarios porque existen demanda e inversionistas.
3. Aumentan empleo e ingresos, pero también precio del alquiler, basura y viajes.
4. Los hogares vulnerables pueden irse si sus ingresos no alcanzan; la aprobación puede caer en barrios afectados.
5. Medidas de vivienda, transporte y turismo moderado requieren tiempo y tienen costos.

**Falla si:** todos los ciudadanos están contentos por el turismo o los visitantes se cuentan como residentes permanentes.

### Escenario I — «Tormenta y cascada de servicios»

1. Lluvias intensas afectan una cuenca urbanizada con escaso suelo absorbente.
2. Colapsa un colector, se inunda una subestación y falla bombeo de agua.
3. Algunos hospitales tienen respaldo; otros pierden capacidad y reciben más demanda.
4. El gobierno declara emergencia, coordina reparaciones y luego ejecuta obras de mitigación.
5. El daño, las muertes/afectaciones estadísticas si las hay y las pérdidas económicas siguen un historial visible y proporcional.

**Falla si:** la tormenta afecta por igual a toda la ciudad, la infraestructura no importa o reparar cuesta cero.

### Escenario J — «Treinta años de una ciudad»

1. Comenzar con pueblo pequeño, continuar durante al menos 30 años simulados.
2. Registrar creación de barrios, crecimiento de empresas, nuevas redes, edificios envejecidos, cambios de mercado y proyectos de varios mandatos.
3. Un área industrial se reconvierte gradualmente; una autopista se rehabilita; una escuela se amplía; un barrio histórico se preserva.
4. Los flujos monetarios, las personas y los materiales siguen siendo coherentes.
5. El gobierno recibe evaluaciones electorales consecutivas basadas en la trayectoria de gestión.

**Falla si:** el mundo se congela tras crecer la población, los activos no envejecen o la economía se vuelve infinita.

---

# 8. GUÍA DE PRIORIDADES PARA LA IA DESARROLLADORA

### Prioridad P0 — Núcleo imprescindible; nunca recortar

- Obras con tiempo y etapas visibles.
- Contratación de empresas constructoras.
- Presupuesto y costo de operación.
- Suelo, carreteras y servicios básicos con consecuencias.
- Demanda, viviendas privadas construidas progresivamente y población.
- Juego compartido con economía y decisiones comunes.
- Elecciones con derrota del equipo al perder.
- Propiedad, balances de dinero/stock y consecuencias de operación/mantenimiento desde la primera versión.
- Empresas y hogares diferenciados, sin unidades económicas infinitas.

### Prioridad P1 — Profundidad y realismo causal

- Materiales, logística y capacidad de empresas.
- Empleo, migración, calidad barrial y valores inmobiliarios.
- Saturación de servicios, tráfico y transporte público.
- Apoyo diferenciado por barrio y promesas.
- Crisis causales y recuperación.
- Empresas competidoras, desarrolladores, inmobiliario, abandono, trabajo y cadenas de suministro.
- Licitaciones avanzadas, desgaste de activos, deuda plurianual, geografía y riesgo ambiental.

### Prioridad P2 — Sistemas regionales y evolución a largo plazo (obligatorios en la visión final)

- Cadenas industriales más extensas y comercio exterior.
- Ferroviario, metro, puertos y aeropuertos **funcionales y operativos**, no decorativos.
- Contratos complejos, asociaciones público-privadas y licitaciones avanzadas.
- Turismo con hoteles privados, universidad, cultura, patrimonio, evolución arquitectónica y especializaciones regionales.
- Clima y desastres más profundos.
- Políticas ambientales y sociales más finas.

**Regla:** P2 no significa prescindible; significa posterior al núcleo estable. No construir cinco sistemas P2 a medio hacer cuando el ciclo P0 todavía permite colocar edificios instantáneos o ignora el dinero.

---

# 9. INSTRUCCIONES DE TRABAJO PARA OTRA IA (SOLO JUGABILIDAD)

1. **Trabajá en el orden de las fases e hitos**, salvo que una dependencia explícita obligue a reorganizar subtareas.
2. **Implementá y verificá una mecánica completa** antes de ampliar la cantidad de edificios y menús.
3. **Nunca simplifiques obras a un temporizador arbitrario sin empresa, estados y costo.** Incluso un prototipo debe conservar el ciclo mínimo anteproyecto → contrato → obra → inspección → operación.
4. **No confundas urbanización con aparición de construcciones.** Zonar habilita desarrollo privado, que necesita demanda y proceso constructivo.
5. **Mantené la política subordinada a la gestión.** Los votos evalúan el estado y trayectoria de la ciudad.
6. **Considerá cooperativo cada sistema importante.** La ciudad, fondos, obras y consecuencias siempre son compartidos.
7. **En cada fase entregá:** mecánicas jugables terminadas, qué decisiones permite al jugador, sus consecuencias, criterios probados, problemas pendientes y próximo objetivo.
8. **No declares terminada una fase si sus criterios de aceptación no se cumplen.** Si una mecánica está simulada de forma provisional, etiquetarla explícitamente como tal.
9. **Evitá menús con números sin impacto.** Toda métrica importante debe participar en una decisión o consecuencia real.
10. **No agregues funciones por el solo hecho de que existan en otros juegos.** Toda nueva función debe reforzar planificación, construcción, gestión, cooperación o evaluación ciudadana.

## Plantilla de reporte por fase

**Fase / Hito:**  
**Qué puede hacer ahora el jugador:**  
**Qué decisiones generan consecuencias reales:**  
**Qué estados, recursos y tiempos intervienen:**  
**Pruebas de aceptación superadas:**  
**Pruebas que fallan y limitaciones conocidas:**  
**Balance provisional utilizado:**  
**Próxima fase sugerida:**

---

# 10. DEFINICIÓN DE «JUGABILIDAD BÁSICA COMPLETA»

Se considera lograda cuando, en una partida real y sin trucos de desarrollo:

- [ ] Un grupo de amigos inicia una ciudad pequeña con presupuesto compartido.
- [ ] Planifican un barrio y pueden justificar su ubicación.
- [ ] Construyen calles y redes mediante contratos, tiempos y etapas reales.
- [ ] Contratan distintas empresas y observan ventajas, atrasos y calidad.
- [ ] Los edificios privados se construyen gradualmente por demanda; no aparecen terminados al zonificar.
- [ ] Los vecinos se mudan, trabajan y demandan servicios, vivienda y movilidad.
- [ ] Los gastos de construcción y operación afectan el presupuesto de forma verificable.
- [ ] La mala planificación puede causar congestión, contaminación, deterioro o abandono.
- [ ] Los compañeros coordinan obras, políticas y presupuestos sin recursos individuales inconsistentes.
- [ ] La satisfacción y el apoyo cambian de manera explicable durante el mandato.
- [ ] Al llegar al cuarto año hay elecciones basadas principalmente en resultados de gestión.
- [ ] Ganar permite comenzar otro mandato; perder termina la partida competitiva para todo el equipo.
- [ ] El jugador entiende por qué ganó o perdió y puede elegir estrategias diferentes en otra partida.

**Resultado final buscado:** un *city builder* 3D donde el verdadero placer sea **planificar, contratar, ver construir, operar y mejorar una ciudad compartida**; el mandato electoral aporta tensión y propósito a largo plazo, pero nunca reemplaza la construcción y la gestión como actividades principales.


---

# 11. DEFINICIÓN DE «REALISMO PROFUNDO COMPLETO»

No declarar terminado el modo de alto realismo hasta que:

- [ ] Los edificios privados se construyen mediante inversión, permisos, contratos, materiales, obra y ocupación.
- [ ] Las empresas compiten, producen, contratan, venden y pueden cerrar.
- [ ] El suelo tiene propiedad, riesgo, precio y restricciones con efectos jugables.
- [ ] La construcción pública distingue proyecto, licitación, contrato, avance físico/financiero, inspección y garantía.
- [ ] Las obras inconclusas permanecen y pueden rescatarse o demolerse.
- [ ] La vivienda responde a oferta y capacidad de pago; existen abandono y renovación.
- [ ] Hay cadenas productivas verificables con stocks y transporte de mercancías.
- [ ] El empleo depende de vacantes, trabajadores, habilidades, salarios y accesibilidad.
- [ ] La movilidad distingue modos, frecuencias, flotas, cuellos de botella y transporte de carga.
- [ ] Los puertos (cuando el mapa lo permite) tienen logística, demanda, operación y mantenimiento.
- [ ] Los aeropuertos (cuando son viables) tienen pistas, terminales, rutas, capacidad y costos.
- [ ] El turismo distingue visitantes, hospedajes, estacionalidad y presión urbana.
- [ ] Las redes físicas responden a demanda, capacidad, fallas, pérdidas y mantenimiento.
- [ ] Los peligros del territorio dependen de geografía, preparación y estado de los activos.
- [ ] Salud, educación, emergencias y servicios sociales necesitan personal, recursos y accesibilidad.
- [ ] El presupuesto incorpora deuda, compromisos, caja y mantenimiento futuro.
- [ ] Los barrios conservan memoria histórica, patrimonio y transformación arquitectónica gradual.
- [ ] Los edificios y las infraestructuras envejecen, pueden rehabilitarse y tienen costo de vida útil.
- [ ] La satisfacción, la confianza, la aprobación y el voto son indicadores diferentes y explicables.
- [ ] En cooperativo todos gestionan una ciudad común y pierden juntos si fracasa el gobierno.
- [ ] Ningún sistema crea sin causa dinero, población, empleos, bienes, pasajeros o capacidad.
- [ ] Existen alertas, estimaciones y posibilidades reales de corregir problemas previsibles.

---

## 11.1. Qué debe entregar la IA después de cada fase

- **Reglas jugables terminadas:** decisiones, costos, plazos, límites y transiciones de estado.
- **Conexiones causales:** qué sistemas ya existentes se ven afectados, con ejemplos concretos.
- **Indicadores de diagnóstico:** cómo sabe el jugador por qué ocurrió un resultado.
- **Pruebas efectivas:** resultados esperados y observados de criterios de aceptación, incluido al menos un caso adverso.
- **Equilibrio declarado:** parámetros provisionales con unidades y supuestos; no prometer que son valores finales.
- **Deuda de diseño:** simplificaciones explícitas que siguen pendientes y cómo pueden alterar la experiencia.
- **Validación cooperativa:** gasto único, permisos compartidos y efectos sobre una sola ciudad y un solo gobierno.

**Definición final de éxito:** una ciudad capaz de cambiar durante décadas por obras, inversiones, decisiones privadas, presupuesto público, recursos reales, movilidad, actividad económica, turismo, patrimonio y condiciones ambientales. Las elecciones resumen la calidad de la gestión; no sustituyen la construcción ni la simulación.
