import ts from "typescript";
import { isFirstCharacterDigit } from "./utils.ts";

export function isNodeWithType(
  node: ts.Node
): node is ts.Node & { type: ts.TypeNode } {
  return !!(node as unknown as { type: ts.Type }).type;
}

export function isArrayTypeName(typeName: string): boolean {
  return typeName.startsWith("Array<") && typeName.endsWith(">");
}

export function isPointerTypeName(typeName: string): boolean {
  return typeName.startsWith("Pointer<") && typeName.endsWith(">");
}

export function filterByKind<TNode extends ts.Node>(
  rootNode: ts.Node,
  kind: ts.SyntaxKind
): TNode[] {
  const results: TNode[] = [];

  function visit(node: ts.Node) {
    if (node.kind === kind) {
      results.push(node as TNode);
    }

    node.forEachChild(visit);
  }

  rootNode.forEachChild(visit);

  return results;
}

export function findByKind<TNode extends ts.Node>(
  rootNode: ts.Node,
  kind: ts.SyntaxKind
): TNode | undefined {
  let result: TNode | undefined = undefined;

  function visit(node: ts.Node) {
    if (result === undefined && node.kind === kind) {
      result = node as TNode;
    }

    if (result === undefined) {
      node.forEachChild(visit);
    }
  }

  rootNode.forEachChild(visit);

  return result;
}

function getAllSymbolsFromRootNode(
  rootNode: ts.Node,
  typeChecker: ts.TypeChecker
): Record<string, ts.Symbol> {
  const symbols: Record<string, ts.Symbol> = {};

  function visit(node: ts.Node) {
    const symbol = typeChecker.getSymbolAtLocation(node);

    if (symbol) {
      symbols[symbol.name] = symbol;
    }

    node.forEachChild(visit);
  }

  rootNode.forEachChild(visit);

  return symbols;
}
