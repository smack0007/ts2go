import ts from "typescript";

export function isArrayAtLocation(
  typeChecker: ts.TypeChecker,
  node: ts.Node
): boolean {
  return typeChecker.isArrayLikeType(typeChecker.getTypeAtLocation(node));
}

export function isNumberAtLocation(
  typeChecker: ts.TypeChecker,
  node: ts.Node
): boolean {
  return isTypeNumber(typeChecker, typeChecker.getTypeAtLocation(node));
}

export function isTypeNumber(
  typeChecker: ts.TypeChecker,
  type: ts.Type
): boolean {
  return typeChecker.isTypeAssignableTo(type, typeChecker.getNumberType());
}

export function getTypeString(
  typeChecker: ts.TypeChecker,
  type: ts.Type
): string {
  if (typeChecker.isArrayType(type)) {
    const arrayElementType = typeChecker.getTypeArguments(
      type as ts.TypeReference
    )[0]!;
    return "[]" + getTypeString(typeChecker, arrayElementType);
  }

  if (type.isStringLiteral()) {
    return "string";
  }

  // Only map numeric literals or types that map to number to int. int32
  // for example should remain int32.
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
