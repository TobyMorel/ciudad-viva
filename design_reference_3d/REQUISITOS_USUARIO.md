# REDISEÑO COMPLETO DEL ARTE 3D DE CIUDAD VIVA

## CONTEXTO DEL PROYECTO

Estoy desarrollando **Ciudad Viva**, un simulador municipal de construcción y administración de ciudades que funciona en el navegador.

Sitio del juego: https://ciudadviva.vercel.app/

Te adjunto un archivo ZIP con 7 imágenes de referencia que representan el nuevo estilo visual que quiero implementar.

**Tu tarea es analizar estas imágenes y transformar el arte 3D actual del juego para que se parezca lo máximo posible a las referencias.**

No quiero simplemente insertar imágenes, colocar fondos prerenderizados ni crear una escena demostrativa separada. Quiero que los edificios, las calles, los árboles, las industrias, los servicios municipales, las construcciones y el entorno del juego sean auténticos objetos 3D integrados en el sistema existente.

---

## 1. ANÁLISIS INICIAL OBLIGATORIO

Antes de modificar código:

1. Explorá la estructura completa del proyecto.
2. Identificá el motor y las librerías 3D utilizadas.
3. Localizá los archivos responsables de generar edificios, calles, árboles, parcelas, terreno, agua y demás elementos.
4. Identificá cómo se posicionan, escalan y actualizan los modelos.
5. Analizá las siete imágenes del ZIP, individualmente.
6. Determiná qué elementos visuales se repiten y qué reglas artísticas comparten.
7. Establecé un sistema consistente de materiales, proporciones, geometría, iluminación y colores.

Si el proyecto utiliza Three.js, React Three Fiber u otra tecnología, trabajá sobre su arquitectura existente. No cambies de motor sin una justificación técnica clara.

No empieces a reemplazar modelos sin entender cómo funciona la simulación.

## 2. DIRECCIÓN ARTÍSTICA

Quiero un estilo **stylized low-poly premium**, similar a un juego moderno de construcción de ciudades.

### Características visuales

- Edificios con proporciones ligeramente caricaturizadas, pero arquitectónicamente coherentes.
- Geometría limpia con bordes bien definidos y biseles sutiles.
- Materiales mate, con variaciones suaves de color.
- Iluminación cálida, natural y agradable.
- Sombras suaves que aporten volumen.
- Colores vibrantes, pero equilibrados.
- Árboles redondeados con copas volumétricas.
- Tejados con geometría y materiales distinguibles.
- Ventanas, puertas, balcones y detalles arquitectónicos.
- Calles con veredas, cruces peatonales y señalización.
- Terreno verde con variaciones de vegetación.
- Costa, muelles y agua estilizada.

El resultado debe verse bien tanto con la cámara alejada como con zoom cercano.

**No quiero realismo fotográfico, estética voxel, modelos cúbicos demasiado simples ni exceso de polígonos.**

## 3. REDISEÑO DE EDIFICIOS RESIDENCIALES

Reemplazá visualmente los edificios residenciales actuales por modelos más elaborados.

Cada modelo debe contemplar:

- Fachadas con profundidad.
- Ventanas con marcos.
- Puertas de entrada.
- Balcones y barandas en ciertos edificios.
- Techos inclinados o planos según la variante.
- Chimeneas, canaletas y pequeños detalles.
- Variaciones de paredes en tonos crema, terracota, amarillo, verde salvia y azul grisáceo.
- Bases, accesos y pequeños espacios exteriores cuando corresponda.

Creá múltiples variantes visuales para que las ciudades no parezcan construidas con edificios idénticos.

La variedad debe producirse mediante modelos y componentes reutilizables, no mediante geometría innecesariamente duplicada.

## 4. COMERCIOS

Los comercios deben distinguirse visualmente de las viviendas.

Incorporá:

- Vidrieras amplias.
- Toldos de tela.
- Carteles comerciales discretos.
- Puertas de vidrio.
- Escalones y entradas.
- Macetas decorativas.
- Diferentes colores de fachada.

Creá variantes visuales como pequeños mercados, tiendas de barrio, locales gastronómicos y comercios urbanos.

Estas variantes deben respetar las categorías y las reglas del juego existentes.

## 5. INDUSTRIAS

