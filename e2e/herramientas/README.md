# Herramientas de prueba visual

Scripts para revisar la UI fuera de los e2e. No los ejecuta el CI.

- `con-preview.sh <comando…>` — compila, sirve el build en `:5199`, ejecuta el comando y
  cierra el servidor.
- `auditoria.mjs <url> <salida.png> <WxH> <seed> <rivales> [vistaJSON]` — juega una partida
  con `?fast` y monta una hoja de contactos con cada pantalla (inicio, mesa, palo, +2, fin de
  ronda, victoria…). `vistaJSON` p. ej. `'{"grande":true,"contraste":true}'`.
- `robusto.mjs <url> <seedDesde> <seedHasta> <rivales> <limiteSeg> [WxH]` — partidas completas a
  ritmo real (velocidad rápida) una tras otra; avisa de `ATASCO` si nada cambia en 8 s.

Todas usan un solo navegador y una página a la vez (el sandbox tiene 2 GB de RAM).
- `medidas.mjs <url> <seed> <rivales> <WxH,...> [vistaJSON]` — ancho real de las cartas de tu
  mano y de la mesa en tu primer turno, a varios tamaños (para comparar antes/después).
- `tira.mjs <url> <salida.png> <WxH> <seed> <rivales> <ms> <paso> [desde] [hasta]` — tira de
  fotogramas a ritmo real (sin `?fast`) para revisar animaciones, avisos y ritmo.
- `sin-conexion.mjs <url-del-build>` — abre la app, corta la red y comprueba que sigue
  funcionando (service worker; solo en el build, no en `vite dev`).
- `banco-mesa.mjs <baseUrl> <salida.png> <WxH> <cartas:jugables,...>` — con `vite dev`, pinta
  la mesa real (banco `e2e/banco/mesa.html`) con manos de cualquier tamaño, para revisar los
  modos de la mano (grande, dividido, rejilla, «+N») sin tener que llegar a ellos jugando.
