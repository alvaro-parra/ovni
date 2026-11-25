# OVNI — Documento de Requisitos de Interfaz

> Requisitos de la interfaz de la **web app** de OVNI. Este documento cubre
> **cómo debe verse y comportarse** la aplicación. Las reglas del juego están en
> [`REQUISITOS.md`](./REQUISITOS.md).

**Estado:** Borrador v0.1 · **Fecha:** 2026-11-11

---

## 1. Plataforma

- **R-UI-PLAT-1.** La interfaz es una **web app responsive**, diseñada
  **mobile-first** y que debe escalar correctamente a tablet y escritorio.

---

## 2. Público objetivo y principio rector

> ⚠️ **Requisito transversal.** La app será usada principalmente por:
> - **Personas mayores con dificultad visual** (baja agudeza, problemas de
>   contraste, posible temblor o menor precisión al tocar).
> - **Niños pequeños que pueden no saber leer bien** (o nada).

- **R-UI-PUB-1.** **La interfaz debe ser usable sin necesidad de leer.** Toda
  acción e información esencial debe entenderse mediante **iconos, colores,
  imágenes y símbolos**, no solo texto.
- **R-UI-PUB-2.** Prima siempre la **claridad y el tamaño** sobre la densidad de
  información o la estética. Ante la duda: más grande, más contraste, menos texto.
- **R-UI-PUB-3.** El flujo de juego debe poder completarse (jugar carta, robar,
  elegir palo, ver de quién es el turno) **reconociendo elementos de un vistazo**,
  sin instrucciones escritas.

---

## 3. Requisitos de accesibilidad

### 3.1 Legibilidad y visión

- **R-UI-A11Y-1.** **Tipografía grande** por defecto y tamaños de carta amplios.
  Evitar textos pequeños; números y figuras de las cartas claramente visibles.
- **R-UI-A11Y-2.** **Alto contraste** entre texto/elementos y fondo (objetivo:
  cumplir o superar WCAG 2.1 AA, idealmente AAA en elementos clave).
- **R-UI-A11Y-3.** **No depender solo del color** para transmitir información
  (turno, carta jugable, palo): acompañar siempre con icono, forma, borde o texto.
- **R-UI-A11Y-4.** Opción de **modo de texto/elementos aún más grandes** y/o modo
  de **contraste reforzado** para quien lo necesite.

### 3.2 Interacción táctil

- **R-UI-A11Y-5.** **Áreas táctiles grandes** y bien separadas (objetivo mínimo
  ~44×44 px, preferiblemente mayores), para reducir toques erróneos.
- **R-UI-A11Y-6.** Interacciones **simples y tolerantes**: tocar para jugar/robar;
  si se usa arrastrar, que haya siempre alternativa de toque. Evitar gestos
  complejos o precisos.
- **R-UI-A11Y-7.** **Confirmación visual clara** de cada acción (carta jugada,
  carta robada, turno pasado), con feedback inmediato.

### 3.3 Apoyos no textuales (clave para niños)

- **R-UI-A11Y-8.** Uso de **iconografía y color consistentes** para los cuatro
  palos (Oros, Copas, Espadas, Bastos), reconocibles por su dibujo.
- **R-UI-A11Y-9.** **Pistas visuales/animaciones** para los efectos especiales
  (roba 2, cambio de sentido, palo elegido) que se entiendan sin leer.
- **R-UI-A11Y-10.** (Deseable) **Apoyo sonoro / locución** opcional para reforzar
  acciones y turnos, útil tanto para baja visión como para pre-lectores.

---

## 4. Modo de juego

- **R-UI-MODO-1.** **Un jugador humano contra 1–3 bots**, en un solo dispositivo
  (2–4 jugadores en total, R-CFG-1). No hay modo *pass-and-play* (varios humanos
  pasándose el dispositivo): está descartado. *(Decidido en §8, Q1.)*
- *(Posible mejora futura, fuera de alcance por ahora: modo **online con lobby** entre varios humanos.)*

---

## 5. Pantallas

- **R-UI-SCR-1. Inicio:** elegir el **número de rivales bot (1–3)** y el
  **avatar** del jugador (**avatares con imágenes** grandes en lugar de texto), y
  botón de empezar grande y claro.
- **R-UI-SCR-2. Mesa de juego (principal):**
  - Pila de descarte central (carta activa) y mazo de robo con **contador** de
    cartas.
  - **Mano del jugador** en abanico en la parte inferior, con cartas **jugables
    resaltadas** y no jugables atenuadas (con apoyo no cromático, R-UI-A11Y-3).
  - Oponentes alrededor de la mesa: avatar, nombre, **nº de cartas en mano** y
    **puntos acumulados**, mostrados con iconos/números grandes.
  - Indicador muy visible de **de quién es el turno** y del **sentido de juego**.
  - Acciones de **jugar** y **robar** grandes y evidentes.
- **R-UI-SCR-3. Selector de palo (Sota):** overlay para elegir
  Oros/Copas/Espadas/Bastos con **botones grandes e ilustrados**; indicador
  persistente del **palo forzado** mientras esté activo.
- **R-UI-SCR-4. Marcador / fin de ronda:** recuento de puntos de cada jugador en
  la ronda y **total acumulado**, resaltando al ganador de la ronda y avisando
  visualmente de quién **se acerca o llega a 101**.
- **R-UI-SCR-5. Eliminación y victoria:** estado de jugador **eliminado** (≥101) y
  pantalla de **victoria** del ganador final (o **empate** si varios terminan con
  la puntuación mínima), con celebración visual clara.

---

## 6. Componentes clave

