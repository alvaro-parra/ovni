# OVNI — Documento de Requisitos

> Documento de requisitos del juego de cartas **OVNI**. Recoge las **reglas del
> juego** como requisitos funcionales. Los requisitos de implementación
> (plataforma, interfaz, multijugador, IA, etc.) quedan fuera de su alcance y se
> tratarán en un documento aparte.

**Estado:** Borrador v0.1 · **Fecha:** 2026-11-11

---

## 1. Visión general

OVNI es un juego de cartas por turnos, de la familia de los "ochos locos" (tipo
UNO), jugado con **baraja española de 40 cartas**. Cada jugador intenta
**deshacerse de todas sus cartas** antes que el resto. Las cartas que quedan en
mano al final de cada ronda suman **puntos de penalización**: acumular **101 o
más puntos elimina** al jugador. Gana el último que sobreviva.

---

## 2. Glosario

| Término | Definición |
|---|---|
| **Ronda** | Una mano completa: desde el reparto hasta que un jugador se queda sin cartas (o se cumple una condición de fin de ronda). |
| **Partida** | Conjunto de rondas que se juegan hasta que queda un único ganador. |
| **Mano / Dealer** | Jugador que reparte en la ronda actual. La posición rota cada ronda. |
| **Mazo de robo** | Montón de cartas boca abajo del que se roba. |
| **Pila de descarte** | Montón de cartas jugadas boca arriba; su carta superior marca lo que se puede jugar. |
| **Carta jugable** | Carta que se puede poner legalmente sobre la pila de descarte (ver §6). |

---

## 3. Componentes

- **R-COMP-1.** Una baraja española de **40 cartas**: palos Oros, Copas, Espadas y
  Bastos, con valores As, 2, 3, 4, 5, 6, 7, Sota, Caballo y Rey (sin 8 ni 9).
- **R-COMP-2.** Soporte para llevar la **puntuación acumulada** de cada jugador.

---

## 4. Configuración de la partida

- **R-CFG-1.** La partida admite de **2 a 4 jugadores**.
- **R-CFG-2.** Cada jugador recibe **5 cartas** al inicio de cada ronda.
- **R-CFG-3.** El **sentido de juego por defecto es antihorario**.
- **R-CFG-4.** Existe una posición de **mano/dealer** que **rota en sentido
  antihorario** en cada ronda.
- **R-CFG-5.** En la **primera ronda**, la posición de mano/dealer se decide por
  **sorteo**.
- **R-CFG-6.** El **turno inicial** de cada ronda corresponde al **jugador
  siguiente** a la mano/dealer (en el sentido de juego vigente).
- **R-CFG-7.** Tras repartir, se coloca la **primera carta del mazo de robo** boca
  arriba para iniciar la pila de descarte, y **se aplican sus efectos** (ver §7).

---

## 5. Objetivo y condiciones de victoria

- **R-OBJ-1.** El objetivo de cada ronda es **quedarse sin cartas** antes que el
  resto.
- **R-OBJ-2.** Al terminar una ronda, cada jugador **suma a su marcador** los
  puntos de las cartas que conserve en mano (ver §9). El ganador de la ronda, al
  no tener cartas, suma 0.
- **R-OBJ-3.** Un jugador que alcance **101 puntos o más** queda **eliminado**.
  El resto de jugadores **continúa** la partida.
- **R-OBJ-4.** **Victoria normal:** cuando queda **un único jugador con menos de
  101 puntos**, ese jugador **gana la partida**.
- **R-OBJ-5.** **Empate / eliminación simultánea:** si en una misma ronda todos
  los jugadores restantes alcanzan 101 o más, gana **el que menos puntos tenga**.
  Si hay empate a la puntuación más baja, **todos los empatados ganan**.

---

## 6. Desarrollo del turno y reglas de juego

- **R-JUEGO-1.** En su turno, un jugador debe jugar una **carta jugable** sobre la
  pila de descarte.
- **R-JUEGO-2.** Una carta es jugable si **coincide en número o en palo** con la
  carta superior de la pila de descarte.
- **R-JUEGO-3.** La **Sota** es un comodín: se puede jugar **siempre**, en
  cualquier circunstancia (ver §7).
- **R-JUEGO-4.** **Jugar es obligatorio:** si el jugador tiene al menos una carta
  jugable, **debe jugarla**. No puede optar por robar teniendo jugada válida.
- **R-JUEGO-5.** Si el jugador **no tiene ninguna carta jugable**, debe **robar
  del mazo** hasta obtener una carta que pueda jugar, y **jugarla** en ese mismo
  turno.
- **R-JUEGO-6.** Tras resolver la carta jugada (incluidos sus efectos), el turno
  pasa al **siguiente jugador** según el sentido de juego vigente, salvo que un
  efecto indique lo contrario.

---

## 7. Cartas especiales

### 7.1 As

- **R-AS-1.** Con **3 o más jugadores**, el As **invierte el sentido** de juego.
- **R-AS-2.** Con **2 jugadores**, el As hace que **el jugador que lo juega
  vuelva a jugar** (repite turno).
