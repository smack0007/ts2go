import ts from "typescript";
import { assert, describe, it } from "./test.ts";
import { TEST_COMPILER_HOST } from "./testCompilerHost.ts";
import { createProgramFromSourceTexts } from "./tsUtils.ts";
import { findByKind } from "./typeUtils.ts";
import {
  getTypeStringAtLocation,
  isArrayAtLocation,
  isNumberAtLocation,
} from "./typeChecker.ts";

function createSourceFileAndTypeChecker(
  source: string
): [ts.SourceFile, ts.TypeChecker] {
  const program = createProgramFromSourceTexts(
    { "main.ts": source },
    {
      host: TEST_COMPILER_HOST,
    }
  );
  const sourceFile = program
    .getSourceFiles()
    .find((x) => x.fileName === "main.ts")!;
  return [sourceFile, program.getTypeChecker()];
}

describe("typeChecker.ts", () => {
  describe("isArrayAtLocation", () => {
    const testCases: Array<[string, ts.SyntaxKind, boolean]> = [
      ["const x = [1, 2, 3];", ts.SyntaxKind.VariableDeclaration, true],
      ["const x: int[] = [1, 2, 3];", ts.SyntaxKind.VariableDeclaration, true],
      [
        "const x: Array<int> = [1, 2, 3];",
        ts.SyntaxKind.VariableDeclaration,
        true,
      ],

      [`const x = "Hello World!";`, ts.SyntaxKind.VariableDeclaration, false],
      ["const x = 42;", ts.SyntaxKind.VariableDeclaration, false],
    ];

    for (const [source, syntaxKind, expected] of testCases) {
      it(`<${source}> => ${expected}`, () => {
        const [sourceFile, typeChecker] =
          createSourceFileAndTypeChecker(source);

        const node = findByKind(sourceFile, syntaxKind);
        assert.ok(node);
        assert.equal(isArrayAtLocation(typeChecker, node), expected);
      });
    }
  });

  describe("isNumberAtLocation", () => {
    const testCases: Array<[string, ts.SyntaxKind, boolean]> = [
      ["const x = 42;", ts.SyntaxKind.VariableDeclaration, true],
      ["const x: int = 42;", ts.SyntaxKind.VariableDeclaration, true],
      ["const x: int32 = 42;", ts.SyntaxKind.VariableDeclaration, true],
      ["const x = 24 + 12;", ts.SyntaxKind.VariableDeclaration, true],

      [`const x = "Hello World!";`, ts.SyntaxKind.VariableDeclaration, false],
      ["const x = [1, 2, 3];", ts.SyntaxKind.VariableDeclaration, false],
    ];

    for (const [source, syntaxKind, expected] of testCases) {
      it(`<${source}> => ${expected}`, () => {
        const [sourceFile, typeChecker] =
          createSourceFileAndTypeChecker(source);

        const node = findByKind(sourceFile, syntaxKind);
        assert.ok(node);
        assert.equal(isNumberAtLocation(typeChecker, node), expected);
      });
    }
  });

  describe("getTypeStringAtLocation", () => {
    const testCases: Array<[string, ts.SyntaxKind, string]> = [
      //
      // int
      //
      ["const x = 42;", ts.SyntaxKind.VariableDeclaration, "int"],
      ["const x: int32 = 42;", ts.SyntaxKind.VariableDeclaration, "int32"],
      ["const x = 24 + 12;", ts.SyntaxKind.VariableDeclaration, "int"],

      //
      // string
      //
      ['const name = "Bob";', ts.SyntaxKind.VariableDeclaration, "string"],

      //
      // Arrays
      //
      ["const x = [1, 2, 3];", ts.SyntaxKind.VariableDeclaration, "[]int"],
      [
        "const x: Array<int> = [1, 2, 3];",
        ts.SyntaxKind.VariableDeclaration,
        "[]int",
      ],
      [
        "const x: int32[] = [1, 2, 3];",
        ts.SyntaxKind.VariableDeclaration,
        "[]int32",
      ],
      [
        "const x: Array<int32> = [1, 2, 3];",
        ts.SyntaxKind.VariableDeclaration,
        "[]int32",
      ],
    ];

    for (const [source, syntaxKind, expected] of testCases) {
      it(`<${source}> => "${expected}"`, () => {
        const [sourceFile, typeChecker] =
          createSourceFileAndTypeChecker(source);

        const node = findByKind(sourceFile, syntaxKind);
        assert.ok(node);
        assert.equal(getTypeStringAtLocation(typeChecker, node), expected);
      });
    }
  });
});