- **R-UI-COMP-1. Carta:** componente reutilizable (cara y dorso) para la baraja
  española, con número/figura y palo grandes y de alto contraste.
- **R-UI-COMP-2. Indicador de turno:** elemento destacado (resaltado del jugador
  activo + flecha/animación de sentido).
- **R-UI-COMP-3. Indicador de palo activo:** visible siempre que un palo esté
  forzado por una Sota.
- **R-UI-COMP-4. Marcador de puntos:** por jugador, con indicación visual de
  proximidad a 101 (p. ej. barra que se llena / cambio de estado).
- **R-UI-COMP-5. Avisos de efectos especiales:** roba 2, cambio de sentido,
  repetir turno — comunicados con animación/icono, sin depender del texto.

---

## 7. Estados e interacciones a representar

- **R-UI-EST-1.** Carta jugable vs. no jugable.
- **R-UI-EST-2.** Turno propio vs. turno de otro jugador.
- **R-UI-EST-3.** Selección de palo activa (Sota) y palo forzado resultante.
- **R-UI-EST-4.** Efecto "roba 2": aviso claro de que el siguiente roba 2 y pierde
  turno.
- **R-UI-EST-5.** Cambio de sentido de juego (As con 3+ jugadores).
- **R-UI-EST-6.** Contadores actualizados: cartas en mano, cartas en el mazo,
  puntos acumulados.
- **R-UI-EST-7.** Proximidad a 101 y estado de eliminación por jugador.

---

## 8. Decisiones

- **Q1. ✅ Resuelta (2026-11-24).** **Modo de juego:** ¿online con lobby, local
  pass-and-play o contra IA? → **Contra bots** (1 humano contra 1–3 bots). El
  pass-and-play queda descartado. Actualizados §4 (R-UI-MODO-1) y §5 (R-UI-SCR-1).

**Pendientes:**

- **Q2.** **Identidad visual:** ¿hay nombre de marca, logo o paleta de colores
  definidos, o los propone el diseño?
- **Q3.** **Apoyo sonoro/locución** (R-UI-A11Y-10): ¿se incluye desde el inicio o
  queda como mejora posterior?
  *(Mientras no se decida, la mesa no muestra botón de sonido: se retiró porque
  no hacía nada.)*

---

## 9. Decisiones de diseño aplicadas (noviembre 2026, fase alfa)

Tomadas durante las sesiones de pulido de UI/UX; revisables. Cada una indica a qué
requisito responde.

- **Responsive (R-UI-PLAT-1).** El diseño de 390 px se adapta al alto del móvil y se
  amplía en tableta/escritorio (nunca se reduce). En pantallas **apaisadas** (tableta en
  horizontal, móvil girado) todas las pantallas se reparten en **columnas**: la mesa (mesa |
  tu mano), el inicio (título | rivales | avatar), el recuento (jugadores de dos en dos) y
  la final (resultado | clasificación). La acción principal de cada pantalla está siempre a
  la vista (botón fijo abajo).
- **Ver mejor (R-UI-A11Y-4).** Interruptores de **letra grande** (×1,25, sin dejar la mesa
  por debajo de 320 px de ancho; las cartas de tu mano nunca salen más pequeñas que en el
  modo normal) y **contraste reforzado** (además, se activa solo si el sistema lo pide), en
  el inicio y en la mesa (botón del ojo).
- **Ritmo y avisos (R-UI-A11Y-7, R-UI-A11Y-9, R-UI-COMP-5).** Cada jugada de un bot se ve
  en fases: piensa (puntos animados) → su carta vuela a la mesa → aviso grande si hay
  efecto (+2, cambio de sentido, vuelve a jugar, palo elegido, carta inicial, fin de
  ronda). Las cartas que te llegan vuelan del mazo a su sitio. **Velocidad** Despacio /
  Normal / Rápido (inicio y «Ver mejor»). Con «reducir movimiento» del sistema no hay
  vuelos, pero sí pausas. Flechas entre rivales indican el **sentido de juego**. Al empezar
  cada ronda, aviso «Ronda N · Empieza X». En el turno de otro, tu mano se atenúa un poco
  (salvo en modo contraste). Los avisos no bloquean: si ya es tu turno, tocar una carta la
  juega a la primera.
- **+2 con casos límite (R-DOS-1, R-DOS-4, R-MAZO-2).** El aviso muestra las cartas
  robadas de verdad (puede ser 1 o ninguna si no quedan) y avisa si se rebarajó la mesa o
  si el 2 terminó la ronda.
- **Pistas al equivocarse (R-UI-A11Y-7).** Tocar una carta que no vale, o el mazo teniendo
  jugada, no se ignora: la carta tiembla y se explica por qué («Esa no vale: necesitas
  Oros o un 11»).
- **Evitar pérdidas.** Salir de la partida pide confirmación; la Sota se puede cancelar
  («Volver»); la partida se **guarda en el dispositivo** y se puede continuar si el móvil
  recarga la página.
- **Primeras partidas.** Reglas resumidas con un dibujo por regla (botón «? Reglas»,
  destacado hasta la primera vez) y, en tus 3 primeros turnos, una **manita** que señala qué
  tocar. El inicio muestra cuántas partidas has ganado en el dispositivo.
- **Instalable** en la pantalla de inicio del móvil (pantalla completa, icono propio),
  **funciona sin conexión** tras la primera visita y sin dependencias externas en tiempo de
  ejecución (tipografía servida con la app). Respeta la muesca y la barra de inicio.
- **Teclado y lectores de pantalla.** Foco visible; los diálogos retienen el foco y se
  cierran con Escape cuando tiene sentido; se anuncia qué se juega y qué se roba.
