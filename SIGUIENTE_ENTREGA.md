# Siguiente entrega · continuidad

Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md` (34 fases). Mantener una entrega jugable por ciclo: priorizar mecánicas causales que cambien la ciudad; dejar balance fino y embellecimiento para después. Corregir de inmediato cualquier bloqueo de uso o desborde de interfaz.

## Estado al cerrar Alfa 0.46

La fase 26 cubre parcialmente energía, agua potable, cloacas, drenaje pluvial, residuos y reciclaje, con capacidad finita, flota, anegamientos, recuperación e ingresos/costos visibles. Online y Offline comparten estos circuitos. El alcance sigue parcial.

## Próximo sistema

Continuar fase 26 con contenedores y transferencia logística de reciclables, gas y telecomunicaciones, más reparación y respaldo de redes. Luego iniciar fase 27 con clima y riesgos urbanos más amplios. Mantener el foco en mecánicas nuevas y completar los sistemas esenciales antes de una pasada de detalle.

Continuar fase 25 en una pasada posterior con eventos temporales, estacionalidad, llegadas por puerto/ferrocarril, atractivos patrimoniales/naturales y costos/efectos urbanos. Mantener visitantes separados de población residente.

## Verificación pendiente

Alfa 0.46: se validaron contratos y circuito de reciclaje en Online y Offline, compilación/sintaxis y revisión de Servicios en móvil/escritorio. Falta verificación física entre dos computadoras LAN y desplegar la publicación en Vercel. Actualizar `release_notes.json`, `ESTADO_DESARROLLO.md`, `DECISIONES_TECNICAS.md` y esta hoja en cada entrega. Git usa un correo válido vinculado a GitHub para evitar el rechazo de Vercel.


## Estado al cerrar Alfa 0.46

Fase 26 suma redes funcionales de gas y telecomunicaciones en ambos modos, con trazado, cobertura de edificios, demanda/capacidad, mantenimiento y efecto en productividad. La próxima entrega debe priorizar nuevas mecánicas transversales de infraestructura (fallas, reparación y redundancia) y logística de residuos (contenedores/transferencia), evitando pulir un único sistema en varias versiones. Mantener cambios en `release_notes.json`, estado, decisiones y auditoría. Peso estable para el progreso global de las 34 fases aún no está establecido en la documentación; no publicar un porcentaje hasta formalizar criterios y pesos. Verificar interfaz móvil/escritorio en cada cambio y anotar que LAN físico requiere dos computadoras.