Las construcciones industriales deben tener una identidad arquitectónica propia.

Modelá visualmente fábricas y establecimientos productivos con:

- Naves industriales.
- Galpones.
- Techos metálicos.
- Tuberías.
- Silos y depósitos.
- Chimeneas.
- Ventiladores y equipos de techo.
- Playas de carga.
- Portones industriales.
- Palés, cajas y materiales.

Diferenciá visualmente los tipos de industria que existan en el proyecto, como cantera, hormigonera, procesadora de alimentos, aserradero y metalúrgica.

Los modelos deben seguir siendo reconocibles desde la vista isométrica.

## 6. EDIFICIOS MUNICIPALES

Cada servicio público debe poder identificarse visualmente sin necesidad de abrir un panel.

### Salud

Consultorios, policlínicos y hospitales con arquitectura diferenciada, accesos claros, señalización sanitaria y detalles adecuados a su escala.

### Educación

Jardines, escuelas primarias, secundarias y universidades con accesos institucionales, ventanas amplias y arquitectura propia.

### Espacios públicos

Plazas y jardines municipales con senderos, bancos, árboles, flores, luminarias y mobiliario urbano.

Cada categoría debe mantener coherencia con su función, tamaño y nivel dentro del juego.

## 7. SISTEMA DE CALLES

Rediseñá visualmente las calles existentes.

Incorporá, cuando corresponda:

- Asfalto oscuro ligeramente desaturado.
- Líneas centrales y laterales.
- Cruces peatonales.
- Veredas.
- Cordones.
- Esquinas y uniones coherentes.
- Farolas.
- Señalización urbana.
- Pequeños detalles ambientales.

**Importante:** las calles deben conectarse correctamente en cualquier combinación de tramos, esquinas, intersecciones y extremos.

No deben aparecer huecos, solapamientos, marcas incorrectas ni elementos flotantes al construir o demoler.

Conservá el sistema de caminos, conexiones y navegación existente.

## 8. VEGETACIÓN Y TERRENO

Los árboles actuales deben transformarse en vegetación estilizada de mayor calidad.

Creá diferentes especies y siluetas:

- Árboles de copa redonda.
- Árboles de copa amplia.
- Árboles pequeños.
- Arbustos.
- Vegetación ornamental.
- Árboles de floración en lugares adecuados.

Utilizá pequeñas variaciones de tamaño, rotación y color.

El terreno debe incluir variaciones sutiles de césped, pequeñas irregularidades visuales y detalles naturales que no dificulten la lectura de las parcelas.

Evitá que los elementos decorativos interfieran con la construcción, selección o navegación.

## 9. AGUA Y COSTANERA

Tomá como referencia las imágenes de costa adjuntas.

Mejorá el aspecto del agua mediante:

- Color turquesa equilibrado.
- Movimiento superficial sutil.
- Reflejos y variaciones tonales.
- Transición visual entre agua y tierra.
- Ondas discretas.
- Bordes costeros más elaborados.

Cuando el sistema del juego lo permita, incorporá detalles como muros costeros, paseos, barandas, bancos y muelles.

No modifiques la forma ni la lógica del mapa costero sin necesidad.

## 10. CONSTRUCCIONES EN PROGRESO

Los edificios en construcción deben tener modelos propios, no limitarse a mostrar un edificio terminado.

Representá las distintas etapas mediante elementos como:

- Terreno preparado.
- Cimientos.
- Columnas.
- Estructuras de hormigón.
- Andamios.
- Materiales apilados.
- Cerramientos temporales.
- Maquinaria de construcción.
- Grúas en obras de mayor escala.

Estas representaciones deben vincularse al estado real de cada obra cuando la simulación disponga de esa información.

## 11. ILUMINACIÓN Y CÁMARA

Conservá el sistema de cámara actual, incluidos sus movimientos, rotación y zoom.

Ajustá la iluminación para conseguir:

- Luz ambiental equilibrada.
- Luz solar cálida.
- Sombras suaves.
- Mejor percepción de profundidad.
- Materiales legibles.
- Edificios distinguibles sobre el terreno.

Comprobá que el nuevo arte funcione desde todas las rotaciones de cámara.

Los detalles arquitectónicos deben existir en las fachadas correspondientes, no únicamente en la cara visible de una captura.

