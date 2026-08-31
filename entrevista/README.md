# Copiloto de Entrevista

Aplicación para el iMac que se mantiene abierta durante una entrevista en inglés y hace dos cosas
al mismo tiempo:

1. **Traduce en simultáneo** lo que dice el entrevistador, frase por frase, en pantalla.
2. **Te arma qué contestar**, en inglés, apoyándose en tu CV, tus logros y tu proyecto de outplacement,
   más un documento de respaldo (pitch, historias STAR, preguntas difíciles) preparado de antemano.

Es una página estática: un `index.html`, sin servidor propio y sin instalar nada. Se instala como
aplicación desde Chrome y queda con su propia ventana e ícono, como cualquier app del Mac.

---

## Evaluación: qué es realista esperar

Antes de la parte técnica, lo que conviene saber para decidir cómo usarla.

### Lo que funciona bien

| | |
|---|---|
| **Transcripción del inglés** | El reconocimiento de voz de Chrome es bueno con audio limpio y acentos estándar. En una videollamada con auriculares, la precisión es alta. |
| **Traducción** | Va con 1 a 3 segundos de retraso sobre la frase cerrada. Es traducción de frases completas, no palabra por palabra: se lee cómoda. |
| **Respuestas con tu material** | Es lo más fuerte de la app. Como el modelo tiene tu CV y tu proyecto delante, no responde genérico: cita tus empresas y tus números. |
| **El speech de respaldo** | Se genera una vez, antes de la entrevista, y queda guardado. No depende de internet en el momento. |

### Los límites, sin adornos

- **El audio es el cuello de botella, no el modelo.** La transcripción escucha el micrófono que tenga
  seleccionado tu Mac. Si la entrevista sale por los parlantes y el micrófono la levanta del aire,
  funciona pero se ensucia (te transcribe también a vos, y pierde con ruido de fondo). La configuración
  con BlackHole, que está explicada en Ajustes y abajo, es la diferencia entre "más o menos" y "muy bien".
- **Retraso.** Frase cerrada → traducción visible: entre 1 y 3 segundos. Respuesta sugerida completa:
  entre 3 y 8 segundos según el modelo. No es instantáneo y no puede serlo: hay que esperar a que
  la persona termine la frase.
- **Requiere Google Chrome** (o Edge) en el Mac. Safari no tiene un reconocimiento de voz utilizable
  para esto y Firefox directamente no lo trae.
- **Requiere internet.** Sin conexión abre igual y te muestra el speech guardado, pero no transcribe
  ni traduce.
- **Leer mientras hablás cuesta.** Vale la pena hacer una entrevista de práctica con la app abierta
  antes de usarla en una real: mirar la pantalla en el momento equivocado se nota del otro lado.
  Por eso las respuestas salen en viñetas cortas y no en párrafos: son para mirar de reojo.
- **Nunca inventa datos, pero puede sonar demasiado pulido.** Las respuestas son un andamio, no
  un guion para leer literal.
- **Consentimiento.** Transcribir una conversación puede requerir avisarle a la otra parte según
  dónde estés. La app no graba audio: procesa texto y no guarda nada fuera de tu computadora,
  pero la decisión es tuya.

### Cuánto cuesta

Se paga por uso a Anthropic, con tu propia clave. Una entrevista de 45 minutos con traducción continua
y unas 15 respuestas ronda **USD 1 a 3** con Claude Opus 5. Con Haiku 4.5 baja a centavos, con algo
menos de finura. El modo rápido aproximadamente duplica el costo a cambio de menos espera.

### Privacidad

El perfil, el speech, la clave y la transcripción viven en el almacenamiento local del navegador,
en tu iMac. No hay servidor propio ni base de datos. Lo único que sale de la máquina es el texto de
la entrevista, que va a la API de Anthropic para traducirlo y armar respuestas. El botón
**Borrar todos mis datos** en Ajustes limpia todo.

---

## Estructura

Todo el flujo, de arriba abajo:

