# Prompts

## Prompt 1

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```text
Quiero que migres este proyecto de SQLite a PostgreSQL corriendo en Docker.

Antes de modificar nada, inspecciona el repositorio y entiende cómo están configurados actualmente la base de datos, los entornos, las migraciones, las pruebas y el Makefile.

La migración debe cumplir exactamente estas restricciones:

- El fichero de Compose debe llamarse compose.yaml.
- Debe haber dos servicios PostgreSQL llamados db y db-test.
- Ambos deben usar la imagen pgvector/pgvector:pg17.
- El servicio db debe exponer PostgreSQL en el puerto 54410 del host.
- El servicio db-test debe exponer PostgreSQL en el puerto 54411 del host.
- La base de pruebas debe ser efímera y NO debe utilizar ningún volumen.
- Ambos servicios deben tener healthcheck.
- El arranque debe esperar a que los servicios estén saludables antes de depender de ellos.
- No debe existir la clave version en compose.yaml.
- La batería de pruebas debe utilizar la base db-test mediante su propio fichero de entorno de pruebas, aprovechando el mecanismo que el framework utiliza para cargar la configuración específica del entorno de pruebas.
- Agrega atajos apropiados al Makefile para levantar las bases, detenerlas, ejecutar las migraciones sobre ambas bases y ejecutar la batería de pruebas.
- No modifiques ninguna migración existente. Esto es una restricción absoluta.
- No cambies innecesariamente código de aplicación que no sea necesario para completar esta migración.

Primero inspecciona el repositorio y luego implementa los cambios necesarios.

Al finalizar, explícame:
1. qué archivos modificaste;
2. cómo configuraste db y db-test;
3. cómo se selecciona la base de pruebas;
4. qué comandos del Makefile agregaste o modificaste;
5. cómo verificaste que ninguna migración existente fue modificada.
```

**Qué salió:** funcionó, pero durante la verificación funcional fue necesario corregir la hidratación de `due_date` de PostgreSQL mediante una regla `consume` en `schema_rules.ts`.
