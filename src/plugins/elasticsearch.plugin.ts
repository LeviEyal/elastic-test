import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { fastifyElasticsearch } from "@fastify/elasticsearch";

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || "https://localhost:9200";

/**
 * Registers the Elasticsearch plugin with the Fastify server.
 * 
 * @param server - The Fastify server instance.
 */
export const elasticSearchPlugin: FastifyPluginAsync = fp(async (server) => {
  await server.register(fastifyElasticsearch, {
    node: ELASTICSEARCH_URL,
    auth: {
      username: "elastic",
      password: "password",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  server.addHook("onClose", async () => {
    await server.elastic.close();
  });
});
