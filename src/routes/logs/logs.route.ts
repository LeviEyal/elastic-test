import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { LogRecord } from "@/types/LogRecord";
import * as logsService from "./logs.service";

export const logsRoute: FastifyPluginAsyncJsonSchemaToTs = async (app) => {
  app.route({
    method: "POST",
    url: "/insert",
    schema: {
      body: {
        type: "object",
        properties: {
          date: { type: "number" },
          url: { type: "string" },
          size: { type: "number" },
          customer: { type: "string" },
        },
      },
    },
    handler: async (request) => {
      const logRecord = request.body as LogRecord;
      await logsService.insert(app, logRecord);
      return { success: true };
    },
  });

  app.route({
    method: "GET",
    url: "/aggregate",
    schema: {
      querystring: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          customer: { type: "string" },
        },
        required: ["from", "to"],
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              customer_name: { type: "string" },
              date: { type: "string" },
              url: { type: "string" },
              total_requests_size: { type: "number" },
              requests_count: { type: "number" },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { from, to, customer } = request.query as {
        from: string;
        to: string;
        customer: string;
      };

      const res = await logsService.aggregate(app, from, to, customer);
      return res;
    },
  });
};
