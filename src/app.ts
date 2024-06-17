import fastify from "fastify";
import { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import { elasticSearchPlugin, swaggerPlugin } from "./plugins";
import { logsRoute } from "./routes/logs/logs.route";

const app = fastify({
  logger: true,
}).withTypeProvider<JsonSchemaToTsProvider>();

/**
 * Starts the server by registering plugins, routers, and listening on a specified port.
 */
async function start() {
  try {
    await app.register(swaggerPlugin, { prefix: "/" });
    await app.register(elasticSearchPlugin);

    await app.register(logsRoute, { prefix: "api/logs" });

    await app.ready();
    await app.listen({ port: 8080 });
    console.log(`🚀 Server ready at: http://localhost:8080`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