- **R-AS-3.** El As es además una carta normal de su palo (jugable por número "As"
  o por palo).

### 7.2 El 2 ("roba dos")

- **R-DOS-1.** Al jugarse un 2, **el siguiente jugador roba 2 cartas de forma
  incondicional** y **pierde su turno**.
- **R-DOS-2.** El 2 **no se puede encadenar ni responder**: aunque el afectado
  tenga otro 2, siempre roba 2 y pasa turno.
- **R-DOS-3.** Con **2 jugadores**, tras robar 2 y perder turno el oponente,
  **vuelve a jugar el jugador que puso el 2**.
- **R-DOS-4.** Si el jugador que juega el 2 **se queda con 0 cartas** (gana la
  ronda con esa jugada), el siguiente jugador **roba 2 cartas antes de contar los
  puntos** de la ronda.
- **R-DOS-5.** El 2 es además una carta normal de su palo (jugable por número "2"
  o por palo).

### 7.3 Sota (comodín)

- **R-SOTA-1.** La Sota se puede jugar **en cualquier momento**, sobre cualquier
  carta.
- **R-SOTA-2.** Al jugarla, el jugador **declara el palo** que se debe seguir
  jugando. El siguiente debe jugar una carta del palo declarado (o cualquier
  Sota).
- **R-SOTA-3.** En **puntuación**, la Sota vale **50 puntos** (penalización alta).

---

## 8. Carta inicial y gestión del mazo

### 8.1 Carta inicial

- **R-INI-1.** La primera carta volteada inicia la pila de descarte y **se aplican
  sus efectos como si la hubiera jugado la mano/dealer**:
  - **R-INI-1a.** Si es un **2**, el primer jugador (el siguiente a la mano) roba
    2 y pierde turno según R-DOS-1/R-DOS-3.
  - **R-INI-1b.** Si es un **As**, se aplican sus reglas (§7.1) como si lo hubiera
    jugado la mano/dealer. En consecuencia, **con 2 jugadores el As inicial
    otorga a la mano/dealer el "vuelve a jugar": empieza la propia mano/dealer**
    (no el siguiente jugador). Con 3+ jugadores, invierte el sentido.
  - **R-INI-1c.** Si es una **Sota**, **no actúa como comodín**: se usa
    únicamente su **palo** como palo a seguir.

### 8.2 Robo y reciclaje del mazo

- **R-MAZO-1.** Las cartas se roban del **mazo de robo**.
- **R-MAZO-2.** Si el mazo de robo se **agota**, se **rebaraja** la pila de
  descarte para formar un nuevo mazo. Esto se permite **una sola vez** por ronda.
- **R-MAZO-3.** Si el mazo vuelve a agotarse (tras la única rebaraja permitida) y
  el jugador en turno **no puede jugar ni robar**, la **ronda termina de
  inmediato**: **ningún jugador gana la ronda** y **todos** suman a su marcador
  los puntos de las cartas que tengan en mano. A continuación se aplican las
  reglas de eliminación y victoria (§5).

---

## 9. Puntuación

- **R-PUNT-1.** Al final de cada ronda, cada jugador suma el valor de las cartas
  que conserve en mano, según la siguiente tabla:

| Carta | Puntos | | Carta | Puntos |
|---|---:|---|---|---:|
| As | 1 | | 6 | 6 |
| 2 | 20 | | 7 | 7 |
| 3 | 3 | | Sota | 50 |
| 4 | 4 | | Caballo | 10 |
| 5 | 5 | | Rey | 10 |

- **R-PUNT-2.** Los puntos se **acumulan** de ronda en ronda en el marcador de
  cada jugador.
- **R-PUNT-3.** Alcanzar **101 o más** implica eliminación (ver §5).

---

## 10. Flujo de una ronda (resumen)

1. Rota la mano/dealer (antihorario); en la 1ª ronda, sorteo.
2. Se reparten 5 cartas a cada jugador.
3. Se voltea la primera carta y se aplican sus efectos (§8.1).
4. Empieza el jugador siguiente a la mano; se juega por turnos (§6, §7).
5. La ronda termina cuando un jugador se queda sin cartas (o por R-MAZO-3).
6. Se cuentan puntos (§9) y se actualizan marcadores.
7. Se eliminan los jugadores con ≥101 puntos.
8. Si queda un único jugador (<101), gana (§5). Si no, se juega otra ronda.

---

## 11. Casos límite a tener en cuenta

- **CL-1.** Varios jugadores pueden ser **eliminados en la misma ronda**.
- **CL-2.** Ganar la ronda jugando un **2** como última carta: el siguiente roba 2
  antes del recuento (R-DOS-4).
- **CL-3.** **As inicial con 2 jugadores:** el efecto "vuelve a jugar quien lo
  jugó" se aplica a la mano/dealer, por lo que **empieza la mano/dealer** en vez
  del siguiente jugador (ver R-INI-1b).
- **CL-4.** Robo forzoso cuando no hay jugada: el jugador acumula cartas hasta
  encontrar una jugable (impacta en su puntuación si la ronda acaba por R-MAZO-3).
