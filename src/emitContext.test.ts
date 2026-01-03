import { assert, describe, it } from "./test.ts";
import { createProgramFromSourceTexts } from "./tsUtils.ts";
import { TEST_COMPILER_HOST } from "./testCompilerHost.ts";
import { EmitContext } from "./emitContext.ts";

function createEmitContext(sourceTexts: Record<string, string>): EmitContext {
  const program = createProgramFromSourceTexts(sourceTexts, {
    host: TEST_COMPILER_HOST,
  });

  const entrySourceFile = program
    .getSourceFiles()
    .find((x) => x.fileName === "main.ts");

  if (!entrySourceFile) {
    throw new Error("main.ts is missing.");
  }

  return new EmitContext(program, entrySourceFile);
}

describe("emitContext.ts", () => {
  it("sourceFile is the entrySourceFile directly after construction", () => {
    const emitContext = createEmitContext({
      "main.ts": `console.info("Hello World!");`,
    });
    assert.equal(emitContext.sourceFile.fileName, "main.ts");
  });
});
