import * as ts from "typescript";

export function getTypeString(
  typeChecker: ts.TypeChecker,
  type: ts.Type
): string {
  if (type.isStringLiteral()) {
    return "string";
  }

  if (type.isNumberLiteral() || type === typeChecker.getNumberType()) {
    return "int";
  }

  return typeChecker.typeToString(type);
}

export function getTypeStringAtLocation(
  typeChecker: ts.TypeChecker,
  node: ts.Node
): string {
  return getTypeString(typeChecker, typeChecker.getTypeAtLocation(node));
}
