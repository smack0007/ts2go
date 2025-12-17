import ts from "typescript";
import { createEnumToStringMapFunction } from "./utils.ts";
import { RUNTIME_TYPE_DEFINITION_PATH, SCRIPT_TARGET } from "./constants.ts";

export function isAsConstExpression(node: ts.Node): node is ts.AsExpression {
  return ts.isAsExpression(node) && ts.isConstTypeReference(node.type);
}

export function createSourceFileAndTypeChecker(
  source: string
): [ts.SourceFile, ts.TypeChecker] {
  const sourceFileName = "source.ts";
  const sourceFile = ts.createSourceFile(sourceFileName, source, SCRIPT_TARGET);

  const defaultCompilerHost = ts.createCompilerHost({});

  const customCompilerHost: ts.CompilerHost = {
    ...defaultCompilerHost,
    getSourceFile: (name, languageVersion) => {
      if (name === sourceFileName) {
        return sourceFile;
      } else {
        return defaultCompilerHost.getSourceFile(name, languageVersion);
      }
    },
  };

  const program = ts.createProgram(
    [RUNTIME_TYPE_DEFINITION_PATH, sourceFileName],
    {
      target: SCRIPT_TARGET,
    },
    customCompilerHost
  );

  return [sourceFile, program.getTypeChecker()];
}

const kindStringMapper = createEnumToStringMapFunction(ts.SyntaxKind);

export function kindString(kind: ts.SyntaxKind): string {
  return kindStringMapper(kind);
}

export function nodeKindString(node: ts.Node): string {
  return kindString(node.kind);
}
