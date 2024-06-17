import { AggregatedLogs, LogRecord } from "@/types/LogRecord";
import { FastifyInstance } from "fastify";

/**
 * Inserts a log record into the Elasticsearch index.
 *
 * @param app - The Fastify instance.
 * @param logRecord - The log record to be inserted.
 * @returns A Promise that resolves to the result of the insertion.
 */
export const insert = async (app: FastifyInstance, logRecord: LogRecord) => {
  return app.elastic.index({
    index: "logs",
    body: logRecord,
  });
};

/**
 * Retrieves aggregated logs based on the specified parameters.
 *
 * @param app - The Fastify instance.
 * @param from - The start date for the logs aggregation.
 * @param to - The end date for the logs aggregation.
 * @param customer - The customer name to filter the logs by (optional).
 * @returns An array of aggregated logs.
 * @throws If an error occurs while retrieving the logs.
 */
export const aggregate = async (
  app: FastifyInstance,
  from: string,
  to: string,
  customer: string
) => {
  try {
    const resBody = await app.elastic.search<AggregatedLogs, AggregatedLogs>({
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
};
