# Rendimiento 3D en el navegador

Auditoría realizada el 3 de noviembre de 2026 para Ciudad Viva. La escena usa Three.js r171, comparte el mismo renderer entre partidas offline y online, y ya ejecuta la simulación offline en un Web Worker.

## Hallazgos del código

- Cada árbol cercano se construye como un grupo con tronco, copa, ramas, raíces y varios brotes: unas dos docenas de mallas por árbol. Al alejar la cámara, aumenta el área visible y se regeneran miles de árboles de ese tipo.
- El zoom lejano reduce la densidad de árboles, pero todavía usa mallas separadas. Las llamadas de dibujo y el recorrido del grafo de escena crecen con cada árbol.
- El renderer podía usar hasta 2× la densidad de píxeles del dispositivo. Esa escala dibuja hasta cuatro veces más píxeles que 1×.
- El modo online ya transmite cambios de estado desde el servidor y el modo offline ya usa un worker. El stutter al mover la cámara apunta primero al costo de renderizado de la escena.

## Cambios en Alfa 0.227

- Conservé los árboles detallados al acercarse. Al alejarse, los árboles pasan a cuatro o menos lotes InstancedMesh para troncos, copas y arbustos; así, el número de llamadas de dibujo deja de crecer árbol por árbol. Las copas lejanas también se mueven con el viento.
- El renderer limita el pixel ratio a 1.25 en móvil y 1.5 en escritorio. Mide la tasa de cuadros y baja gradualmente la resolución de render si queda por debajo de 38 FPS; la recupera lentamente cuando supera 56 FPS.
- La página expone diagnósticos de draw calls, triángulos, FPS medidos, resolución y vegetación para comparar dispositivos. Una prueba Playwright fuerza el zoom lejano con DPR 2 en una vista móvil y otra de escritorio, y comprueba que la vegetación use un máximo de cuatro lotes.
- El camino detallado sigue disponible para acercamientos y conserva el aspecto actual.

## Opciones investigadas

- **Three.js InstancedMesh (MIT):** es parte de la versión que el juego ya distribuye y permite dibujar muchas copias de una geometría/material con pocas llamadas. Lo usé para la vegetación lejana.
- **Three.js BatchedMesh:** puede juntar muchas geometrías diferentes que comparten material. Es una opción para estudiar después en caminos y edificios, pero exige que sus atributos y materiales coincidan.
- **SceneOptimizer:** es un complemento oficial que automatiza batches, pero Three.js lo describe como experimental. No lo puse en una escena donde los edificios cambian, tienen selección y distintas capas de detalle.
- **InstancedMesh2 (MIT):** compatible con Three.js r159 o posterior y agrega culling y LOD por instancia. La versión del juego es r171; queda como alternativa si las pruebas reales muestran que el LOD manual necesita culling de instancia más fino.
- **Babylon.js:** incluye thin instances y herramientas de hardware scaling, pero cambiar Three.js por Babylon implica reescribir el constructor de edificios, selección, materiales y cámara. No es un addon que se pueda instalar sin migrar el renderer.
- **OpenSA/GTA San Andreas:** es una reimplementación TypeScript/Three.js que carga archivos del juego y transmite sectores IPL/IDE al navegador. No es un plugin de rendimiento para otra simulación y su código usa AGPL-3.0. Los datos del juego deben aportarse aparte.
- **WebAssembly/C++:** es una buena ruta cuando un perfil demuestra que el CPU de una simulación es el cuello de botella. Esta simulación offline ya vive en un worker; moverla a WASM no reducirá por sí solo las llamadas de dibujo del mapa. Los hilos Wasm requieren SharedArrayBuffer y cabeceras COOP/COEP, algo que GitHub Pages no deja configurar desde este repositorio.

## Siguiente medición

La prueba automática comprueba el LOD, las llamadas y la carga de cuadros con Chromium SwiftShader; no reemplaza medir FPS en teléfonos y PCs reales. También conviene medir la reconstrucción completa de la capa dinámica cuando cambia una ciudad grande: hoy se vuelve a crear si cambia su firma visual. Si esa reconstrucción domina los picos después del LOD, será la siguiente parte para convertir a actualizaciones incrementales.

## Fuentes

- Three.js, Optimize Lots of Objects: https://threejs.org/manual/pages/optimize-lots-of-objects.html
- Three.js, InstancedMesh: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js, BatchedMesh: https://threejs.org/docs/pages/BatchedMesh.html
- Three.js, SceneOptimizer (experimental): https://threejs.org/docs/pages/SceneOptimizer.html
- InstancedMesh2, license MIT and Three.js r159+: https://github.com/agargaro/instanced-mesh
- OpenSA, engine notes and AGPL-3.0: https://github.com/Avatarchik/opensa
- Chrome, compiling C/C++ to WebAssembly: https://developer.chrome.com/docs/modern-web-guidance/guides/wasm/cpp-on-the-web
- Emscripten pthread requirements: https://emscripten.org/docs/porting/pthreads.html
- MDN, OffscreenCanvas in workers: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
