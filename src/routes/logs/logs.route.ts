import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import {
  AggregatedLogs,
  LogRecord,
} from "@/types/LogRecord";

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
    handler: async (request, reply) => {
      const logRecord = request.body as LogRecord;
      try {
        await app.elastic.index<LogRecord>({
          index: "logs",
          document: {
            customer: logRecord.customer,
            date: new Date(logRecord.date),
            size: logRecord.size,
            url: logRecord.url,
          },
        });

        return { success: true };
      } catch (error) {
        console.error(error);
        throw error;
      }
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

      try {
        const resBody = await app.elastic.search<
          AggregatedLogs,
          AggregatedLogs
        >({
          index: "logs",
          query: {
            bool: {
              must: [
                { range: { date: { gte: from, lte: to } } },
                ...(customer ? [{ match: { customer: customer } }] : []),
              ],
            },
          },
          aggs: {
            customer_name: {
              terms: {
                field: "customer.keyword",
              },
              aggs: {
                date: {
                  date_histogram: {
                    field: "date",
                    calendar_interval: "day",
                    format: "yyyy-MM-dd",
                  },
                  aggs: {
                    url: {
                      terms: {
                        field: "url.keyword",
                      },
                      aggs: {
                        total_requests_size: {
                          sum: {
                            field: "size",
                          },
                        },
                        requests_count: {
                          value_count: {
                            field: "size",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        const result = resBody.aggregations?.customer_name.buckets.map(
          (customerBucket) => {
            return customerBucket.date.buckets.map((dateBucket) => {
              return dateBucket.url.buckets.map((urlBucket) => {
                return {
                  customer_name: customerBucket.key,
                  date: dateBucket.key_as_string,
                  url: urlBucket.key,
                  total_requests_size: urlBucket.total_requests_size.value,
                  requests_count: urlBucket.requests_count.value,
                };
              });
            });
          }
        );

        return result?.flat(2);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  });
};
