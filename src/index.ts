import { Client } from "@elastic/elasticsearch";

const client = new Client({
  node: "https://127.0.0.1:9200",
  auth: {
    username: "elastic",
    password: "password",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const run = async () => {
  const res = await client.info();
  await client.close();
  return res;
};