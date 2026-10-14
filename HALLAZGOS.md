# Hallazgos

Requirement «Cuándo una tarea está vencida» (`openspec/specs/tasks/spec.md`), rama `tests-marco-bello`.
Tests nuevos en `backend/tests/functional/tasks/overdue.spec.ts` (7, uno por Scenario) y
`backend/tests/unit/task_is_overdue.spec.ts` (6). Implementación sin tocar.

## 1. Cuántos casos nuevos fallaron y cuántos de los que ya había siguieron en verde

- `make test-e2e`: **44 passed, 3 failed (47)**. De mis 7 casos funcionales fallan 3 y los 40 que ya había siguen en verde (línea base `make test`: 40 passed). `make test-unit`: **4 passed, 2 failed (6)**, cuando antes respondía `NO TESTS EXECUTED`.

## 2. Cuál de mis casos nuevos pasó y por qué

- Pasaron 4 funcionales («Vencer hoy», «Fecha futura», «Sin fecha» y «Una tarea hecha con la fecha pasada»), y lo que los separa de los 3 que fallan es que todos esperan `isOverdue: false` y los rojos esperan `true`: al releerla por `GET`, la fecha vuelve de la base como objeto `Date` (`'2026-08-12T00:00:00.000Z'`), `isOverdueOn` la compara con `<` contra el texto `'2026-08-13'` y eso da siempre `false`, así que esos verdes son falsos. El más claro es «Una tarea hecha con la fecha pasada»: la regla ni siquiera mira el estado `done` (el unitario de ese mismo borde, con la fecha como texto, sale en rojo) y aun así el funcional pasa.

## 3. De qué dudé o qué no pude comprobar

- Que la fecha llegue como `Date` lo deduzco del formato que devuelve el `GET` y del unitario de texto contra `Date` (rojo), no lo comprobé dentro del driver de PostgreSQL; tampoco probé con otro huso horario del proceso, que podría mover ese `Date` de día, y dejé dos decisiones de la spec sin resolver: dónde va `today` en el `PUT` (lo mandé en la query) y cómo simular una tarea «creada hace semanas» sin escribir en la base (no lo simulé, quedó anotado en el test).
