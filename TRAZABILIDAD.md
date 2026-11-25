# OVNI — Trazabilidad requisitos ↔ tests

Cada requisito de [`REQUISITOS.md`](./REQUISITOS.md) tiene al menos un test que lo
verifica. Esta correspondencia se **comprueba automáticamente** en
[`tests/coverage.test.ts`](./tests/coverage.test.ts): si se añade un requisito sin
test (o se renombra), la suite falla.

**Estado (25-nov-2026):** todos los IDs cubiertos. Suite unitaria: 138 tests en 15 ficheros
(motor y lógica pura de la UI); además, 25 pruebas e2e de la interfaz (`e2e/`, Playwright).

| Requisito | Verificado en | Test |
|---|---|---|
| R-COMP-1 | `tests/cards.test.ts` | baraja de 40 cartas, 4 palos, 10 valores, sin 8 ni 9 |
| R-COMP-2 | `tests/match.test.ts` | la puntuación se acumula entre rondas |
| R-CFG-1 | `tests/match.test.ts` | la partida admite de 2 a 4 jugadores |
| R-CFG-2 | `tests/engine.test.ts` | reparto y carta inicial (5 cartas por jugador) |
| R-CFG-3 | `tests/engine.test.ts` | reparto y carta inicial (sentido antihorario) |
| R-CFG-4 | `tests/match.test.ts` | la mano rota en sentido antihorario cada ronda |
| R-CFG-5 | `tests/match.test.ts` | la mano inicial se fija por sorteo |
| R-CFG-6 | `tests/engine.test.ts` | reparto y carta inicial (empieza el siguiente a la mano) |
| R-CFG-7 | `tests/engine.test.ts` | reparto y carta inicial (carta volteada en descarte) |
| R-OBJ-1 | `tests/engine.test.ts` | quedarse sin cartas gana la ronda |
| R-OBJ-2 | `tests/engine.test.ts` | el resto cuenta sus puntos (ganador 0) |
| R-OBJ-3 | `tests/match.test.ts` | 101+ elimina y el resto continúa |
| R-OBJ-4 | `tests/match.test.ts` | último jugador por debajo de 101 gana |
| R-OBJ-5 | `tests/match.test.ts` | si todos superan 101, gana el menor (empate: ambos) |
| R-JUEGO-1 | `tests/engine.test.ts` | jugar es obligatorio; no se juega carta inválida |
| R-JUEGO-2 | `tests/engine.test.ts` | jugable si coincide en número o palo |
| R-JUEGO-3 | `tests/engine.test.ts` | la sota se puede jugar siempre |
| R-JUEGO-4 | `tests/engine.test.ts` | no se roba teniendo jugada |
| R-JUEGO-5 | `tests/engine.test.ts` | roba hasta encontrar carta jugable |
| R-JUEGO-6 | `tests/engine.test.ts` | el turno pasa al siguiente jugador |
| R-AS-1 | `tests/engine.test.ts` | con 3+ jugadores el as invierte el sentido |
| R-AS-2 | `tests/engine.test.ts` | con 2 jugadores el as hace repetir turno |
| R-AS-3 | `tests/engine.test.ts` | el as también es carta normal de su palo |
| R-DOS-1 | `tests/engine.test.ts` | el siguiente roba 2 y pierde el turno |
| R-DOS-2 | `tests/engine.test.ts` | el 2 no se encadena ni se responde |
| R-DOS-3 | `tests/engine.test.ts` | con 2 jugadores vuelve al que jugó el 2 |
| R-DOS-4 | `tests/engine.test.ts` | ganar con un 2 hace robar 2 antes de contar |
| R-DOS-5 | `tests/engine.test.ts` | el 2 también es carta normal de su palo |
| R-SOTA-1 | `tests/engine.test.ts` | la sota se puede jugar siempre |
| R-SOTA-2 | `tests/engine.test.ts` | la sota decide el palo a seguir |
| R-SOTA-3 | `tests/cards.test.ts` | tabla de valores (sota = 50) |
| R-INI-1 | `tests/engine.test.ts` | reparto y carta inicial |
| R-INI-1a | `tests/engine.test.ts` | 2 inicial: el primer jugador roba 2 |
| R-INI-1b | `tests/engine.test.ts` | as inicial (2 jugadores: empieza la mano; 3+: invierte) |
| R-INI-1c | `tests/engine.test.ts` | sota inicial fija su palo, no es comodín |
| R-MAZO-1 | `tests/engine.test.ts` | se roba del mazo de robo |
| R-MAZO-2 | `tests/engine.test.ts` | rebaraja una vez al agotarse el mazo |
| R-MAZO-3 | `tests/engine.test.ts` | segunda vez sin cartas termina la ronda |
| R-PUNT-1 | `tests/cards.test.ts` | tabla de valores de puntuación |
| R-PUNT-2 | `tests/match.test.ts` | la puntuación se acumula entre rondas |
| R-PUNT-3 | `tests/match.test.ts` | 101+ elimina |
| CL-1 | `tests/match.test.ts` | varias eliminaciones en la misma ronda |
| CL-2 | `tests/engine.test.ts` | ganar jugando un 2 (siguiente roba 2 antes de contar) |
| CL-3 | `tests/engine.test.ts` | as inicial con 2 jugadores: empieza la mano |
| CL-4 | `tests/engine.test.ts` | robo forzoso hasta encontrar jugable |
| CL-5 | `tests/mazo-cl5.test.ts` | 4 jugadores: el primero roba las 19 del mazo sin jugada; la ronda acaba sin ganador (R-MAZO-3) |
