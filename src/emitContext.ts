import ts, { SourceFile } from "typescript";
import { Stack } from "./stack.ts";
import { StringBuilder } from "./stringBuilder.ts";
import {
  getTypeStringAtLocation,
  isArrayAtLocation,
  isNumberAtLocation,
} from "./typeChecker.ts";
import { dirname, resolveModule } from "./path.ts";

export class EmitContext {
  private _program: ts.Program;
  private _typeChecker: ts.TypeChecker;
  private _entrySourceFile: ts.SourceFile;

  private _outputStack = new Stack<StringBuilder>([new StringBuilder()]);
  private _sourceFileStack = new Stack<ts.SourceFile>();

  constructor(program: ts.Program, entrySourceFile: ts.SourceFile) {
    this._program = program;
    this._typeChecker = this._program.getTypeChecker();
    this._entrySourceFile = entrySourceFile;
    this._sourceFileStack.push(this._entrySourceFile);
  }

  public get output(): StringBuilder {
    return this._outputStack.top;
  }

  public get sourceFile(): ts.SourceFile {
    return this._sourceFileStack.top;
  }

  public pushOutput(output: StringBuilder): void {
    this._outputStack.push(output);
  }

  public popOutput(): void {
    this._outputStack.pop();
  }

  public pushSourceFile(path: string): SourceFile {
    const resolvedPath = resolveModule(path, dirname(this.sourceFile.fileName));

    const resolvedSourceFile = this._program
      .getSourceFiles()
      .find((x) => x.fileName === resolvedPath);

    if (!resolvedSourceFile) {
      throw new Error(`Failed to find resolved source file "${resolvedPath}".`);
    }

    return resolvedSourceFile;
  }

  public popSourceFile(): void {
    this._sourceFileStack.pop();
  }

  public isArray(node: ts.Node): boolean {
    return isArrayAtLocation(this._typeChecker, node);
  }

  public isNumber(node: ts.Node): boolean {
    return isNumberAtLocation(this._typeChecker, node);
  }

  public getTypeName(node: ts.Node): string {
    return getTypeStringAtLocation(this._typeChecker, node);
  }
}
