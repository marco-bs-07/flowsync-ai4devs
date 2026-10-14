import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Cuándo una tarea está vencida. Cubre los siete scenarios del requisito
 * «Cuándo una tarea está vencida» de `openspec/specs/tasks/spec.md`: vencida si,
 * y solo si, tiene fecha, esa fecha es anterior al día de referencia y su estado
 * no es `done`.
 *
 * Todo entra por HTTP, como lo haría el frontend, y la aserción es siempre sobre
 * el `isOverdue` que llega en el cuerpo. El día de referencia lo pone quien mira
 * (requisito «El día de referencia lo pone quien mira»), así que va fijo en el
 * parámetro `today` de cada petición que informa del vencimiento: la consulta
 * suelta y el cambio de fecha. Ninguna fecha sale del reloj.
 */
test.group('Tasks | vencimiento', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const DIA_DE_REFERENCIA = '2026-08-13'
  const DIA_ANTERIOR = '2026-08-12'
  const DIA_POSTERIOR = '2026-08-14'

  /** Crea una cuenta, entra con ella y deja creada una tarea a su nombre. */
  async function tareaNueva(client: any) {
    const email = 'vencimiento@example.com'
    await User.create({ fullName: 'Grace Hopper', email, password: 'secreto123' })

    const login = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })
    login.assertStatus(200)
    const token = login.body().data.token as string

    const creada = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Revisar el informe' })
    creada.assertStatus(201)

    return { token, id: creada.body().data.id as number }
  }

  /** `PUT /tasks/:id/due-date`, resuelto contra el día de referencia. */
  async function fijarFecha(client: any, token: string, id: number, dueDate: string | null) {
    const respuesta = await client
      .put(`/api/v1/tasks/${id}/due-date`)
      .qs({ today: DIA_DE_REFERENCIA })
      .header('Authorization', `Bearer ${token}`)
      .json({ dueDate })
    respuesta.assertStatus(200)

    return respuesta.body().data
  }

  /** `PATCH /tasks/:id/status`. Su respuesta no informa del vencimiento. */
  async function cambiarEstado(client: any, token: string, id: number, status: string) {
    const respuesta = await client
      .patch(`/api/v1/tasks/${id}/status`)
      .header('Authorization', `Bearer ${token}`)
      .json({ status })
    respuesta.assertStatus(200)
  }

  /** `GET /tasks/:id?today=...`: la tarea suelta, mirada desde el día de referencia. */
  async function consultar(client: any, token: string, id: number) {
    const respuesta = await client
      .get(`/api/v1/tasks/${id}`)
      .qs({ today: DIA_DE_REFERENCIA })
      .header('Authorization', `Bearer ${token}`)
    respuesta.assertStatus(200)

    return respuesta.body().data
  }

  test('Fecha del día anterior', async ({ client, assert }) => {
    const { token, id } = await tareaNueva(client)
    await fijarFecha(client, token, id, DIA_ANTERIOR)

    const tarea = await consultar(client, token, id)

    assert.notEqual(tarea.status, 'done')
    assert.isTrue(tarea.isOverdue)
  })

  test('Vencer hoy todavía no es estar vencida', async ({ client, assert }) => {
    const { token, id } = await tareaNueva(client)
    await fijarFecha(client, token, id, DIA_DE_REFERENCIA)

    const tarea = await consultar(client, token, id)

    assert.notEqual(tarea.status, 'done')
    assert.isFalse(tarea.isOverdue)
  })

  test('Fecha futura', async ({ client, assert }) => {
    const { token, id } = await tareaNueva(client)
    await fijarFecha(client, token, id, DIA_POSTERIOR)

    const tarea = await consultar(client, token, id)

    assert.isFalse(tarea.isOverdue)
  })

  test('Sin fecha no se vence nunca', async ({ client, assert }) => {
    // El scenario habla de una tarea «creada hace semanas». Aquí se crea en el
    // momento y no se toca `createdAt` ni se escribe en la base para envejecerla:
    // la regla de vencimiento no mira la fecha de creación, así que la antigüedad
    // no cambia el resultado esperado. Si algún día la regla dependiera de ella,
    // este test no lo detectaría y habría que simular la antigüedad.
    const { token, id } = await tareaNueva(client)

    const tarea = await consultar(client, token, id)

    assert.isNull(tarea.dueDate)
    assert.equal(tarea.status, 'pending')
    assert.isFalse(tarea.isOverdue)
  })

  test('Darla por hecha la deja de vencer', async ({ client, assert }) => {
    const { token, id } = await tareaNueva(client)
    await fijarFecha(client, token, id, DIA_ANTERIOR)

    const antes = await consultar(client, token, id)
    assert.isTrue(antes.isOverdue, 'precondición: la tarea tiene que partir vencida')

    await cambiarEstado(client, token, id, 'done')
    const despues = await consultar(client, token, id)

    assert.equal(despues.status, 'done')
    assert.equal(despues.dueDate, antes.dueDate)
    assert.isFalse(despues.isOverdue)
  })

  test('Una tarea hecha con la fecha pasada', async ({ client, assert }) => {
    const { token, id } = await tareaNueva(client)
    await fijarFecha(client, token, id, DIA_ANTERIOR)
    await cambiarEstado(client, token, id, 'done')

    const tarea = await consultar(client, token, id)

    assert.equal(tarea.status, 'done')
    assert.isFalse(tarea.isOverdue)
  })

  test('Aplazar resuelve el vencimiento', async ({ client, assert }) => {
    const { token, id } = await tareaNueva(client)
    await fijarFecha(client, token, id, DIA_ANTERIOR)

    const antes = await consultar(client, token, id)
    assert.isTrue(antes.isOverdue, 'precondición: la tarea tiene que partir vencida')

    // La aserción va sobre la respuesta del propio PUT: el scenario dice «en la
    // misma respuesta de ese cambio».
    const aplazada = await fijarFecha(client, token, id, DIA_POSTERIOR)

    assert.equal(aplazada.dueDate, DIA_POSTERIOR)
    assert.isFalse(aplazada.isOverdue)
  })
})