Evitá que la geometría atraviese el suelo o que las sombras generen artefactos.

## 12. OPTIMIZACIÓN

Este es un juego de navegador y debe continuar funcionando de forma fluida.

Aplicá las técnicas que correspondan:

- Geometrías reutilizables.
- Materiales compartidos.
- InstancedMesh para elementos repetitivos, cuando sea viable.
- Reducción de draw calls.
- Modelos con niveles de detalle cuando sea necesario.
- Uso controlado de texturas.
- Eliminación correcta de recursos al destruir objetos.
- Optimización de sombras.
- Evitar reconstrucciones innecesarias de geometría.

No agregues detalles que generen una caída significativa de rendimiento.

La calidad visual y la eficiencia deben mantenerse equilibradas.

## 13. RESPETAR EL JUEGO EXISTENTE

Esta condición es fundamental.

**No alteres las mecánicas del simulador.**

Conservá:

- Sistema de construcción.
- Parcelas y zonificación.
- Costos y economía.
- Crecimiento de población.
- Servicios municipales.
- Producción industrial.
- Obras y tiempos de construcción.
- Guardado y carga de partidas.
- Selección de edificios.
- Movimiento y rotación de cámara.
- Interacciones con el mapa.
- Compatibilidad con partidas existentes.

El rediseño debe afectar principalmente a la capa visual 3D.

No cambies los identificadores, estructuras de datos ni contratos internos sin necesidad.

## 14. INTERPRETACIÓN DE LAS IMÁGENES

Las siete imágenes adjuntas representan una dirección artística, no planos técnicos exactos.

Interpretalas como referencias para:

- Proporciones generales.
- Lenguaje visual.
- Estilo arquitectónico.
- Materiales.
- Colores.
- Iluminación.
- Densidad de detalles.
- Diseño urbano.
- Vegetación.
- Acabado final.

No copies errores de perspectiva, geometría imposible o inconsistencias propias de una imagen generada por IA.

**Transformá la referencia visual en modelos 3D reales, consistentes y utilizables desde cualquier ángulo.**

## 15. METODOLOGÍA DE IMPLEMENTACIÓN

Trabajá en etapas:

**Etapa 1 — Auditoría**

Identificá los sistemas existentes y elaborá un inventario de todos los modelos que necesitan rediseño.

**Etapa 2 — Sistema artístico**

Definí paleta, materiales, iluminación, proporciones, componentes reutilizables y convenciones de modelado.

**Etapa 3 — Primeros modelos**

Implementá una vivienda, un comercio, una calle y un árbol como muestra inicial del nuevo estilo.

**Etapa 4 — Expansión**

Aplicá el mismo sistema al resto de edificios, industrias, servicios, vegetación, obras y entorno.

**Etapa 5 — Integración**

Conectá los nuevos modelos a los generadores, estados y sistemas reales del juego.

**Etapa 6 — Validación**

Probá construcción, demolición, selección, zoom, rotación, persistencia de partidas y rendimiento.

## 16. RESULTADO ESPERADO

Quiero recibir:

1. Los modelos 3D implementados en el proyecto, mediante geometría procedural o archivos 3D compatibles con el motor existente.
2. Código organizado y reutilizable.
3. Materiales y sistema de iluminación coherentes.
4. Variantes arquitectónicas para evitar repetición.
5. Integración completa con las mecánicas.
6. Verificación de rendimiento y errores.
7. Capturas reales del juego desde distintos ángulos, antes y después del rediseño.

Si no tenés acceso al código del proyecto, indicá esa limitación y prepará modelos exportables, una especificación técnica y una estrategia de integración. No afirmes haber modificado el juego si solamente generaste renders.

## OBJETIVO FINAL

Quiero que Ciudad Viva pase de tener modelos 3D básicos a verse como un **city-builder independiente moderno, con una identidad visual cuidada, cálida y reconocible**.

El juego debe seguir siendo Ciudad Viva: mismo funcionamiento, mismas mecánicas y misma estructura urbana, pero con una transformación importante de su calidad gráfica.

Usá el ZIP adjunto como referencia artística principal. Priorizá reproducir su lenguaje visual de forma consistente y funcional dentro del juego real.