```
  micrófono del sistema (idealmente BlackHole con el audio de la reunión)
        │
        ▼
  reconocimiento de voz de Chrome  ──►  frases sueltas en inglés
        │
        ▼
  agrupador de frases      (junta fragmentos hasta que cierra una idea)
        │
        ├──►  traducción           ──►  columna izquierda: inglés + español
        │       (Claude, esfuerzo bajo, una llamada por frase, con contexto)
        │
        └──►  detector de preguntas
                  │
                  ▼
            respuesta sugerida     ──►  columna derecha
                  (Claude + tu perfil cacheado en el prompt)

  aparte, antes de la entrevista:
      perfil (CV, logros, proyecto de outplacement, job description)
        └──► "Mi speech": pitch, STAR, preguntas difíciles, cierre  (se guarda)
```

### Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | La aplicación entera: interfaz, reconocimiento de voz, llamadas a Claude, almacenamiento. |
| `manifest.json` | Para instalarla como app con ventana propia. |
| `sw.js` | Service worker: la app abre al instante y sin conexión. Al publicar cambios hay que subir `CACHE`. |
| `icono.svg` | Ícono. |
| `vendor/` | Copia local del SDK oficial de Anthropic (ver `vendor/LEEME.md`). Está adentro del repo a propósito: en una entrevista en vivo no queremos depender de un CDN. |

### Las piezas dentro de `index.html`

Están separadas por comentarios y en este orden:

1. **Almacenamiento** — `localStorage` bajo el prefijo `copiloto.` (`cfg`, `perfil`, `speech`, `lineas`).
2. **Claude** — cliente, streaming y una escalera de degradación: si la API rechaza un parámetro
   opcional (modo rápido, esfuerzo, *fallbacks*), baja un escalón y reintenta en vez de dejarte
   sin respuesta en el peor momento. Los errores se traducen a mensajes en castellano.
3. **Perfil como contexto** — arma el bloque con tu CV y lo marca como cacheable, así las respuestas
   siguientes de la misma entrevista salen más rápido y más baratas.
4. **Reconocimiento de voz** — con reenganche automático (Chrome corta la escucha cada tanto),
   manejo de errores de permiso y bloqueo del apagado de pantalla.
5. **Transcripción** — render, agrupador de frases, detector de preguntas.
6. **Traducción** — cola con dos llamadas en paralelo como máximo, para no desordenar la pantalla.
7. **Respuesta en vivo** — con cancelación: si llega otra pregunta, la anterior se aborta.
8. **Mi speech** — generación, guardado, buscador con resaltado.
9. **Perfil, Ajustes, atajos de teclado.**

### Por dónde seguir

- **Transcripción de calidad profesional**: reemplazar el reconocimiento de Chrome por un servicio
  de streaming (Deepgram, AssemblyAI) alimentado con el audio de la pestaña vía `getDisplayMedia`.
  Eso elimina la dependencia de BlackHole y mejora la precisión con acentos difíciles. Es el cambio
  más caro y el que más mueve la aguja; el resto de la app no se toca.
- **Separar quién habla** (entrevistador vs. vos), que hoy depende de la configuración de audio.
- **Informe posterior**: al terminar, un resumen de la entrevista con las preguntas que costaron
  y qué conviene preparar para la próxima ronda.

---

## Puesta a punto (una sola vez)

1. **Abrila en Chrome** y en la barra de direcciones tocá el ícono de instalar. Queda como app del Mac.
2. **Ajustes → clave de la API.** Se saca en `console.anthropic.com` → API Keys. Pulsá
   **Probar la conexión** para confirmar que funciona.
3. **Perfil.** Pegá tu CV (o subí el PDF y lo transcribe solo), tus logros con números, y sobre todo
   **tu proyecto de outplacement**: propuesta de valor, pitch, objetivo, el relato de la transición.
   Es lo que hace que las respuestas suenen a vos.
4. **Generar mi speech.** Tarda un minuto y queda guardado.
5. **Audio.** La opción sin instalar nada es dejar que el micrófono levante los parlantes.
   La recomendada, con BlackHole, está paso a paso dentro de Ajustes.

### Durante la entrevista

| Tecla | Qué hace |
|---|---|
| `E` | Iniciar o detener la escucha |
| `R` | Armar la respuesta a lo último que se dijo |
| `+` / `−` | Agrandar o achicar la letra |
| `Esc` | Cerrar el panel abierto |

Los botones **Vista** (columna doble / solo traducción / solo respaldo) y **EN/ES** (ocultar el inglés)
sirven para dejar en pantalla solo lo que vas a mirar.
