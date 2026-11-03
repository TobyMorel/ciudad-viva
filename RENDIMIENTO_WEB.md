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
- **OpenSA/GTA San Andreas:** fue un motor TypeScript/Three.js que transmitía sectores IPL/IDE al navegador; el repositorio del autor ahora marca el proyecto como cerrado y no publica una licencia vigente. Era un motor completo para esos formatos, no un complemento de Ciudad Viva.
- **WoW en navegador (Manila/Benilla):** es un cliente Rust/Bevy desde cero que compila a WebAssembly y usa WebGPU; requiere que el usuario aporte los datos del cliente y un servidor compatible. Es una referencia de ingeniería y medición, no un addon; incorporarlo significaría reemplazar el renderer y la arquitectura del juego.
- **WebAssembly/C++:** conviene cuando un perfil demuestra que el CPU de la simulación es el cuello de botella. La simulación offline ya vive en un worker y el online corre en el servidor; moverla a WASM no elimina las llamadas de dibujo. Los hilos Wasm requieren SharedArrayBuffer y cabeceras COOP/COEP, que este repositorio no configura en GitHub Pages.

## Cambios de Alfa 0.228 y 0.229

- En escritorio, las sombras dinámicas se apagan mientras el zoom está por debajo de 0.72 y se reactivan al acercar la cámara; los móviles ya renderizan sin sombras.
- En 0.229, casas y edificios lejanos usan tres mallas simples y recuperan el modelo detallado al acercar; los parques usan una sola base simplificada.
- La prueba de rendimiento confirma el modo de vegetación instanciada y el ajuste visual de sombras al alejarse en dos tamaños de pantalla. La ejecución SwiftShader sirve para comprobar el código, no para estimar FPS de GPU real.

## Siguiente medición

La prueba automática comprueba el LOD, los lotes, el límite de resolución, las sombras y el contexto WebGL en Chromium SwiftShader. Su tasa de cuadros no representa el rendimiento de una GPU real: para cuantificar FPS falta medir en el teléfono y la PC del jugador. También conviene medir la reconstrucción completa de la capa dinámica cuando cambia una ciudad grande: hoy se vuelve a crear si cambia su firma visual. Si esa reconstrucción domina los picos después del LOD, será la siguiente parte para convertir a actualizaciones incrementales.

## Fuentes

- Three.js, Optimize Lots of Objects: https://threejs.org/manual/pages/optimize-lots-of-objects.html
- Three.js, InstancedMesh: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js, BatchedMesh: https://threejs.org/docs/pages/BatchedMesh.html
- Three.js, SceneOptimizer (experimental): https://threejs.org/docs/pages/SceneOptimizer.html
- InstancedMesh2, license MIT and Three.js r159+: https://github.com/agargaro/instanced-mesh
- OpenSA, estado actual del repositorio: https://github.com/AlexSergey/opensa (upstream cerrado); https://github.com/Avatarchik/opensa (fork AGPL-3.0)
- Manila/Benilla, cliente WoW compatible con WASM/WebGPU y Apache 2.0: https://github.com/Adrinalin4ik/manila
- Chrome, compiling C/C++ to WebAssembly: https://developer.chrome.com/docs/modern-web-guidance/guides/wasm/cpp-on-the-web
- Emscripten pthread requirements: https://emscripten.org/docs/porting/pthreads.html
- MDN, OffscreenCanvas in workers: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
