import Task, { type TaskStatus } from '#models/task'
import { test } from '@japa/runner'

/**
 * La regla de vencimiento, sin servidor ni base de datos: `Task.isOverdueOn`
 * sobre un modelo en memoria. Recorre los bordes del requisito «Cuándo una
 * tarea está vencida» de `openspec/specs/tasks/spec.md`: vencida si, y solo si,
 * tiene fecha, esa fecha es anterior al día de referencia y no está hecha.
 *
 * Ninguna fecha sale del reloj: el día de referencia es fijo y el resto son
 * literales escritos a mano.
 */
test.group('Task | isOverdueOn', () => {
  const DIA_DE_REFERENCIA = '2026-08-13'

  /** Una tarea en memoria, nunca guardada. */
  function tarea(dueDate: string | null, status: TaskStatus) {
    const task = new Task()
    task.dueDate = dueDate
    task.status = status
    return task
  }

  test('fecha anterior al día de referencia y pendiente: vencida', ({ assert }) => {
    assert.isTrue(tarea('2026-08-12', 'pending').isOverdueOn(DIA_DE_REFERENCIA))
  })

  test('fecha igual al día de referencia y pendiente: no vencida', ({ assert }) => {
    assert.isFalse(tarea('2026-08-13', 'pending').isOverdueOn(DIA_DE_REFERENCIA))
  })

  test('fecha posterior al día de referencia y pendiente: no vencida', ({ assert }) => {
    assert.isFalse(tarea('2026-08-14', 'pending').isOverdueOn(DIA_DE_REFERENCIA))
  })

  test('sin fecha y pendiente: no vencida', ({ assert }) => {
    assert.isFalse(tarea(null, 'pending').isOverdueOn(DIA_DE_REFERENCIA))
  })

  test('hecha con la fecha pasada: no vencida', ({ assert }) => {
    assert.isFalse(tarea('2026-08-12', 'done').isOverdueOn(DIA_DE_REFERENCIA))
  })

  test('la fecha como texto y como objeto Date dan lo mismo', ({ assert }) => {
    const conTexto = tarea('2026-08-12', 'pending').isOverdueOn(DIA_DE_REFERENCIA)

    // El modelo tipa `dueDate` como texto, pero es lo que puede llegar al leer
    // la columna de la base. El Date se construye con valores escritos a mano
    // (mes 7 = agosto), nunca desde el reloj.
    const conObjeto = tarea(new Date(2026, 7, 12) as any, 'pending').isOverdueOn(
      DIA_DE_REFERENCIA
    )

    assert.equal(conObjeto, conTexto)
    assert.isTrue(conTexto)
    assert.isTrue(conObjeto)
  })
})
