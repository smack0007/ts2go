import ts from "typescript";
import { Stack } from "./stack.ts";
import { StringBuilder } from "./stringBuilder.ts";
import { VariableScope } from "./variableScope.ts";
import { withIsUsed, type IsUsed } from "./markers.ts";
import { isNodeWithType, mapTypeName } from "./typeUtils.ts";
// import { isPointerCastExpression } from "./customNodes.ts";
import { nodeKindString } from "./tsUtils.ts";
import { EmitError } from "./emitError.ts";
import { getTypeStringAtLocation } from "./typeChecker.ts";

export class EmitContext {
  private _typeChecker: ts.TypeChecker;
  private _sourceFile: ts.SourceFile;

  private _outputStack = new Stack<StringBuilder>([new StringBuilder()]);

  constructor(typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile) {
    this._typeChecker = typeChecker;
    this._sourceFile = sourceFile;
  }

  public get output(): StringBuilder {
    return this._outputStack.top;
  }

  public pushOutput(output: StringBuilder): void {
    this._outputStack.push(output);
  }

  public popOutput(): void {
    this._outputStack.pop();
  }

  public getTypeName(node: ts.Node): string {
    return getTypeStringAtLocation(this._typeChecker, node);
  }
}
