# Siguiente entrega · continuidad

Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md` (34 fases). Priorizar sistemas jugables con causas, costos y consecuencias; evitar dedicar entregas a detalles mientras quedan mecánicas vacías.

## Estado al cerrar Alfa 0.59

La fase 29 ya enlaza crédito municipal, amortización, impuestos ajustables, pagos efectivos y mora. Los pagos inmobiliarios reducen el efectivo doméstico disponible para compras; los gravámenes sobre ventas reducen la liquidez comercial; solo lo cobrado entra a caja municipal. La proyección de 12/48 meses todavía mantiene constantes las bases y no modela escenarios. Fase 28 conserva capas iniciales de salud, escuela y bomberos; seguridad/protección social ampliadas siguen pendientes en el árbol actualmente publicado.

## Próximo sistema

Completar una primera capa de presupuesto por programa, reservas y compromisos de obra en Hacienda; ofrecer reestructuración de deuda ante mora. Después iniciar fase 30 con protección y rehabilitación financiada de edificios históricos. Mantener una mecánica nueva por entrega antes de profundizar sus detalles.

## Verificación pendiente

Alfa 0.59: diez residentes facturan $12 y pagan $12 con caja doméstica; una tienda con ventas de $1.000 factura $20 y paga $5 de sus $5 disponibles, dejando $15 de mora. Repetir el cierre no duplica el cargo. El modo Offline cerró un mes y registró cobros desde los balances. La UI Hacienda se comprobó en Chromium a 390×844 y 1440×900, sin overflow horizontal ni errores JavaScript; todo el contenido conserva scroll vertical. Alfa 0.58: un crédito Online/Offline de $5.000 cobra $132/mes; el primer pago separa interés y capital. LAN física y Vercel siguen sin prueba en este entorno; Offline aún no compra ni entrega materiales de construcción.

## Medición del progreso global

No hay criterios y pesos estables que permitan un porcentaje verificable para las 34 fases. Mantener el avance global sin estimar hasta registrar esa base; no confundir avance de versión con avance del juego.
