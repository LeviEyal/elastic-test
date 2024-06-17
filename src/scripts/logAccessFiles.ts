import { LogRecord } from "@/types/LogRecord";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const LOG_API_URL = "http://localhost:8080/api/logs/insert";

const ASSETS_DIR = path.resolve(__dirname, "../../assets");

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

console.log("Reading access files...");

async function logAccessFiles() {
  try {
    const files = await readdir(ASSETS_DIR);
    console.log(files);

    for (const file of files) {
      const data = await readFile(path.resolve(ASSETS_DIR, file));

      const lines = data.toString().split("\n");
      for (const line of lines) {
        const row = line.split(" ");

        const logRecord: LogRecord = {
          date: row[0],
          size: row[4],
          url: row[6],
          customer: row[7],
        };

        // Log the record to the API
        await fetch(LOG_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(logRecord),
        });

        console.log("Logged record:", logRecord);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

logAccessFiles();
