# Vigicom

Plataforma de control de alarmas comunitarias. El repositorio agrupa varios componentes (panel `cloud/`, app de usuarios, firmware) que comparten una misma base de datos.

## Esquema de base de datos

El esquema de la base de datos es **único y compartido** entre todos los componentes del proyecto. Vive en [db/schema.sql](db/schema.sql) y es la fuente de verdad para cualquier consulta, modelo o cambio estructural.

- Antes de proponer queries, modelos o migraciones, consultar [db/schema.sql](db/schema.sql) para conocer tablas, columnas y relaciones reales.
- Cualquier cambio de schema se hace en [db/schema.sql](db/schema.sql), no dentro de `cloud/` ni de los otros componentes.
- El deploy de `cloud/` (y de cualquier otro componente que toque la DB) debe incluir el directorio `db/`.
