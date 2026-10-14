# Prompts

Prompts lanzados para el ejercicio «Cuándo una tarea está vencida», en el orden en que se lanzaron,
con el modelo y la herramienta de cada uno.

---

## Prompt 1 — Parte A: el contrato primero (tests funcionales por HTTP)

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
Estoy en la rama tests-marco-bello, que ya es mi rama de trabajo: quédate en ella, no crees otra.

Tarea: cubrir con tests funcionales el Requirement «Cuándo una tarea está vencida» de
openspec/specs/tasks/spec.md. Léelo entero con sus 7 Scenarios, y lee también el Requirement
siguiente, «El día de referencia lo pone quien mira», para ver cómo se pasa el parámetro `today`.

Qué quiero:
- Un archivo nuevo: backend/tests/functional/tasks/overdue.spec.ts
- Un test por Scenario (7 en total), con el nombre del Scenario como título del test.
- Todo entra por HTTP, como lo haría el frontend:
  - crear la tarea con POST /api/v1/tasks
  - fijar la fecha con PUT /api/v1/tasks/:id/due-date
  - cambiar el estado con PATCH /api/v1/tasks/:id/status
  - consultar con GET /api/v1/tasks/:id?today=AAAA-MM-DD
- La aserción es siempre sobre el campo `isOverdue` del cuerpo de la respuesta. No llames a
  isOverdueOn ni a ningún otro método del modelo.
- Donde el Scenario dice "se consulta", lee con GET /api/v1/tasks/:id. En «Aplazar resuelve el
  vencimiento» la aserción va sobre la respuesta del propio PUT, porque el Scenario dice "en la
  misma respuesta de ese cambio".
- Si un Scenario parte de "una tarea vencida", comprueba esa precondición con una aserción antes
  de cambiar nada.
- En «Darla por hecha la deja de vencer» comprueba también que la fecha de vencimiento sigue
  siendo la misma después del cambio de estado.
- El día de referencia es una constante fija en el archivo (DIA_DE_REFERENCIA = '2026-08-13') y
  el resto de fechas son literales escritos a mano ('2026-08-12', '2026-08-14'). Prohibido
  new Date(), Date.now(), DateTime.now() o cualquier otra lectura del reloj.
- Aislamiento: sigue exactamente la forma de backend/tests/functional/tasks/assignee.spec.ts
  (group.each.setup con testUtils.db().withGlobalTransaction(), cuenta creada con User.create y
  login por POST /api/v1/auth/login). No inventes otra.
- Usa siempre el id que devuelve la creación; no des por hecho ningún identificador.
- Correos de prueba solo con dominio example.com.
- «Sin fecha no se vence nunca» habla de una tarea "creada hace semanas": no manipules createdAt
  ni escribas en la base para simularlo. Si crees que hace falta, déjalo anotado en un comentario
  del test y dímelo.

Restricciones duras:
- No modifiques ni una línea fuera de backend/tests/. Ni el modelo, ni el transformer, ni el
  controlador, ni el validador, ni la spec.
- Se espera que algún test falle. NO arregles la implementación ni ajustes el test para que pase.
- Si algo de la spec te parece ambiguo, dímelo en vez de decidirlo en silencio.

