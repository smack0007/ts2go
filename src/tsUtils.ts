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

export function createCachedCompilerHost(): ts.CompilerHost {
  const cache: Record<string, ts.SourceFile> = {};

  const compilerHost = ts.createCompilerHost({});
  const getSourceFile = compilerHost.getSourceFile;
  compilerHost.getSourceFile = (fileName, languageVersion) => {
    if (cache[fileName]) {
      return cache[fileName];
    }

    const sourceFile = getSourceFile(fileName, languageVersion);

    if (sourceFile) {
      cache[fileName] = sourceFile;
    }

    return sourceFile;
  };

  return compilerHost;
}

interface CreateProgramOptions {
  host?: ts.CompilerHost;
}

export function createProgramFromSourceTexts(
  sourceTexts: Record<string, string>,
  options: CreateProgramOptions = {}
): ts.Program {
  const sourceFiles: Record<string, ts.SourceFile> = Object.fromEntries(
    Object.entries(sourceTexts).map(([sourceFileName, sourceText]) => [
      sourceFileName,
      ts.createSourceFile(
        sourceFileName,
        sourceText,
        TS_COMPILER_OPTIONS.target
      ),
    ])
  );

  const compilerHost = options.host ?? ts.createCompilerHost({});

  const customCompilerHost: ts.CompilerHost = {
    ...compilerHost,
    getSourceFile: (fileName, languageVersion) => {
      if (sourceFiles[fileName] !== undefined) {
        return sourceFiles[fileName];
      } else {
        return compilerHost.getSourceFile(fileName, languageVersion);
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

export async function createProgramFromImportGraph(
  entrySourceFilePath: string,
  options: CreateProgramOptions = {}
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

  const compilerHost = options.host ?? ts.createCompilerHost({});

  const customCompilerHost: ts.CompilerHost = {
    ...compilerHost,
    getSourceFile: (name, languageVersion) => {
      if (sourceFiles[name] !== undefined) {
        return sourceFiles[name];
      } else {
        return compilerHost.getSourceFile(name, languageVersion);
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
  sourceFile: ts.SourceFile
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
