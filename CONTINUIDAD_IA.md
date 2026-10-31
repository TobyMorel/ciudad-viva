# Continuidad de desarrollo para otra IA

Este documento es el punto de relevo de Ciudad Viva. Léelo junto con `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md`, que sigue siendo la especificación principal, y con `ESTADO_DESARROLLO.md`, `AUDITORIA_ROADMAP.md`, `DECISIONES_TECNICAS.md` y `SIGUIENTE_ENTREGA.md`.

## Cómo continuar con el mismo criterio

- Priorizar mecánicas nuevas y circuitos jugables de extremo a extremo. El usuario pidió explícitamente no dedicar muchas versiones a pulir detalles mientras falten sistemas del roadmap.
- Las decisiones deben tener causas, recursos finitos, costos, tiempos, actores y efectos visibles en la ciudad. No sustituir una mecánica por una barra sin consecuencia.
- Toda regla central nueva debe funcionar en los dos modos: `server.py` (estado autoritativo online/LAN) y `offline.js` (motor local del navegador). Evitar duplicar cálculos de UI como si fueran reglas de simulación.
- La construcción existente proporciona el circuito común: parcela, contratista, capacidad de cuadrilla, fondos, materiales, etapas, avance, inspección y activación. Reutilizarlo cuando corresponda.
- Mantener una causa verificable y persistente en el estado, migraciones explícitas del esquema y una explicación accesible desde los paneles existentes.
- No declarar completa una fase porque tenga un prototipo. Mantener los porcentajes de fase conforme al criterio de cobertura documentado en `release_notes.json` y la auditoría. El avance global permanece sin estimar: no hay una matriz global de ponderaciones verificable.
- El usuario requiere subir cada entrega completa a `main` y comprobar el resultado. El commit debe llevar un email real válido de autor, nunca el valor `0`. No reemplazar una rama remota más nueva ni afirmar publicación sin comprobar el SHA.
- Empaquetar cada entrega completa en un ZIP que incluya esta guía y los documentos de estado.
- Probar los cambios con comprobaciones proporcionales al alcance. Para cambios de interfaz verificar escritorio y móvil, textos legibles, scroll utilizable y ausencia de solapamientos/overflow. Indicar si LAN física o Vercel no se comprobaron.

## Arquitectura actual

- `index.html`: interfaz principal y carga del cliente. Sigue siendo una página estática usable en Offline; Online/LAN requiere el anfitrión con `server.py`.
- `game.js`: cliente, herramientas, paneles emergentes, selección de parcelas/actores, peticiones y renderizado de UI. Usa modo offline mediante el adaptador, o modo online contra el estado del servidor.
- `world3d.js`: escena Three.js isométrica, edificios/terreno/actores visibles y proyección del puntero a entidades seleccionables. La escena de cada actualización se reconstruye desde el estado compartido.
- `server.py`: fuente autoritativa de simulación Online/LAN, acciones serializadas, guardados y migraciones. Las peticiones LAN no dependen de servicios externos.
- `offline.js`: simulación/persistencia local. Mantener paridad funcional con el servidor.
- `style.css`: estilos adaptables y paneles. Comprobar anchos cercanos a 390 px y escritorio para contenido nuevo.
- `release_notes.json`: historial de versiones y datos de la guía visual de fases. Actualizar la versión y los cambios de la interfaz con cada subida.
- Documentación: auditoría, estado, decisiones y próxima tarea deben concordar con código y pruebas.

## Estado al cerrar Alfa 0.77