Cuando termines, ejecuta `make test-e2e` desde la raíz del repo y muéstrame la salida completa,
sin resumir. Distingue dos tipos de fallo: los que fallan en la aserción de `isOverdue` (o de la
fecha) se quedan en rojo; los que fallan por un error del propio test (import, tipos, ruta mal
escrita, status inesperado por un cuerpo mal formado) sí los corriges, solo dentro del test.
Al final dime qué tests nuevos fallaron y con qué mensaje.
```

**Qué salió:** escribió los 7 tests a la primera sin tocar implementación; 4 en rojo (dos por isOverdue, uno por el formato de dueDate, uno por la precondición) y 3 en verde. Antes de cerrar me preguntó por cuatro decisiones de la spec en vez de tomarlas solo.

---

## Prompt 2 — Parte A: respuesta a sus dudas

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
Respuestas a tus dudas:

1. today en la query del PUT: de acuerdo, déjalo así.
2. «Creada hace semanas»: de acuerdo con dejarlo anotado en el comentario.
3. «Fecha futura» con la tarea en pending: de acuerdo.
4. Aserciones extra:
   - En «Una tarea hecha con la fecha pasada» quita la comprobación de que
     dueDate === '2026-08-12'. El formato AAAA-MM-DD es otro Requirement («La fecha
     es un día, no un instante») y esta unidad de trabajo es solo «Cuándo una tarea
     está vencida». Ese test tiene que medir isOverdue y nada más, aunque así quede
     en verde: ese verde es justo lo que quiero ver.
   - En «Darla por hecha la deja de vencer» comprueba la fecha comparando el dueDate
     que devuelve el GET antes del cambio de estado con el que devuelve después, no
     contra un literal.
   - La comprobación del dueDate en la respuesta del PUT de «Aplazar» y las de status
     se quedan como están.

Mismas restricciones: nada fuera de backend/tests/ y no arregles la implementación.
Ejecuta make test-e2e desde la raíz y muéstrame la salida completa.
```

**Qué salió:** aplicó los cambios solo en el test. make test-e2e: 44 passed, 3 failed (47). Fallan «Fecha del día anterior» y las precondiciones de «Darla por hecha» y «Aplazar»; «Una tarea hecha con la fecha pasada» pasó a verde, como esperaba.

---

## Prompt 3 — Parte B: bajar la regla a test unitario

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
Seguimos en la rama tests-marco-bello. Ahora bajamos la regla a un test unitario.

La regla es el método isOverdueOn(referenceDay) de backend/app/models/task.ts. Léelo y no lo
modifiques.

Crea la carpeta backend/tests/unit/ (hoy no existe) y dentro el archivo
backend/tests/unit/task_is_overdue.spec.ts, con Japa como el resto de tests del proyecto. Sin
servidor HTTP y sin base de datos: instancia el modelo en memoria (new Task()), asigna dueDate y
status a mano y llama a isOverdueOn con un día de referencia fijo, '2026-08-13'. No llames a
save(), create() ni a nada que toque la base.

Un test por cada borde:
1. Fecha anterior al día de referencia ('2026-08-12') y estado pending → true.
2. Fecha igual al día de referencia ('2026-08-13') y estado pending → false.
3. Fecha posterior ('2026-08-14') y estado pending → false.
4. Sin fecha (dueDate = null) y estado pending → false.
5. Estado done con fecha pasada ('2026-08-12') → false.
6. Texto y objeto de fecha dan lo mismo: con estado pending y la misma fecha anterior, el
   resultado con dueDate = '2026-08-12' tiene que ser igual al resultado con dueDate = un Date
   que represente ese mismo día, y los dos tienen que ser true. Construye el Date con valores
   escritos a mano (new Date(2026, 7, 12)), nunca a partir del reloj. Si TypeScript no deja
   asignar un Date porque dueDate está tipado como string, usa un cast en el test (as any); no
   cambies el tipo en el modelo.

Mismas restricciones que antes: nada fuera de backend/tests/, no arregles la implementación
aunque un test falle, y nada de reloj (ni Date.now(), ni DateTime.now(), ni new Date() sin
argumentos).

Al terminar, ejecuta `make test-unit` desde la raíz y muéstrame la salida completa. Dime qué
casos fallan y con qué mensaje. Si alguno falla por un error del propio test (import, tipos),
corrígelo en el test; si falla por la aserción, déjalo en rojo.
```

**Qué salió:** creó backend/tests/unit/task_is_overdue.spec.ts y corrigió por su cuenta un error de tipos del propio test (status como TaskStatus), sin tocar el modelo. make test-unit: 4 passed, 2 failed (6); en rojo el caso done con fecha pasada y el de texto contra Date.
