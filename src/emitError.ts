import ts from "typescript";
import { type EmitContext } from "./emitContext.ts";

export class EmitError extends Error {
  context: EmitContext;
  node: ts.Node;

  constructor(context: EmitContext, node: ts.Node, message: string) {
    const { line, character } =
      context._sourceFile.getLineAndCharacterOfPosition(
        node.getStart(context._sourceFile)
      );
    super(`(${line + 1}, ${character + 1}): ${message}`);

    this.context = context;
    this.node = node;
  }
}
