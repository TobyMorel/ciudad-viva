## Publicación Alfa 0.163 · historial completo y preventivo

Se publicaron entradas específicas de Alfa 0.162 para el puente y de Alfa 0.163 para viajes de pasajeros de taxi en la pantalla «Cambios y novedades». Se sincronizan título de pestaña, metadato de versión, importaciones y recuperación de caché, paquetes de CI y prueba de arranque de Cambios. El pipeline exige en cada PR con código nuevo una versión superior y notas visibles. **Próximo hito de simulación:** personal y turnos de taxis, despacho, subte e intermodalidad.

## Fase 7 · pasajeros reales en circuitos de taxi

Los taxis recogen demanda ya existente de desplazamientos en automóvil hacia comercios y equipamientos cívicos cuando origen y destino están a una cuadra de dos paradas diferentes y el circuito vial permanece conectado. Se limitan a ocho pasajeros diarios por vehículo; esos viajeros dejan de computar como autos particulares en el modelo de esos desplazamientos. Se añaden ocupación diaria, ingreso tarifario acumulado en cada mes y proyección orientativa, con flujo vial y emisiones del taxi. La facturación se asienta por día, sin duplicarse al consultar repetidamente el estado; el cierre municipal incorpora los ingresos. Equivalencia Online/Offline y regresiones nuevas.

**Próximo:** integrar choferes habilitados, horarios, espera y despacho puerta a puerta; luego red de subte y transbordos de fase 7. Las tarifas siguen fijas, sin transporte de turistas o pasajeros aéreos. Probar LAN física y viaje por el puente en dispositivos reales. Sin porcentajes globales no ponderados.

## Fase 7 · cruce vial del río (integrado en main)

Se incorporó una primera obra contractual de puente sobre las dos celdas del cauce (x=24–25): requiere calle conectada en x=23 y suelo habilitado, compara constructoras con sus precios/plazos y no habilita los tramos hasta la inspección. Al finalizar, permite prolongar la red con una calle en x=26. Offline y LAN conservan el mismo contrato, gasto y mantenimiento; el render 3D muestra tablero, barandas y pilotes. Las pruebas cubren contratación, validaciones y cruce terminado.

**Próximo:** revisar la obra en partida larga y navegador real, verificar navegación de vehículos y expansión al este, medir balance y condición de puente; continuar viajes de pasajeros/transbordos y conexión intermodal de fase 7. La prueba LAN física entre dos equipos sigue pendiente. No calcular avance global sin pesos para las 34 fases.

## Después de Alfa 0.159

Retomar puentes para cruzar el río y movimiento de pasajeros en fase 7. Verificar en partida prolongada que los nuevos hospitales, comisarías y cuarteles atraigan personal y sus recursos entren en servicio; conservar la prueba de colocación inmediata en CI. Probar LAN física entre dos equipos. Global aún sin estimar hasta definir pesos comunes para las 34 fases.

## Después de Alfa 0.158

Avanzar la mecánica de puentes para cruzar el río sin bloquear la expansión al este; luego retomar pasajeros/transbordos y conexión intermodal de la fase 7. Vigilar rendimiento de la malla del río en dispositivos móviles. Probar LAN física entre dos equipos y mantener las regresiones de arranque y construcción. Global aún sin porcentaje por falta de pesos homogéneos para las 34 fases.

## Después de Alfa 0.157

Medir crecimiento sostenido de hogares y capital privado en una partida larga; luego avanzar fase 7 con pasajeros/transbordos y conectividad portuaria/aérea. Revisar que el mínimo de demanda no produzca congestión irreal en ciudades grandes y balancear sin detener el flujo de interesados.

## Después de Alfa 0.156

Retomar mecánicas de fase 7: pasajeros/transbordos y conexiones de subte, puerto y aeropuerto. Comprobar en partida real que el nuevo ritmo permite observar ciclos completos a x1/x2/x4. Mantener regresión de arranque offline y pruebas del reloj en cada publicación.

# Siguiente entrega · después de Alfa 0.156

1. Continuar hito de fase 7 con pasajeros/transbordos, subte/cámara inferior, cruceros y conexión del aeropuerto; no dedicar iteraciones seguidas solo a detalles.
2. Probar LAN física entre dos equipos y mantener las regresiones de modo local/Play/Pausa/Construir/Ciudad en CI.
3. Validar las miniaturas en dispositivos reales y ajustar el scroll del catálogo si el aumento de tamaño reduce demasiado el área de tarjetas.
4. Avanzar exportación industrial marítima/aérea con viajes y liquidación verificables.
5. Global permanece sin estimar mientras falten pesos homogéneos para las 34 fases.

## Alfa 0.155 · regresión detectada y resuelta

Se normalizan listas ausentes en guardados offline antiguos y el render 3D no asume `buildings`/`projects`. La prueba dedicada de Chromium para partida fresca y guardado heredado quedó agregada al workflow de cada push. Próximo: seguir fase 7 con una mecánica nueva (pasajeros/transbordos o subte), manteniendo la prueba de arranque.
