# Ciudad Viva · Alfa 0.20

Simulador municipal cooperativo con cámara 3D isométrica, obras por etapas, materiales, cuadrillas y migración condicionada por vivienda y empleo. La escena usa Three.js, incluido en `vendor/`; después de descargar el paquete, el juego funciona sin Internet ni npm.

## Modos de juego

Al abrir la página se puede elegir **Offline** u **Online · red local**. Offline funciona en Vercel y guarda la ciudad en el almacenamiento local del navegador. Incluye calendario, parcelas, zonificación y obras con progreso por etapas. Los comercios compran materia prima a proveedores privados con stock, precio y demora; los clientes se distribuyen según precio y acceso. El Banco Cooperativo ofrece crédito comercial de liquidez limitada: las firmas pagan intereses y amortizan con excedentes, y la mora persistente puede cerrarlas y dejar trabajadores buscando empleo. Offline simplifica los trayectos a distancia y conserva esta economía local; los pedidos de materiales de obra y rescate siguen requiriendo el servidor. Para compartir una ciudad, elegí Online y abrí la dirección LAN del equipo anfitrión.

## Iniciar

Requiere Python 3.9 o posterior y un navegador moderno con WebGL.

- Windows: doble clic en **Iniciar Ciudad Viva.bat**.
- Linux/macOS: abrir **Iniciar Ciudad Viva.sh** desde el explorador; si no arranca, usar su opción “Ejecutar”.

El iniciador abre el servidor local y el navegador. `index.html` requiere el servidor para simular, guardar y aceptar conexiones LAN. Para invitar, el anfitrión deja el iniciador abierto y comparte la dirección LAN indicada en la ventana Ciudad. El firewall y la red Wi-Fi deben permitir conexiones entre dispositivos.

## Cambios y próximas entregas

La barra compacta sobre el mapa abre paneles emergentes para construir, consultar la ciudad, revisar economía, obras, acontecimientos y cambios. El historial **Cambios** cubre Alfa 0.1–0.20 con cinco versiones por página. Las notas 0.1–0.9 se señalan como no conservadas porque esos registros no están en la historia disponible. El contenido vive en `release_notes.json` y se actualiza en cada publicación.

## Controles

Arrastrá para mover la cámara, rueda o botones para acercar y alejar, y `Q` / `E` para girar. En móvil, arrastrá el mapa y usá los controles sobre la escena. `1–6` seleccionan herramientas; `Esc` vuelve a inspección.

Una calle nueva debe conectarse a la red. Viviendas y comercios requieren calle y zonificación compatible. Las ofertas comparan precio, duración, calidad, cumplimiento, materiales y trabajadores disponibles. Las obras consumen insumos por etapa; sin materiales se detienen. La herramienta Depósito municipal permite licitar un almacén con cuadrilla e insumos: al abrirse agrega 500 unidades de capacidad y cuesta $180/mes operarlo. Los pedidos reservan espacio en el destino elegido desde el despacho. El patio inicial y cada depósito tienen inventarios separados; solo las obras conectadas por calles retiran materiales de un depósito concreto. Desde cada obra se pueden cotizar y pedir insumos a tres proveedores con inventario, precio y demora distintos; los camiones siguen rutas viales y muestran retrasos si pierden acceso o comparten arterias congestionadas. El tiempo estimado se recalcula durante el viaje; el camión visible avanza al mismo ritmo que la simulación. La descarga espera operarios y autoelevador disponibles; volumen y capacidad de manejo de cada contratista determinan el plazo. Podés marcar una orden como prioridad alta para adelantarla en la cola al llegar. La cola también identifica una entrega que completa el material necesario para continuar una etapa detenida; los días en espera y la exposición estimada del contrato se muestran como información, sin débito adicional. Pausar libera trabajadores, y reanudar vuelve a comprobar la dotación. La calidad de las calles cambia su mantenimiento y la del centro de salud cambia su cobertura y operación.

La migración mensual se limita por plazas de vivienda vacantes y capacidad de empleo. Los residentes en edad laboral buscan vacantes con acceso vial y cada uno se asigna a un empleador. La congestión reduce su asistencia, el salario recibido y la nómina pagada por su empleador. La nómina privada se transfiere desde la empresa y la pública desde el presupuesto municipal a la caja del hogar; las compras locales descuentan dinero familiar. Comercios mantienen caja, inventario, ventas, producción y nómina, y pueden quebrar y eliminar sus vacantes. Cada residente incorporado aumenta ingresos tributarios; la salida reduce población e ingresos. El anfitrión controla el reloj y el guardado; todos pueden planificar en la misma ciudad.

## Alcance

La alfa incluye vista 3D generada localmente, localidad inicial con 22 edificios, cámara giratoria, tráfico ambiental, calendario, presupuesto, vivienda, calles, zonificación, licitaciones, constructoras, depósitos logísticos, pedidos logísticos, inventarios, trabajadores por contrato, servicios municipales, guardado y sincronización LAN por HTTP.

Pendientes: contratos, habilidades y horarios laborales, demanda diferenciada, personas como agentes urbanos, servicios físicos, gobierno y elecciones, mapas ampliables y validación de LAN entre dos equipos físicos. La asignación de empleos ya es individual, pero los recorridos aún se muestran agrupados por hogar y destino.

## Publicación en Vercel

Esta versión no se puede jugar desplegando solo los archivos estáticos: el navegador necesita la API autoritativa de `server.py` para el reloj, acciones, guardado y sincronización. Vercel no mantiene ese proceso Python activo entre solicitudes, y no ofrece la sala LAN local del iniciador. La opción Offline usa simulación local del navegador; la opción Online requiere abrir una instancia servida por el anfitrión LAN. Para jugar hoy, ejecutá el iniciador incluido en una computadora anfitriona; para una versión web en Vercel hace falta separar la simulación y persistir su estado en un backend durable. Eso también cambiaría el requisito de multijugador exclusivamente LAN si ese backend fuera público.

Para desplegar el sitio estático en Vercel, usá el repositorio raíz como proyecto y el preset **Other**, sin comando de build ni directorio de salida personalizado. La cuenta de Git que crea los commits debe usar un correo verificado y asociado a GitHub; el proyecto Vercel también debe permitir despliegues de esa cuenta.
