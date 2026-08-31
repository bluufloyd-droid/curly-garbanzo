# Marcador de Básquet

Planilla y marcador para partidos de básquet: **un toque en pantalla suma los puntos**,
con estadísticas por jugador, reloj de periodo y control de cambios.
Es una página estática (un solo `index.html`), funciona sin conexión y sin instalar nada.

Publicada en: **https://bluufloyd-droid.github.io/curly-garbanzo/**

## Instalarla como aplicación

Es una PWA: se instala desde el navegador, sin tienda de apps, y una vez instalada
**funciona sin conexión** (un service worker guarda la app en el dispositivo).

- **iPhone / iPad**: abrila en **Safari** (tiene que ser Safari), tocá el botón de
  compartir y elegí **"Agregar a pantalla de inicio"**.
- **Android**: abrila en Chrome y tocá **"Instalar aplicación"** en el menú de tres
  puntos (o el cartel que aparece solo).
- **Computadora**: en Chrome o Edge, el ícono de instalar aparece a la derecha de la
  barra de direcciones.

Queda con ícono propio, se abre a pantalla completa sin barra del navegador y arranca
aunque no haya señal en la cancha. También podés abrir el `index.html` suelto en
cualquier computadora, sin instalar nada.

### Actualizaciones

La app abre desde lo guardado en el dispositivo y busca la versión nueva en segundo
plano, así que un cambio publicado se ve al abrirla la **segunda** vez. Al publicar
cambios hay que subir el número de `CACHE` en `sw.js`.

## Marcador

- **Panel táctil por equipo**: tocar el número suma los puntos elegidos abajo (1, 2 o 3).
- **Botones `+1 / +2 / +3 / −1`** para el caso puntual. El `−1` corrige el marcador y
  descuenta también al jugador al que se le asignó.
- **Falta** y **Técnica** por equipo, con la misma asignación a jugador.
- **Deshacer**: revierte la última acción, sea puntos, faltas, técnicas o cambio de periodo.
- **Faltas de equipo**: se reinician al cambiar de periodo y pasan a rojo desde la quinta.

## Reloj

- Arranca y pausa con ▶ / ⏸.
- **Sigue corriendo en segundo plano**: el tiempo se mide contra el reloj del sistema, así
  que aunque bloquees la pantalla, cambies de app o se cierre el navegador, al volver el
  reloj está donde corresponde. Mientras corre pide *wake lock* para que la pantalla no
  se apague sola (donde el navegador lo permite).
- **Corregir tiempo**: tocá el reloj para editar minutos y segundos, o usá los atajos
  −1 min / −10 s / +10 s / +1 min. También podés reiniciar el periodo desde ahí.
- Al llegar a cero vibra y se detiene.

## Planilla y estadísticas por jugador

- **Planilla** (Menú → Planilla): hasta **15 jugadores por equipo**, con número y nombre.
- **Cambios** (Menú → Cambios): marcá los **5 que están en cancha**. Al tocar un jugador
  entra o sale; el que sale deja de sumar minutos y el que entra empieza a sumarlos.
- **Asignación**: cada vez que cargás puntos, una falta o una técnica se despliega la
  lista con los **números de los que están en cancha** (y el banco abajo, por si el que
  hay que cargar salió recién). Siempre está la opción **Sin asignar**, que suma al equipo
  y no frena el conteo. Si todavía no cargaste planilla no se pregunta nada: suma directo.
- **Estadísticas** (Menú → Estadísticas): puntos, faltas, técnicas y minutos jugados por
  cada jugador. La fila «Asignado» contra la fila «Equipo» muestra cuánto quedó sin asignar.

## Otros

- **Ajustes**: nombres de los equipos, minutos por periodo y cantidad de periodos.
- **Partido nuevo**: borra marcador, faltas y estadísticas, y **conserva la planilla**.
- **Guardado automático**: el partido queda en el navegador; si cerrás y volvés a abrir,
  sigue donde estaba, con el reloj al día.

## Atajos de teclado (en computadora)

| Tecla | Acción |
| --- | --- |
| `A` | Suma al equipo local |
| `L` | Suma al equipo visitante |
| `1` `2` `3` | Elige cuántos puntos suma cada toque |
| `Espacio` | Arranca / pausa el reloj |
| `Z` | Deshacer |

---

# Otras apps de este repositorio

## Copiloto de Entrevista — [`entrevista/`](entrevista/)

App para la computadora que se deja abierta durante una entrevista de trabajo en inglés:
traduce al español lo que dice el entrevistador en simultáneo y, del otro lado de la pantalla,
arma qué contestar apoyándose en el CV, los logros y el proyecto de outplacement ya cargados.
También prepara de antemano un documento de respaldo (pitch, historias STAR, preguntas difíciles).

Publicada en: **https://bluufloyd-droid.github.io/curly-garbanzo/entrevista/**

La evaluación de qué esperar, los límites, el costo y la estructura del proyecto están en
[`entrevista/README.md`](entrevista/README.md).
