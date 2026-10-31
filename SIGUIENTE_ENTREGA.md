# Siguiente entrega · continuidad

Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md` (34 fases). Priorizar mecánicas jugables con causas y efectos en la ciudad; evitar dedicar varias versiones a detalles de un sistema mientras quedan fases vacías. Revisar la interfaz si un cambio introduce contenido.

## Estado al cerrar Alfa 0.50

La fase 26 sigue parcial. Alfa 0.50 añade recorridos de recolección asignados automáticamente a los camiones según conectividad vial; contenedores, capacidad de parada, carga almacenada y rebalse tienen efecto en la basura sin recoger. Los camiones 3D recorren sus rutas y Servicios informa paradas y destinos. Alfa 0.49 agrega respaldo eléctrico consumible para servicios críticos: hasta 75 kW por edificio, reserva inicial de tres días, repostaje y mantenimiento mensual. Alfa 0.48 agrega contenedores viales y estaciones de transferencia en depósitos, con capacidad de almacenamiento y despacho que limita el flujo. Online y Offline ya incluyen tendidos físicos de electricidad, agua, cloacas, pluviales, gas y telecomunicaciones; capacidad, demanda, mantenimiento, residuos y reciclaje. Las inundaciones pueden dañar un tramo de red conectado; el corte se propaga por continuidad y afecta la cobertura. El gobierno puede pagar una cuadrilla, esperar tres días de reparación y recuperar el servicio. Las capas 3D muestran la avería.

## Próximo sistema

Siguiente: ampliar la fase 27 con pronóstico local de tormentas e interrupciones urbanas conectadas a la red pluvial y servicios; avanzar después hacia calor/sequía sin detenerse a pulir las rutas de recolección. Mantener entregas cortas de mecánicas nuevas y no gastar varias versiones puliendo este sistema.

## Verificación pendiente

Alfa 0.50: las rutas, la recolección, el almacenamiento y el rebalse pasaron pruebas Online y Offline. Chromium confirmó el panel de rutas a 390×844 y 1440×900, con scroll vertical, sin desborde horizontal ni errores JavaScript; se inspeccionaron capturas. La prueba de LAN entre dos computadoras físicas sigue pendiente. En cada publicación, actualizar `release_notes.json`, `ESTADO_DESARROLLO.md`, `DECISIONES_TECNICAS.md` y esta hoja. Usar el correo GitHub noreply vinculado a la cuenta para los commits.

## Medición del progreso global

No hay aún criterios y pesos estables registrados para calcular un porcentaje de avance de las 34 fases. Mantenerlo como no estimable hasta definirlos; no confundir avance de una versión con avance del juego.
