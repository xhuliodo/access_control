# access_control

access_control is a simple API written in `bun.js` and `SQLite` as a database.

The folder structure is as follows:

- `index.ts` - is the entrypoint to the API.
- `db/` - contains the schema, seeding script and is the location where the database is created.
- `app/` - contains app the components of the API
  - `config.ts` - contains all the configurations with are retrieved from the `.env` file in the root directory.
  - `controllers.ts` - contains all the API handlers and business logic of the app.
  - `index.ts` - contains the factory of the app itself. it assembles all the layers and creates the an instance of the app.
  - `repository.ts` - contains all the external interactions that the app uses (in this case database only.)
  - `router.ts` - contains the routes linked with the appropriate handlers
  - `utils` - miscs functions that don't belong anywhere specific.

## Getting set up

The project requires [Bun.js](https://bun.sh/) to be installed.

To install the dependencies run `bun install`

To create and seed the database with test data run `bun run seed`

To run:`bun run index.ts`

To run in dev with hot-reload: `bun run dev`

## Improvements

### API Documentation/ Contract

Currently I settled on not documenting the APIs since they are quite simple, but using OpenAPI Specification would be a necessity. Especially when this backend will be consumed by other clients.

### Database Indexing

Since I chose to use an sql based database, and looking at the current usage patterns, this step is definitely a must.
My current suggestions would indexing the foreign keys in various tables and the `isPublic` column in the `resource` table.

### Testing

Right now, the testing is manual. So it's kinda tough to confirm if the there are is any double counting for resources or users. Since I've followed the dependency injection patterns on the project, adding tests should be rather easy.

### CI/CD pipeline

After the testing is added than the CI step will greatly help in keeping the code bug free-ish. And for CD part is self-explanatory for automating the deployment of the API.

### Caching

At the moment there are a few "counts" that should be cached like `allPublicResourceCount`, `allUsersCount`, etc... If after some statistics analysis even more patterns emerge that should be cached then adding a Redis instance might be worth it.

### Monitoring & Observability

A centralized logging would be beneficial to structure the logs in a better way than they are currently being diplayed (formatting, levels, etc...). Also sending these logs to some solution similair to Sentry or Datadog would increase visibility over them when deployed.
