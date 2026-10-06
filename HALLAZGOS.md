# Hallazgos

0 filas cambian de valor: la migración solo agrega `tasks.due_date` como `DATE NULL`, sin `UPDATE`, `INSERT` ni `DELETE`; no toca datos existentes y queda en la rama de cambio de esquema sin modificación de datos.

La batería de pruebas no podía ver la hidratación de `DATE` desde PostgreSQL: los 23 tests no cubrían `dueDate`, `due_date`, `overdue` ni `isOverdueOn`; lo detecté manualmente creando una tarea vencida y comparando PUT y GET contra PostgreSQL.

Dudé de la representación de `dueDate` al cambiar de SQLite a PostgreSQL: inicialmente un GET devolvía `2026-09-01T00:00:00.000Z` y `isOverdue: false`; tras agregar `consume`, devuelve `2026-09-01` e `isOverdue: true`.
