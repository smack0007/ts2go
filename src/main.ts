import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";
import { ROOT_PATH, SCRIPT_TARGET } from "./constants.ts";
import { emit } from "./emit.ts";
import { type EmitResult } from "./emitResult.ts";
import { EmitError } from "./emitError.ts";

async function main(args: string[]): Promise<int32> {
  // TODO: Check these
  const inputFilePath = args[0] as string;
  const outputFilePath = (args[1] as string) + "/main.go";

  const program = ts.createProgram(
    [path.join(ROOT_PATH, "types", "ts2go.d.ts"), inputFilePath],
    {
      target: SCRIPT_TARGET,
    }
  );

  const typeChecker = program.getTypeChecker();

  const sourceFiles = program
    .getSourceFiles()
    .filter((x) => !x.isDeclarationFile);

  if (sourceFiles.length > 1) {
    console.error("Multiple source files currently not supported.");
    return 1;
  }

  const sourceFile = sourceFiles[0]!;
  let result: EmitResult = undefined!;

  try {
    result = await emit(typeChecker, sourceFile);
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
