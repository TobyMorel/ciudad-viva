# Ciudad Viva · Alfa 0.15

Simulador municipal cooperativo con cámara 3D isométrica, obras por etapas, materiales, cuadrillas y migración condicionada por vivienda y empleo. La escena usa Three.js, incluido en `vendor/`; después de descargar el paquete, el juego funciona sin Internet ni npm.

## Iniciar

Requiere Python 3.9 o posterior y un navegador moderno con WebGL.

- Windows: doble clic en **Iniciar Ciudad Viva.bat**.
- Linux/macOS: abrir **Iniciar Ciudad Viva.sh** desde el explorador; si no arranca, usar su opción “Ejecutar”.

El iniciador abre el servidor local y el navegador. `index.html` requiere el servidor para simular, guardar y aceptar conexiones LAN. Para invitar, el anfitrión deja el iniciador abierto y comparte la dirección LAN indicada en el panel izquierdo. El firewall y la red Wi-Fi deben permitir conexiones entre dispositivos.

## Controles

Arrastrá para mover la cámara, rueda o botones para acercar y alejar, y `Q` / `E` para girar. En móvil, arrastrá el mapa y usá los controles sobre la escena. `1–6` seleccionan herramientas; `Esc` vuelve a inspección.

Una calle nueva debe conectarse a la red. Viviendas y comercios requieren calle y zonificación compatible. Las ofertas comparan precio, duración, calidad, cumplimiento, materiales y trabajadores disponibles. Las obras consumen insumos por etapa; sin materiales se detienen. La herramienta Depósito municipal permite licitar un almacén con cuadrilla e insumos: al abrirse agrega 500 unidades de capacidad y cuesta $180/mes operarlo. Los pedidos reservan espacio en el destino elegido desde el despacho. El patio inicial y cada depósito tienen inventarios separados; solo las obras conectadas por calles retiran materiales de un depósito concreto. Desde cada obra se pueden cotizar y pedir insumos a tres proveedores con inventario, precio y demora distintos; los camiones siguen rutas viales y muestran retrasos si pierden acceso o comparten arterias congestionadas. El tiempo estimado se recalcula durante el viaje; el camión visible avanza al mismo ritmo que la simulación. La descarga espera operarios y autoelevador disponibles; volumen y capacidad de manejo de cada contratista determinan el plazo. Podés marcar una orden como prioridad alta para adelantarla en la cola al llegar. La cola también identifica una entrega que completa el material necesario para continuar una etapa detenida; los días en espera y la exposición estimada del contrato se muestran como información, sin débito adicional. Pausar libera trabajadores, y reanudar vuelve a comprobar la dotación. La calidad de las calles cambia su mantenimiento y la del centro de salud cambia su cobertura y operación.

La migración mensual se limita por plazas de vivienda vacantes y capacidad de empleo. Los residentes en edad laboral buscan vacantes con acceso vial y cada uno se asigna a un empleador. La nómina privada se transfiere desde la empresa y la pública desde el presupuesto municipal a la caja del hogar; las compras locales descuentan dinero familiar. Comercios mantienen caja, inventario, ventas, producción y nómina, y pueden quebrar y eliminar sus vacantes. Cada residente incorporado aumenta ingresos tributarios; la salida reduce población e ingresos. El anfitrión controla el reloj y el guardado; todos pueden planificar en la misma ciudad.

## Alcance

La alfa incluye vista 3D generada localmente, localidad inicial con 22 edificios, cámara giratoria, tráfico ambiental, calendario, presupuesto, vivienda, calles, zonificación, licitaciones, constructoras, depósitos logísticos, pedidos logísticos, inventarios, trabajadores por contrato, servicios municipales, guardado y sincronización LAN por HTTP.

Pendientes: contratos, habilidades y horarios laborales, competencia y proveedores, demanda diferenciada, personas como agentes urbanos, servicios físicos, gobierno y elecciones, mapas ampliables y validación de LAN entre dos equipos físicos. La asignación de empleos ya es individual, pero los recorridos aún se muestran agrupados por hogar y destino.
