import { run } from "@/index";

describe("index.ts", () => {
  test("Sanity check", async () => {
    const result = await run();
    expect(result.cluster_name).toBeDefined();
    expect(result.cluster_name).toBe("docker-cluster");
    expect(result.version).toBeDefined();
    expect(result.version.number).toBe("8.6.1");
    expect(result.tagline).toBe("You Know, for Search");
    return true;
  });
});
