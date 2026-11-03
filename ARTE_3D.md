# Sistema artístico 3D · Ciudad Viva

## Auditoría inicial

Motor: Three.js 0.171, incluido en `vendor/`. `world3d.js` contiene la escena isométrica, la cámara, el terreno, costa, agua, calles, vegetación, edificios, obras y vehículos. El estado llega desde `game.js`; Online y Offline comparten el mismo render. Los edificios ocupan una celda de 2 unidades, se orientan hacia una calle vecina y conservan su selección y categoría. Las construcciones leen `project.progress`; las fábricas leen `business.industryType`. El mapa de agua usa `waterTile` y sigue sin cambiar de forma.

## Dirección de Alfa 0.110

- Paleta: asfalto pizarra, acera piedra cálida, terreno verde oliva, agua turquesa, fachadas crema/terracota/salvia/azul grisáceo y cubiertas terracota o verde.
- Materiales mate compartidos, sol lateral cálido, hemisferio de relleno moderado y sombras suaves en cubiertas y una parte de las copas para limitar trabajo de GPU. Resolución de sombra 1024². La vista previa de la pantalla inicial espera un momento de inactividad y no construye detalles de fachada. Geometrías básicas compartidas por dimensión para evitar duplicación al regenerar una ciudad. El detalle adicional de fachada se incorpora desde zoom 1,4; la silueta base permanece en cualquier escala.
- Casas con cubierta a dos aguas de volumen real, juntas de teja, balcones, jardineras y ventanas en fachada posterior. Comercios con toldos alternados y escaparates. Fábricas con cubiertas acanaladas y equipo visual según industria. Servicios de salud y educación con anexos según escala.
- Árboles con cinco siluetas y floración poco frecuente. Calles conectadas por el mismo grafo; el cruce peatonal se construye solo cuando el tramo tiene tres o cuatro vecinos. Costa con paseo, bordillo, bancos, farolas y rocas.
- Obras muestran cimientos, columnas, forjados y andamios según el progreso real. La grúa aparece solo después de iniciada la estructura y se omite en móvil.

## Límites y siguiente pase

El rediseño se mantiene procedural y todavía no alcanza la densidad ni el acabado de las ilustraciones. Faltan parque municipal jugable, muelles con mecánica propia, modelos de infraestructura de mayor escala, LOD por distancia y medición de rendimiento en ciudades densas. La fachada del proyecto puede requerir un segundo pase en zoom cercano. No se agregó ningún estado ni costo de simulación para obtener los nuevos detalles.


## Alfa 0.222 · Renovación integral de modelos

Se añadieron molduras biseladas, cornisas, marcos, soportes, cartelería y equipo de cubierta a los modelos de comercios, hoteles, escuelas, edificios cívicos, plantas de servicios, fábricas, depósitos, puertos y aeropuertos. Las casas conservan exactamente sus modelos anteriores.

El pase también cubre árboles y plazas, aceras y calzadas, semáforos y farolas, obras en proceso, puentes, estaciones, contenedores, tuberías y cables visibles, vehículos de calle, peatones, trenes, barcos, aviones y miniaturas del catálogo. Cada familia recibe piezas diferenciadas y formas redondeadas donde corresponde. Las geometrías se construyen en el renderizador compartido, por lo que Online, Offline y el catálogo mantienen la misma dirección visual.

La siguiente etapa puede centrarse en variaciones de estilo por barrio, acabados de fachada por material y una revisión visual de ciudades extensas en dispositivos móviles.
