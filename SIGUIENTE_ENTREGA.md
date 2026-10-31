# Siguiente entrega · continuidad

Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md` (34 fases). Priorizar mecánicas jugables con causas y efectos en la ciudad; evitar dedicar varias versiones a detalles de un sistema mientras quedan fases vacías. Revisar la interfaz si un cambio introduce contenido.

## Estado al cerrar Alfa 0.47

La fase 26 sigue parcial. Online y Offline ya incluyen tendidos físicos de electricidad, agua, cloacas, pluviales, gas y telecomunicaciones; capacidad, demanda, mantenimiento, residuos y reciclaje. Las inundaciones pueden dañar un tramo de red conectado; el corte se propaga por continuidad y afecta la cobertura. El gobierno puede pagar una cuadrilla, esperar tres días de reparación y recuperar el servicio. Las capas 3D muestran la avería.

## Próximo sistema

Completar fase 26 con contenedores, rutas de recolección y estaciones de transferencia que separen materiales y conecten reciclaje, disposición y comercio regional. Incorporar redundancia y respaldo eléctrico para bombeo y servicios críticos, de modo que los circuitos alternativos limiten apagones. Luego ampliar fase 27 con riesgos climáticos y respuesta municipal.

## Verificación pendiente

Se probaron corte y restauración de redes en Online y Offline, acción HTTP, compilación/sintaxis y panel de Servicios con falla en móvil y escritorio. La prueba de LAN entre dos computadoras físicas sigue pendiente. En cada publicación, actualizar `release_notes.json`, `ESTADO_DESARROLLO.md`, `DECISIONES_TECNICAS.md` y esta hoja. Usar el correo GitHub noreply vinculado a la cuenta para los commits.

## Medición del progreso global

No hay aún criterios y pesos estables registrados para calcular un porcentaje de avance de las 34 fases. Mantenerlo como no estimable hasta definirlos; no confundir avance de una versión con avance del juego.