- Roadmap: hito F; fase activa 33, parcial (35%). La fase 21 está al 60% tras enlazar migración y perfiles de personas. Estos son porcentajes por fase, no del juego completo. El avance global permanece “sin estimar” por falta de pesos globales basados en criterios verificables.
- Estado de partida: el servidor inicia/salva en esquema 59; el adaptador Offline completa los campos y eleva el guardado local a 59. `offline_seed.json` conserva el valor legado 21, se normaliza al iniciar y no debe editarse solo para cambiar ese número. Versión de cliente: Alfa 0.76. La mecánica de migración no añade campos persistentes nuevos.
- Mercado exterior de fase 33 tiene volúmenes y presupuestos finitos. La oferta cambia de acuerdo con trabajadores, precio, condición, servicios y acceso.
- Si queda demanda regional sin atender, hay una parcela comercial libre conectada, existe capital privado y reserva, el permiso cabe en caja municipal y una constructora tiene cupo y siete trabajadores, se crea una sola propuesta privada de comercio. La oferta expira a 90 días. Rechazarla no gasta fondos ni reserva parcela y activa una espera de 90 días.
- Aprobar exige el ID vigente de la oferta y la misma parcela/contratista; se cobra solo el permiso y el proyecto usa la tubería ya existente de construcción por etapas, materiales, cuadrilla e inspección. La propuesta no abre un local instantáneamente.
- Al inspeccionar una vivienda, el panel muestra residentes, edad, empleo, empleador, ingresos y posesión de vehículo si está disponible. Actores seleccionables muestran su tipo, ruta/actividad y datos de pasajeros vinculados. La densidad y cantidad visible varían según los perfiles simulados; no todos los autos ambientales tienen perfil individual.
- Las categorías de Ciudad forman una tira horizontal desplazable en móvil y escritorio. La categoría activa se lleva a vista cuando cambia el panel.
- Alfa 0.76: cada nueva mudanza agrega una persona con edad de cohorte y etapa de vida; los elegibles tienen habilidades de trabajo y pueden encontrar vacantes por el sistema existente. Al emigrar, una persona específica se elimina, ocupación/padrón quedan sincronizados y su empleo puede liberarse. Se aplica tanto al migrar como al irse y no da ingresos/empleos gratuitos.

## Verificaciones registradas para esta entrega

Estado comprobado de Alfa 0.76:

- Sintaxis de Python/JavaScript y JSON del registro: correcta. Guardados cargados Offline se elevan a esquema 59 durante la inicialización; la semilla histórica `offline_seed.json` conserva versión 21 y se normaliza al crear la partida.
- Oferta y aceptación Online: verificada, incluyendo costo de ambas cajas, siete trabajadores y rechazo de duplicado.
- Oferta y aceptación Offline: verificada en guardado de prueba al primer cierre mensual; costos $432/$3.168, siete trabajadores y propuesta causada por demanda no atendida.
- Chromium a 390×844 y 1440×900 comprobó documento sin overflow horizontal, etiquetas de la tira legibles y categorías accesibles mediante desplazamiento. La tira restaura su posición al repintarse el resumen. Captura móvil revisada.
- Python: siete llegadas con padrón/ocupación sincronizados, edad y habilidades; cinco salidas retiran perfiles y reducen población por el mismo número. Offline Chromium: siete llegadas al cierre mensual y padrón/ocupación de 627.
- El ZIP y la publicación `main` de Alfa 0.76 se verifican antes de entregar.
- LAN entre dos computadoras físicas y publicación/ejecución en Vercel: no probadas en esos entornos.

## Siguiente tarea exacta

Continuar la fase 33 con simulación reproducible de varias décadas. Hacer pruebas de al menos 30 años en ambos motores y observar si demanda finita, inversión, obras, materiales, empleo, migración con registros personales, envejecimiento, caja y elecciones forman un ciclo estable. Encontrar y corregir bucles de generación/destrucción de capital; registrar ciudades que se vacían, se estancan o crecen sin soporte. Después ampliar la propuesta privada a los tipos de empresa que realmente permitan los mercados/cadenas ya simulados y ejecutar los escenarios pequeño, metropolitano, portuario y turístico que enumera el roadmap. Hacer una sola mecánica de contenido significativa por entrega y actualizar porcentajes solo con evidencia.


### Alfa 0.77 (actual)

- La fase 33 queda al 35%: delegación municipal opcional para propuestas comerciales con tope configurable. El anfitrión aplica la política en Online; Offline sigue la misma condición. Una contratación crea proyecto estándar, descuenta permiso de la caja, inversión del capital privado y abona anticipo de contratista; asigna siete trabajadores. Online incluye el abastecimiento por materiales; Offline aún permite avanzar sin inventario y eso debe corregirse en una entrega de mecánica, no de detalle.
- Prueba comprobada Online: permiso $432, capital $3.168, anticipo $634, siete trabajadores. Tope $0 deja oferta pendiente sin crear obra. Chromium comprobó Ciudad > Puerto en móvil 390×844 y escritorio 1440×844, sin overflow horizontal ni errores JS.
- Antes de dar el sistema por verificado en Offline, reproducir la misma propuesta bajo el motor local y probar topes $0/$500. Próximo contenido: escenarios largos de la fase 33, comenzando por 30 años en los perfiles básico y metropolitano; no invertir entregas sucesivas solo en UI.
- Versión en index y notas: Alfa 0.77. Esquema persistente sigue en 59; sin migración.
