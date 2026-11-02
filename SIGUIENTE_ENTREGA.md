# Siguiente entrega · después de Alfa 0.151

1. Terminar validación visual de la Alfa 0.151 en móvil/escritorio, en particular direcciones de semáforos, farolas, el túnel y el panel de modalidad; cerrar todo overflow reportado.
2. Verificar exportación industrial por barco y avión con estado real de órdenes, límites del patio/terminal, movimiento de vehículos y pago al productor; hoy hay pruebas completas para ruta terrestre en Online/Offline.
3. Priorizar sistemas de pasajeros: conductores/pasajeros en taxis y colectivos, estaciones de subte con cámara de subsuelo, cruceros y acceso desde aeropuerto. Mantener avances mecánicos frecuentes.
4. Probar llegada de hogares después de terminar una vivienda zonificada en una partida nueva Offline y Online, incluyendo guardado/reanudación de una obra heredada.
5. Al preparar publicación: actualizar release_notes.json, ESTADO_DESARROLLO.md, CONTINUIDAD_IA.md, DECISIONES_TECNICAS.md, AUDITORIA_ROADMAP.md y workflow; zip completo; commit GitHub noreply; push `main`; comprobar SHA y CI.

Global: aún no estimable por falta de pesos comunes aceptados/verificables para las 34 fases. Fases evaluadas: 4 = 60%, 7 = 95%, 9 = 75%.

# Siguiente entrega · después de Alfa 0.150

La Alfa 0.150 implementa depósitos y circuitos manuales de taxi con movimiento visible, dos a ocho paradas, capacidad de cuatro vehículos por depósito, costos, ruta conectada, pausa/reanudación/retiro y persistencia Online/Offline. No simula todavía pasajeros, conductores ni ingresos por tarifa. Fase 7 sigue en 95%; fase 4 en 60%, fase 9 en 75%; global no estimable sin criterios y pesos verificables comunes.

Próximo sistema: completar taxis bajo demanda conectando personas, horarios/conductores, destino y tarifa a movilidad; después construir el primer recorrido subterráneo con estaciones viales/conexión, capacidad y cámara que oculte la superficie. Después añadir pasajeros de cruceros y enlazar el aeropuerto con destinos urbanos. No desviar entregas a pulido visual aislado.

Publicación requerida en `main` con el correo `66056611+TobyMorel@users.noreply.github.com`; adjuntar un ZIP completo excluyendo `.git`, dependencias instaladas, partidas guardadas y ZIPs anteriores.
