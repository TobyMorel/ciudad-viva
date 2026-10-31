# Siguiente entrega · continuidad

Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md` (34 fases). Priorizar sistemas jugables con causas, costos y consecuencias; evitar dedicar entregas a detalles mientras quedan mecánicas vacías.

## Estado al cerrar Alfa 0.69

La fase 30 comenzó con ocho edificios históricos inventariados, protección parcial/integral y obras de rehabilitación conectadas a constructoras, cuadrillas, materiales, entrega, etapas y conservación final. El resto del tejido conserva su edad, uso original y reformas. Alfa 0.69 suma reconversión privada de locales cerrados a vivienda con permiso, inversión, cuadrilla y etapas de obra; migración por empleo/aprobación y alquiler a los nuevos residentes. Aún no mide desplazamiento, protege inquilinos, incorpora alquileres de mercado dinámicos ni transforma arquitectura por décadas. Alfa 0.63 inició fase 31 con desgaste vial financiado desde Redes y residuos. Alfa 0.64 suma edificios públicos a la misma cartera: condición según carga, diagnóstico, inspección de un día, licitación de reparación y cuatro trabajadores durante la obra. Cuando al menos 35% de los tramos cae bajo 45% o 25% de los edificios públicos queda bajo 60%, el nivel de servicios baja un punto por mes hasta corregir la cartera. Fase 30 permanece parcial. Hacienda de fase 29 continúa operativa con créditos, impuestos, reserva y presupuestos por programa.

## Sistema agregado en Alfa 0.65

Los seis tendidos de servicios guardan condición por tramo. La carga local acelera el deterioro y la financiación de Redes lo mitiga; una falla crítica desconecta la línea hasta reparar. El tablero de Servicios informa la condición de cada red. Es un primer circuito de fase 31; se verificó el corte y restablecimiento de una línea en ambos motores, además del panel de condición en móvil y escritorio.

## Sistema agregado en Alfa 0.66

Una calle que cae bajo 25% de condición queda cerrada en la red de rutas. Los recorridos buscan desvíos; sin alternativa, el acceso al destino se interrumpe. La cuadrilla de rehabilitación la reabre después de recibirla a 82%. Las barreras del mapa y el inventario de Mantenimiento reflejan el cierre.

## Sistema agregado en Alfa 0.67

La condición estructural de centrales, plantas potabilizadoras y depuradoras determina su aporte físico a la red. A 82% entregan su capacidad base; por debajo, su producción disminuye proporcionalmente y cambia la cobertura de energía, agua y tratamiento. El panel de Mantenimiento muestra producción y porcentaje funcional, y la rehabilitación restaura el nivel base. Online y Offline.

## Sistema agregado en Alfa 0.69

Las tiendas que cerraron pueden convertirse en viviendas cuando no arrastran deuda y no están protegidas. Promotores pagan obra; una empresa compromete cuadrilla durante 20–30 días y la inspección final habilita 24 plazas. Las mudanzas responden a empleo y aprobación; alquileres empiezan al mes siguiente y la mora puede reducir apoyo. Disponible Online/Offline en esquema 53.

## Sistema agregado en Alfa 0.68

Centrales eléctricas, plantas potabilizadoras y depuradoras tienen revisión preventiva cada 180 días. El vencimiento abre un expediente al cierre mensual; revisar cuesta $150 y toma un día. Si la planta aún conserva la salida de diseño, no hace falta obra y el plazo se reinicia. Si perdió capacidad, el informe habilita la licitación y el contrato de rehabilitación existente; recuperar condición 82% devuelve la capacidad base. Guardados migran al esquema 52. Chromium verificó el ciclo Online/Offline, móvil y escritorio sin solapamientos ni overflow horizontal.

## Próximo sistema

Abrir fase 32 con mandatos y elecciones que evalúen empleo, vivienda, servicios, impuestos y bienestar con causas rastreables; una derrota electoral debe terminar la partida competitiva para todo el equipo. Luego seguir fase 30 con protección de inquilinos y desplazamiento, y ampliar fase 31 al mantenimiento de activos privados.

## Verificación

Online y Offline completaron la degradación de la Municipalidad por debajo de 60%, diagnóstico, inspección ($150/1 día), adjudicación a Sur Obras ($900/4 trabajadores/5 días) y rehabilitación final a 82%. Móvil/escritorio: subpestañas de inventario sin desborde horizontal y scroll vertical.

La simulación Online y Offline calcula los mismos costos y reglas de mantenimiento. El cierre mensual usa el factor efectivamente pagado por el programa Redes; revisar también la condición inicial y el primer cierre en el navegador antes de ampliar activos.

Online y Offline completaron protección y rehabilitación patrimonial: materiales consumidos, costo municipal, demora de proveedor, cuadrilla ocupada por 20 días, reforma persistente y conservación final de 100%. Chromium a 390×844 y 1440×900: controles y categorías dentro del modal, scroll vertical, sin overflow horizontal ni errores JS. No se probó LAN entre dos equipos ni Vercel.

## Medición del progreso global

El porcentaje total queda sin estimar: faltan pesos estables y criterios de finalización verificables para las 34 fases. No se convierte el número de entregas, archivos o pruebas en avance del juego.
