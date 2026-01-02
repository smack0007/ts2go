import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";
import {
  RUNTIME_TYPE_DEFINITION_PATH,
  TS_COMPILER_OPTIONS,
} from "./constants.ts";
import { emit } from "./emit.ts";
import { type EmitResult } from "./emitResult.ts";
import { EmitError } from "./emitError.ts";
import { readTextFile } from "./fs.ts";
import { createProgramFromImportGraph } from "./tsUtils.ts";
import { resolve } from "./path.ts";

async function main(args: string[]): Promise<int32> {
  // TODO: Check the args
  const inputFilePath = resolve(args[0] as string);
  const outputFilePath = (args[1] as string) + "/main.go";

  const program = await createProgramFromImportGraph(inputFilePath);

  const emitResult = program.emit();

  const allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);

  allDiagnostics.forEach((diagnostic) => {
    // TODO: Print with colors
    if (diagnostic.file) {
      let { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start!
      );
      let message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.log(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
      );
    }
  });

  const entrySourceFile = program
    .getSourceFiles()
    .find((x) => x.fileName === inputFilePath);

  if (!entrySourceFile) {
    console.error("ERROR: Failed to get entrySourceFile.");
    return 1;
  }

  let result: EmitResult = undefined!;

  try {
    result = await emit(program, entrySourceFile);
  } catch (error) {
    if (error instanceof EmitError) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    return 1;
  }

  const outputDirectory = path.dirname(outputFilePath);

  try {
    await fs.mkdir(path.dirname(outputFilePath), { recursive: true });
  } catch (err) {
    console.error(`Failed to create output directory: ${outputDirectory}`);
    return 1;
  }

  await fs.writeFile(outputFilePath, result.output, "utf8");

  return 0;
}

process.exit(await main(process.argv.slice(2)));
