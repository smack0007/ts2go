import * as ts from "typescript";
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

function getGenericTypeNameParams(typeName: string): string {
  const openingAngleBracket = typeName.indexOf("<");
  const closingAngleBracket = typeName.lastIndexOf(">");

  if (openingAngleBracket != -1 && closingAngleBracket != -1) {
    return typeName.substring(openingAngleBracket + 1, closingAngleBracket);
  }

  return "";
}

export function mapTypeName(typeName: string): string {
  if (typeName.endsWith("[]")) {
    typeName = typeName.substring(0, typeName.length - 2);
    typeName = `Array<${typeName}>`;
  }

  let genericParams = getGenericTypeNameParams(typeName);
  if (genericParams != "") {
    genericParams = mapTypeName(genericParams);

    typeName = typeName.substring(0, typeName.indexOf("<"));

    // If we're outputting a Pointer and the generic params are an
    // array then remove the array.
    if (typeName === "Pointer" && isArrayTypeName(genericParams)) {
      genericParams = getGenericTypeNameParams(genericParams);
    }

    typeName = `${typeName}<${genericParams}>`;
  }

  if (typeName.startsWith('"') && typeName.endsWith('"')) {
    typeName = "string";
  }

  if (isFirstCharacterDigit(typeName)) {
    if (typeName.includes(".")) {
      typeName = "f64";
    } else {
      typeName = "i32";
    }
  }

  if (typeName.includes("number[]")) {
    typeName = typeName.replaceAll("number[]", "i32[]");
  }

  // TODO: This probably doesn't work for arrays of arrays

  if (typeName.includes("ptr<")) {
    typeName = typeName.replaceAll("ptr<", "Pointer<");
  }

  switch (typeName) {
    case "boolean":
    case "true":
    case "false":
      typeName = "bool";
      break;

    case "number":
      typeName = "i32";
      break;
  }

  return typeName;
}
