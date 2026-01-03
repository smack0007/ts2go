import ts from "typescript";
import { createEnumToStringMapFunction } from "./utils.ts";
import {
  RUNTIME_TYPE_DEFINITION_PATH,
  TS_COMPILER_OPTIONS,
} from "./constants.ts";
import { dirname, resolveModule } from "./path.ts";
import { readTextFile } from "./fs.ts";

const KIND_STRING_MAPPER = createEnumToStringMapFunction(ts.SyntaxKind);

export function isAsConstExpression(node: ts.Node): node is ts.AsExpression {
  return ts.isAsExpression(node) && ts.isConstTypeReference(node.type);
}

interface CreateSourceFileOptions {
  fileName?: string;
}

const DEFAULT_COMPILER_HOST_SOURCE_FILE_CACHE: Record<string, ts.SourceFile> =
  {};

const DEFAULT_COMPILER_HOST = ts.createCompilerHost({});
const baseGetSourceFile = DEFAULT_COMPILER_HOST.getSourceFile;
DEFAULT_COMPILER_HOST.getSourceFile = (name, languageVersion) => {
  if (DEFAULT_COMPILER_HOST_SOURCE_FILE_CACHE[name]) {
    return DEFAULT_COMPILER_HOST_SOURCE_FILE_CACHE[name];
  }

  const sourceFile = baseGetSourceFile(name, languageVersion);

  if (sourceFile) {
    DEFAULT_COMPILER_HOST_SOURCE_FILE_CACHE[name] = sourceFile;
  }

  return sourceFile;
};

export function createProgramFromSourceString(
  source: string,
  options: CreateSourceFileOptions = {}
): ts.Program {
  const sourceFileName = options.fileName ?? "source.ts";
  const sourceFile = ts.createSourceFile(
    sourceFileName,
    source,
    TS_COMPILER_OPTIONS.target
  );

  const customCompilerHost: ts.CompilerHost = {
    ...DEFAULT_COMPILER_HOST,
    getSourceFile: (name, languageVersion) => {
      if (name === sourceFileName) {
        return sourceFile;
      } else {
        return DEFAULT_COMPILER_HOST.getSourceFile(name, languageVersion);
      }
    },
  };

  const program = ts.createProgram(
    [RUNTIME_TYPE_DEFINITION_PATH, sourceFileName],
    TS_COMPILER_OPTIONS,
    customCompilerHost
  );

  return program;
}

export async function createProgramFromImportGraph(
  entrySourceFilePath: string
): Promise<ts.Program> {
  const sourceFiles: Record<string, ts.SourceFile> = {};

  // TODO: Currently doesn't work with dynamic imports

  async function visitImportDeclaration(
    basePath: string,
    importDeclaration: ts.ImportDeclaration
  ) {
    const sourceFilePath = resolveModule(
      (importDeclaration.moduleSpecifier as ts.StringLiteral).text,
      basePath
    );

    if (sourceFiles[sourceFilePath] !== undefined) {
      return;
    }

    const sourceFile = ts.createSourceFile(
      sourceFilePath,
      await readTextFile(sourceFilePath),
      TS_COMPILER_OPTIONS.target!
    );

    visitSourceFile(sourceFile);
  }

  async function visitSourceFile(sourceFile: ts.SourceFile) {
    sourceFiles[sourceFile.fileName] = sourceFile;

    const basePath = dirname(sourceFile.fileName);

    for (const statement of sourceFile.statements) {
      if (statement.kind !== ts.SyntaxKind.ImportDeclaration) {
        continue;
      }
      await visitImportDeclaration(basePath, statement as ts.ImportDeclaration);
    }
  }

  const entrySourceFile = ts.createSourceFile(
    entrySourceFilePath,
    await readTextFile(entrySourceFilePath),
    TS_COMPILER_OPTIONS.target!
  );

  await visitSourceFile(entrySourceFile);

  const defaultCompilerHost = ts.createCompilerHost({});

  const customCompilerHost: ts.CompilerHost = {
    ...defaultCompilerHost,
    getSourceFile: (name, languageVersion) => {
      if (sourceFiles[name] !== undefined) {
        return sourceFiles[name];
      } else {
        // TODO: Should an error just be thrown here?
        return defaultCompilerHost.getSourceFile(name, languageVersion);
      }
    },
  };

  const program = ts.createProgram(
    [RUNTIME_TYPE_DEFINITION_PATH, ...Object.keys(sourceFiles)],
    TS_COMPILER_OPTIONS,
    customCompilerHost
  );

  return program;
}

export function getTopLevelNames(
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
): Record<string, ts.Statement> {
  const names: Record<string, ts.Statement> = {};

  function visit(statement: ts.Statement) {
    switch (statement.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
        const functionDeclaration = statement as ts.FunctionDeclaration;
        if (functionDeclaration.name) {
          names[functionDeclaration.name.text] = functionDeclaration;
        }
    }
  }

  sourceFile.statements.forEach(visit);

  return names;
}

export function kindString(kind: ts.SyntaxKind): string {
  return KIND_STRING_MAPPER(kind);
}

export function nodeKindString(node: ts.Node): string {
  return kindString(node.kind);
}
