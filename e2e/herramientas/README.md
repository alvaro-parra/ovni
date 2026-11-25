# Herramientas de prueba visual

Scripts para revisar la UI fuera de los e2e. No los ejecuta el CI.

- `con-preview.sh <comando…>` — compila, sirve el build en `:5199`, ejecuta el comando y
  cierra el servidor.
- `auditoria.mjs <url> <salida.png> <WxH> <seed> <rivales> [vistaJSON]` — juega una partida
  con `?fast` y monta una hoja de contactos con cada pantalla (inicio, mesa, palo, +2, fin de
  ronda, victoria…). `vistaJSON` p. ej. `'{"grande":true,"contraste":true}'`.
- `robusto.mjs <url> <seedDesde> <seedHasta> <rivales> <limiteSeg>` — partidas completas a
  ritmo real (velocidad rápida) una tras otra; avisa de `ATASCO` si nada cambia en 8 s.

Todas usan un solo navegador y una página a la vez (el sandbox tiene 2 GB de RAM).
- `medidas.mjs <url> <seed> <rivales> <WxH,...> [vistaJSON]` — ancho real de las cartas de tu
  mano y de la mesa en tu primer turno, a varios tamaños (para comparar antes/después).
