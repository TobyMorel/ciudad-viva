# Siguiente entrega · continuidad

Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md` (34 fases). Mantener una entrega jugable por ciclo: priorizar mecánicas causales que cambien la ciudad; dejar balance fino y embellecimiento para después. Corregir de inmediato cualquier bloqueo de uso o desborde de interfaz.

## Estado al cerrar Alfa 0.40

La fase 25 inició con hoteles privados: contrato, etapas, personal, pasajeros aéreos, ocupación, tarifa, finanzas, impuesto y cierre por caja agotada. Continúa parcial. La pestaña Ciudad > Turismo se comprobó en Chromium a 390 × 844: las siete subcategorías caben sin recorte horizontal y el panel desplaza verticalmente su contenido.

## Próximo sistema

Iniciar fase 26 con balances simples pero físicos de electricidad y agua: capacidad disponible, edificios conectados, consumo por actividad, déficit y costo municipal. Una conexión directa a edificio debe alterar el servicio recibido; evitar barras sin efectos. Luego sumar saneamiento y residuos con sus propias unidades/capacidades. No dedicar otra entrega a expandir el aeropuerto o el detalle visual de hoteles.

Continuar fase 25 en una pasada posterior con eventos temporales, estacionalidad, llegadas por puerto/ferrocarril, atractivos patrimoniales/naturales y costos/efectos urbanos. Mantener visitantes separados de población residente.

## Verificación pendiente

La sintaxis de Python y módulos JavaScript pasó. Chromium confirmó el panel Turismo en móvil; falta verificación física entre dos computadoras LAN y publicar/desplegar la nueva build en Vercel. Actualizar `release_notes.json`, `ESTADO_DESARROLLO.md`, `DECISIONES_TECNICAS.md` y esta hoja en cada entrega. Git usa un correo válido vinculado a GitHub para evitar el rechazo de Vercel.
