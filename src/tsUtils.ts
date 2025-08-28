import ts from "typescript";
import { createEnumToStringMapFunction } from "./utils.ts";

export function isAsConstExpression(node: ts.Node): node is ts.AsExpression {
  return ts.isAsExpression(node) && ts.isConstTypeReference(node.type);
}

const kindStringMapper = createEnumToStringMapFunction(ts.SyntaxKind);

export function kindString(kind: ts.SyntaxKind): string {
  return kindStringMapper(kind);
}

export function nodeKindString(node: ts.Node): string {
  return kindString(node.kind);
}