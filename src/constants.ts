import ts from "typescript";
import { dirname, join, resolve } from "node:path";

export const SRC_PATH = dirname(new URL(import.meta.url).pathname);
export const ROOT_PATH = resolve(join(SRC_PATH, ".."));
export const RUNTIME_PATH = resolve(join(ROOT_PATH, "src", "runtime"));
export const RUNTIME_TYPE_DEFINITION_PATH = resolve(
  join(RUNTIME_PATH, "ts2go.d.ts")
);

export const SCRIPT_TARGET = ts.ScriptTarget.ES2024;

export const NUMBER_SUPPORTED_RADIX = ["2", "10", "16"];
