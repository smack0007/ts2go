import * as assert from "node:assert";
import { describe, it } from "node:test";
import * as ts from "typescript";
import { createSourceFileAndTypeChecker, kindString } from "./tsUtils.ts";
import { findByKind } from "./typeUtils.ts";
import { getTypeStringAtLocation } from "./typeChecker.ts";

describe("getTypeStringAtLocation", () => {
  const testCases: Array<[string, ts.SyntaxKind, string]> = [
    ["const x = 42;", ts.SyntaxKind.VariableDeclaration, "int"],
    ["const x: int32 = 42;", ts.SyntaxKind.VariableDeclaration, "int32"],
    ["const x = 24 + 12;", ts.SyntaxKind.VariableDeclaration, "int"],

    ['const name = "Bob";', ts.SyntaxKind.VariableDeclaration, "string"],
  ];

  for (const [source, syntaxKind, expected] of testCases) {
    it(`<${source}> => "${expected}"`, () => {
      const [sourceFile, typeChecker] = createSourceFileAndTypeChecker(source);

      const node = findByKind(sourceFile, syntaxKind);

      assert.ok(node);

      assert.equal(getTypeStringAtLocation(typeChecker, node), expected);
    });
  }
});
