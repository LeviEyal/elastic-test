export interface AggregateLogsOutput {
  customer_name: string;
  date: string;
  url: string;
  total_requests_size: number;
  requests_count: number;
}

export interface LogRecord {
  date: Date | string | number;
  size: number | string;
  url: string;
  customer: string;
}

export interface AggregatedLogs {
  customer_name: {
    buckets: {
      key: string;
      date: {
        buckets: {
          key_as_string: string;
          url: {
            buckets: {
              key: string;
              total_requests_size: {
                value: number;
              };
              requests_count: {
                value: number;
              };
            }[];
          };
        }[];
      };
    }[];
  };
}