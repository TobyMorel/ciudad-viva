# Siguiente entrega · continuidad

Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md` (34 fases). Priorizar mecánicas jugables con causas y efectos en la ciudad; evitar dedicar varias versiones a detalles de un sistema mientras quedan fases vacías. Revisar la interfaz si un cambio introduce contenido.

## Estado al cerrar Alfa 0.53

La fase 27 sigue parcial. Alfa 0.51 anticipó tormentas y permitió desplegar bombas; Alfa 0.52 incorporó inspecciones y contratos para recuperar activos públicos. Alfa 0.53 añade olas de calor y sequías estacionales con efectos sobre la red eléctrica e hídrica, salud, refugios, actividad comercial y apoyo ciudadano. La fase 26 continúa parcial, con redes físicas, respaldo eléctrico y logística de residuos verificables en ambos modos.

## Próximo sistema

Siguiente: iniciar la fase 28 con una mecánica nueva de salud pública y capacidad de atención (personal, cobertura por rutas y saturación por episodios de calor), sin dedicar varias versiones a detalles climáticos. Después ampliar educación, seguridad y protección social como sistemas con instalaciones, personal, alcance y efectos demográficos.

## Verificación pendiente

Alfa 0.53: Online y Offline verificaron previsión del calor y sequía, multiplicadores de demanda, coste de refugios, mitigación de casos (45 → 13), reducción de agua, restricciones de demanda y cisternas. Chromium revisó Ciudad > Clima en 390×844 y 1440×900: botones dentro del modal, scroll vertical funcional, sin desborde horizontal ni errores JavaScript. La LAN entre computadoras físicas sigue pendiente. Alfa 0.52: inspección, débito, adjudicación, avance temporal y restauración de condición; Emergencias revisado en móvil y escritorio. Alfa 0.51: Online y Offline pronosticaron, cobraron el despliegue y aplicaron capacidad adicional; se verificó que el pronóstico comparara el agua y parcelas reales. Chromium (390×844 y 1440×900) mostró la alerta y el botón sin desborde ni errores JS; la conexión LAN física sigue pendiente. Alfa 0.50: las rutas, la recolección, el almacenamiento y el rebalse pasaron pruebas Online y Offline. Chromium confirmó el panel de rutas a 390×844 y 1440×900, con scroll vertical, sin desborde horizontal ni errores JavaScript; se inspeccionaron capturas. La prueba de LAN entre dos computadoras físicas sigue pendiente. En cada publicación, actualizar `release_notes.json`, `ESTADO_DESARROLLO.md`, `DECISIONES_TECNICAS.md` y esta hoja. Usar el correo GitHub noreply vinculado a la cuenta para los commits.

## Medición del progreso global

No hay aún criterios y pesos estables registrados para calcular un porcentaje de avance de las 34 fases. Mantenerlo como no estimable hasta definirlos; no confundir avance de una versión con avance del juego.
