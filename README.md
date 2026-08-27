# Marcador de Básquet

Contador de puntos para partidos de básquet: **un toque en pantalla suma los puntos**.
Es una página estática (un solo `index.html`), funciona sin conexión y sin instalar nada.

## Cómo usarlo

Abrí `index.html` en el navegador del celular, la tablet o la computadora.
En el celular conviene agregarlo a la pantalla de inicio ("Agregar a inicio" en el menú
del navegador) para que se abra a pantalla completa como una app.

## Qué hace

- **Toque grande por equipo**: tocar el número suma los puntos elegidos abajo (1, 2 o 3).
- **Botones +1 / +2 / +3 / −1** por equipo, para el caso puntual.
- **Deshacer**: revierte la última acción (puntos, faltas o cambio de periodo).
- **Reloj del periodo**: arranca, pausa y reinicia. Vibra al llegar a cero y se pausa
  solo si salís de la app, así no pierde tiempo real.
- **Periodos y faltas de equipo**: las faltas se reinician al cambiar de periodo y se
  marcan en rojo a partir de la quinta (bonus).
- **Ajustes**: nombres de los equipos, minutos por periodo y cantidad de periodos.
- **Guardado automático**: el partido queda en el navegador, si cerrás y volvés a abrir
  sigue donde estaba.

## Atajos de teclado (si lo usás en una computadora)

| Tecla | Acción |
| --- | --- |
| `A` | Suma al equipo local |
| `L` | Suma al equipo visitante |
| `1` `2` `3` | Elige cuántos puntos suma cada toque |
| `Espacio` | Arranca / pausa el reloj |
| `Z` | Deshacer |
