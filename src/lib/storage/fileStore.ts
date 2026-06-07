import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const memoryStore = new Map<string, unknown>();

export function dataFilePath(...parts: string[]) {
  return path.join(process.cwd(), "data", ...parts);
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    const cached = memoryStore.get(filePath);
    return (cached as T | undefined) ?? fallback;
  }
}

export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  memoryStore.set(filePath, data);

  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  } catch {
    // Vercel/serverless file systems can be read-only. The in-memory copy keeps
    // the demo usable for the current request without making persistence fatal.
  }
}

export async function appendJsonArray<T>(filePath: string, item: T) {
  const current = await readJsonFile<T[]>(filePath, []);
  const next = [item, ...current];
  await writeJsonFile(filePath, next);
  return next;
}
