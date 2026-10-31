Roadmap fuente: `ROADMAP_JUGABILIDAD_CIUDAD_VIVA_V2_REALISMO_PROFUNDO.md`.

# Siguiente entrega · continuidad

1. Completar fase 21 con programas de formación que ocupen presupuesto y plazas, tarden varios ciclos y eleven habilidades de cohortes concretas.
2. Hacer que salarios, estabilidad, gastos de hogar y oportunidades influyan en cambios de empleo y mudanzas trazables.
3. Implementar redes físicas de agua, energía, cloacas y residuos con capacidad, costos y fallas.
4. Ampliar mapas mediante sectores cargables y optimizar instancias/LOD antes de ciudades grandes.
5. Implementar responsabilidades municipales, apoyo y elecciones conforme a las fases del roadmap.

Alfa 0.20 simplifica la interfaz con un dock sobre el mapa y paneles emergentes. El historial paginado de 0.1–0.33 se mantiene en `release_notes.json`; actualizarlo en cada subida. Los registros originales 0.1–0.9 no están en el historial de este repositorio y quedan señalados como no conservados. Alfa 0.21 registra el tiempo que los residentes buscan trabajo y Alfa 0.22 agrega filtros básicos de habilidades, salario esperado y acceso. Alfa 0.23 permite iniciar cursos de comercio, administración y logística con cohorte, acceso, duración, costo, mejora de habilidades y control de saldo en ambos modos. La fase 21 sigue parcial; educación formal, capacidad docente y diferencias territoriales continúan pendientes. Alfa 0.24 inicia la fase 22 con elección modal laboral a pie/auto, tiempo puerta a puerta, congestión vehicular y emisiones aproximadas. Alfa 0.25 incorpora flotas de bus con frecuencia, aforo, tarifa, cobro familiar, gastos y efecto modal; Alfa 0.26 añade paradas en edificios junto al recorrido y cobertura de varios pares hogar–empleo por línea. Alfa 0.27 convierte las paradas seleccionadas en obras municipales, estaciones 3D y desvíos con mantenimiento. El próximo incremento debe asignar conductores identificables con turnos, materializar depósitos y permitir transbordos; después seguir con tren y carga. Offline juega y guarda en el navegador en Vercel; Online conecta a la sala LAN servida por el anfitrión. La transferencia entre equipos físicos por Wi-Fi continúa pendiente de una prueba fuera de este entorno.

Alfa 0.28 incorpora sala LAN explícita, descubrimiento UDP local, subcategorías en Ciudad, sonidos básicos y colectivo 3D reconocible. Siguiente paso concreto: validar conexión entre dos máquinas reales, persistencia del anfitrión al reconectar y ocupación de conductores por turno; revisar el rendimiento del render con más edificios.

Alfa 0.29 asigna conductores identificables a cada línea y vincula la dotación con el servicio real en ambos modos. Próximo: depósitos físicos de bus, transbordos, horarios completos y prueba LAN entre dos computadoras.

Alfa 0.30 habilita una cochera construible de cuatro plazas, vinculada por ruta vial a las líneas. El siguiente incremento debe dar turnos de conducción separados y transbordos. La prueba LAN física continúa pendiente.

Alfa 0.31 exige dos conductores distintos por colectivo, uno por turno pico; con dotación incompleta el vehículo no se cuenta. Próximo: transbordos reales entre líneas y horario más allá de los picos. La prueba LAN física sigue pendiente.

Alfa 0.32 habilita un transbordo físico entre dos líneas por una parada construida, con ocupación y cobro por tramo. Próximo: viaje de regreso separado, horario por franja, boleto integrado y validación LAN entre dos computadoras.

Alfa 0.33 descuenta el segundo tramo del transbordo y separa ingresos por línea sin duplicar pagos. Próximo: viaje de regreso en el turno de tarde, capacidad bidireccional y horario por franja; después trenes y carga. La prueba LAN física continúa pendiente.
