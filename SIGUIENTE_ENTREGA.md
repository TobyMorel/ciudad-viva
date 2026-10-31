# Siguiente entrega · continuidad

Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md` (34 fases). Priorizar mecánicas jugables con causas y efectos en la ciudad; evitar dedicar varias versiones a detalles de un sistema mientras quedan fases vacías. Revisar la interfaz si un cambio introduce contenido.

## Estado al cerrar Alfa 0.54

La fase 27 sigue parcial. Alfa 0.51 anticipó tormentas y permitió desplegar bombas; Alfa 0.52 incorporó inspecciones y contratos para recuperar activos públicos. Alfa 0.53 añade calor y sequía con efectos sobre electricidad, agua, refugios y actividad. Alfa 0.54 inicia salud pública: personal cualificado, formación pagada, capacidad primaria y urgente, tiempos por calles, colas por barrio, costos de insumos y demanda hídrica/climática con rezago. Las fases 26 y 27 siguen parciales.

## Próximo sistema

Siguiente: continuar fase 28 con plazas escolares, docentes, acceso y resultados de aprendizaje que cambien habilidades y vacantes. Después agregar emergencias (dotaciones y disponibilidad por incidente) y ampliar hospitalización/ambulancias, sin pormenorizar los sistemas antes de tener una primera versión jugable de cada servicio.

## Verificación pendiente

Alfa 0.54: Online y Offline comprobaron puestos sanitarios, formación Salud (6 cupos, $840), consultas primarias/urgentes, acceso vial, demanda con rezago por agua y lista de espera sin personal. Chromium revisó Ciudad > Salud a 390×844 y 1440×900: controles dentro del modal, scroll vertical, sin overflow horizontal ni errores JS. Alfa 0.53: calor/sequía, refugios (45 → 13 casos estimados), restricciones y cisternas verificados en ambos modos; Ciudad > Clima revisado. La LAN entre computadoras físicas sigue pendiente. Alfa 0.52: inspección, débito, adjudicación, avance temporal y restauración de condición; Emergencias revisado en móvil y escritorio. Alfa 0.51: Online y Offline pronosticaron, cobraron el despliegue y aplicaron capacidad adicional; se verificó que el pronóstico comparara el agua y parcelas reales. Chromium (390×844 y 1440×900) mostró la alerta y el botón sin desborde ni errores JS; la conexión LAN física sigue pendiente. Alfa 0.50: las rutas, la recolección, el almacenamiento y el rebalse pasaron pruebas Online y Offline. Chromium confirmó el panel de rutas a 390×844 y 1440×900, con scroll vertical, sin desborde horizontal ni errores JavaScript; se inspeccionaron capturas. La prueba de LAN entre dos computadoras físicas sigue pendiente. En cada publicación, actualizar `release_notes.json`, `ESTADO_DESARROLLO.md`, `DECISIONES_TECNICAS.md` y esta hoja. Usar el correo GitHub noreply vinculado a la cuenta para los commits.

## Medición del progreso global

No hay aún criterios y pesos estables registrados para calcular un porcentaje de avance de las 34 fases. Mantenerlo como no estimable hasta definirlos; no confundir avance de una versión con avance del juego.
