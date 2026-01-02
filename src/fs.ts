import fs from "node:fs/promises";

export async function readTextFile(fileName: string): Promise<string> {
  return fs.readFile(fileName, { encoding: "utf-8" });
}
