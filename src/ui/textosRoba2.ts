// Textos del «roba 2» según lo que pasó de verdad (R-DOS-1, R-DOS-4, R-MAZO-2). Lógica pura.
//
// Casos límite: el mazo puede no tener 2 cartas. Se rebaraja la pila de la mesa una sola vez
// por ronda; si aun así no llega, se roban las que haya (1 o ninguna). Si el 2 era la última
// carta de quien lo jugó, se roba igualmente y después termina la ronda: lo robado cuenta.

export interface DatosRoba2 {
  /** Cartas robadas de verdad (0, 1 o 2). */
  n: number
  rebarajado: boolean
  finRonda: boolean
}

export interface TextosRoba2 {
  /** Línea principal: qué se roba. */
  robo: string
  /** Aclaración si se rebarajó la mesa, o null. */
  rebaraje: string | null
  /** Consecuencia: pierde el turno, o termina la ronda (y lo robado suma puntos). */
  consecuencia: string
  /** Resumen en una frase, para lectores de pantalla. */
  resumen: string
}

/**
 * @param victima nombre de quien roba, o null si eres tú (segunda persona).
 * @param actor nombre de quien jugó el 2 (para el caso de fin de ronda), o null si eres tú.
 */
export function textosRoba2(d: DatosRoba2, victima: string | null, actor: string | null): TextosRoba2 {
  const tu = victima === null
  const robo =
    d.n >= 2
      ? tu ? 'Robas estas 2 cartas' : `${victima} roba 2 cartas`
      : d.n === 1
        ? tu ? 'Robas 1 carta: no quedaban más' : `${victima} roba 1 carta: no quedaban más`
        : tu ? 'No quedan cartas: no robas' : `No quedan cartas: ${victima} no roba`
  const rebaraje = d.rebarajado ? 'Se barajaron las cartas de la mesa para hacer un mazo nuevo' : null
  // `actor` null: el 2 lo has jugado tú (segunda persona: «te quedas sin cartas»).
  const sinCartas = actor === null ? 'Te quedas sin cartas' : `${actor} se queda sin cartas`
  const consecuencia = d.finRonda
    ? d.n > 0
      ? `${sinCartas}: fin de la ronda. ${tu ? 'Estas cartas cuentan en tus puntos' : 'Lo robado cuenta en sus puntos'}`
      : `${sinCartas}: fin de la ronda`
    : tu ? 'Pierdes el turno' : `${victima} pierde el turno`
  const resumen = [robo, rebaraje, consecuencia].filter(Boolean).join('. ')
  return { robo, rebaraje, consecuencia, resumen }
}
