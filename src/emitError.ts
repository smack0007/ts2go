import ts from "typescript";
import { type EmitContext } from "./emitContext.ts";

export class EmitError extends Error {
  context: EmitContext;
	node: ts.Node;
	
	constructor(context: EmitContext, node: ts.Node, message: string) {
		const { line, character } = context.sourceFile.getLineAndCharacterOfPosition(node.getStart(context.sourceFile));
    super(`(${line + 1}, ${character + 1}): ${message}`);
    
		this.context = context;
		this.node = node;
  }
}