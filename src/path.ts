import nodePath from "node:path";

export function basename(path: string, suffix?: string): string {
  return nodePath.basename(path, suffix);
}

export function dirname(path: string): string {
  return nodePath.dirname(path);
}

export function resolve(filePath: string): string {
  return nodePath.resolve(filePath);
}

export function resolveModule(filePath: string, basePath: string): string {
  return nodePath.isAbsolute(filePath)
    ? filePath
    : nodePath.resolve(basePath, filePath);
}
