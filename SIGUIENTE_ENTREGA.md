# Siguiente entrega · continuidad

Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md` (34 fases). Priorizar mecánicas jugables con causas y efectos en la ciudad; evitar dedicar varias versiones a detalles de un sistema mientras quedan fases vacías. Revisar la interfaz si un cambio introduce contenido.

## Estado al cerrar Alfa 0.58

La fase 28 ahora tiene capas iniciales de salud, educación y emergencias de incendio. Alfa 0.54 añadió atención sanitaria; 0.55, escuelas y formación; 0.56, estaciones, plantillas, respuesta por ruta, costos y daños. Salud y educación siguen parciales. Las fases 26–28 siguen parciales.

## Próximo sistema

Fase 29: añadir reservas municipales y presupuesto por programa, compromisos pendientes de obra, escenarios de caja y refinanciación; luego abrir fase 30 con barrios patrimoniales, edificios protegidos y rehabilitación por obra. Mantener una mecánica jugable nueva por entrega antes de profundizar detalles.

## Verificación pendiente

Alfa 0.58: crédito Online/Offline de $5.000, cuota $132, primer mes $50 de interés y $82 de principal; panel Hacienda con saldo, flujo y proyección. Se restauró y comprobó la base de Alfa 0.56 tras una carga de archivos mal codificada en un intento previo de publicación. Alfa 0.56: prueba Online confirmó incendio controlado en 35 minutos, siete puntos de daño y enfriamiento de dos días; sin personal, cinco días empeoran condición, servicios y aprobación. Offline confirmó 12 bomberos y despacho, además del gasto. Chromium revisó Ciudad > Bomberos a 390×844 y 1440×900: scroll vertical, sin desborde horizontal ni errores JavaScript. No se probaron LAN física ni Vercel. Alfa 0.55: Online y Offline verificaron contrato, docentes, asistencia, espera y gasto escolar. Materiales funcionan Online; compra local Offline sigue pendiente. Ciudad > Educación revisada en móvil/escritorio. Alfa 0.54: Online y Offline comprobaron puestos sanitarios, formación Salud (6 cupos, $840), consultas primarias/urgentes, acceso vial, demanda con rezago por agua y lista de espera sin personal. Ciudad > Salud revisada en móvil y escritorio. Alfa 0.53: calor/sequía, refugios (45 → 13 casos estimados), restricciones y cisternas verificados en ambos modos; Ciudad > Clima revisado. La LAN entre computadoras físicas sigue pendiente. Alfa 0.52: inspección, débito, adjudicación, avance temporal y restauración de condición; Emergencias revisado en móvil y escritorio. Alfa 0.51: Online y Offline pronosticaron, cobraron el despliegue y aplicaron capacidad adicional; se verificó que el pronóstico comparara el agua y parcelas reales. Chromium (390×844 y 1440×900) mostró la alerta y el botón sin desborde ni errores JS; la conexión LAN física sigue pendiente. Alfa 0.50: las rutas, la recolección, el almacenamiento y el rebalse pasaron pruebas Online y Offline. Chromium confirmó el panel de rutas a 390×844 y 1440×900, con scroll vertical, sin desborde horizontal ni errores JavaScript; se inspeccionaron capturas. La prueba de LAN entre dos computadoras físicas sigue pendiente. En cada publicación, actualizar `release_notes.json`, `ESTADO_DESARROLLO.md`, `DECISIONES_TECNICAS.md` y esta hoja. Usar el correo GitHub noreply vinculado a la cuenta para los commits.

## Medición del progreso global

No hay aún criterios y pesos estables registrados para calcular un porcentaje de avance de las 34 fases. Mantenerlo como no estimable hasta definirlos; no confundir avance de una versión con avance del juego.
