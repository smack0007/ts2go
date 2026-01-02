import ts from "typescript";
import { EmitContext } from "./emitContext.ts";
import { EmitError } from "./emitError.ts";
import { type EmitResult } from "./emitResult.ts";
import { nodeKindString } from "./tsUtils.ts";
import { firstLetterToUpper, hasFlag } from "./utils.ts";

export async function emit(
  program: ts.Program,
  entrySourceFile: ts.SourceFile
): Promise<EmitResult> {
  const context = new EmitContext(program, entrySourceFile);

  emitPreamble(context);

  emitSourceFile(context, entrySourceFile);

  return {
    output: context.output.toString(),
  };
}

function emitPreamble(context: EmitContext): void {
  context.output.appendLine("package main");
  context.output.appendLine();
  context.output.appendLine("import (");
  context.output.appendLine('  "fmt"');
  context.output.appendLine('  "ts2go/console"');
  context.output.appendLine(")");
  context.output.appendLine();
}

function emitSourceFile(context: EmitContext, sourceFile: ts.SourceFile) {
  for (const statement of sourceFile.statements) {
    emitTopLevelStatement(context, statement);
  }
}

function emitTopLevelStatement(
  context: EmitContext,
  statement: ts.Statement
): void {
  switch (statement.kind) {
    case ts.SyntaxKind.FunctionDeclaration:
      emitFunctionDeclaration(context, statement as ts.FunctionDeclaration);
      break;

    case ts.SyntaxKind.ImportDeclaration:
      emitImportDeclaration(context, statement as ts.ImportDeclaration);
      break;

    // case ts.SyntaxKind.InterfaceDeclaration:
    //   emitInterfaceDeclaration(context, statement as ts.InterfaceDeclaration);
    //   break;

    // case ts.SyntaxKind.TypeAliasDeclaration:
    //   emitTypeAliasDeclaration(context, statement as ts.TypeAliasDeclaration);
    //   break;

    // case ts.SyntaxKind.VariableStatement:
    //   emitVariableStatement(context, statement as ts.VariableStatement, { isGlobal: true });
    //   break;

    default:
      throw new EmitError(
        context,
        statement,
        `Failed to emit ${nodeKindString(statement)} in ${
          emitTopLevelStatement.name
        }.`
      );
  }
}

function emitFunctionDeclaration(
  context: EmitContext,
  functionDeclaration: ts.FunctionDeclaration
): void {
  if (!functionDeclaration.name) {
    throw new EmitError(
      context,
      functionDeclaration,
      `Expected function name to be defined.`
    );
  }

  context.output.append(`func ${functionDeclaration.name.escapedText}(`);

  for (let i = 0; i < functionDeclaration.parameters.length; i++) {
    if (i !== 0) {
      context.output.append(", ");
    }

    const parameter = functionDeclaration.parameters[i];
    const parameterType = context.getTypeName(parameter);
    context.output.append(
      `${(parameter.name as ts.Identifier).escapedText} ${parameterType}`
    );
  }

  context.output.append(")");

  if (!functionDeclaration.type) {
    throw new EmitError(
      context,
      functionDeclaration,
      `Expected function return type to be defined.`
    );
  }

  const returnType = context.getTypeName(functionDeclaration.type);

  if (returnType != "void") {
    context.output.append(` ${returnType}`);
  }
  context.output.append(" ");

  if (!functionDeclaration.body) {
    throw new EmitError(
      context,
      functionDeclaration,
      `Cannot emit ${nodeKindString(functionDeclaration)} with undefined body.`
    );
  }

  emitBlock(context, functionDeclaration.body);

  context.output.appendLine();
  context.output.appendLine();
}

function emitImportDeclaration(
  context: EmitContext,
  functionDeclaration: ts.ImportDeclaration
): void {
  const sourceFile = context.pushSourceFile(
    (functionDeclaration.moduleSpecifier as ts.StringLiteral).text
  );

  // TODO: Check if the file has already be emitted.
  // TODO: Namespace the identifiers of the file.

  emitSourceFile(context, sourceFile);

  context.popSourceFile();
}

interface EmitVaraibleStatementOptions {
  isGlobal?: boolean;
}

function emitVariableStatement(
  context: EmitContext,
  variableStatement: ts.VariableStatement,
  options: EmitVaraibleStatementOptions = {}
): void {
  const { isGlobal = false } = options;

  const isConst = hasFlag(
    variableStatement.declarationList.flags,
    ts.NodeFlags.Const
  );

  emitVariableDeclarationList(context, variableStatement.declarationList, {
    isGlobal,
    isConst,
  });

  context.output.appendLine();
}

interface EmitVariableDeclarationListOptions {
  isGlobal?: boolean;
  isConst?: boolean;
}

function emitVariableDeclarationList(
  context: EmitContext,
  variableDeclarationList: ts.VariableDeclarationList,
  options: EmitVariableDeclarationListOptions = {}
): void {
  const { isGlobal = false, isConst = false } = options;

  for (const variableDeclaration of variableDeclarationList.declarations) {
    const typeName = context.getTypeName(variableDeclaration);

    if (variableDeclaration.initializer) {
      emitIdentifier(context, variableDeclaration.name as ts.Identifier);
      context.output.append(" := ");

      const castInitializer = context.isNumber(variableDeclaration);

      if (castInitializer) {
        context.output.append(`${typeName}(`);
      }

      emitExpression(context, variableDeclaration.initializer);

      if (castInitializer) {
        context.output.append(`)`);
      }
    } else {
      context.output.append("var ");
      emitIdentifier(context, variableDeclaration.name as ts.Identifier);
      context.output.append(" ");
      context.output.append(typeName);
    }
  }
}

function emitBlock(context: EmitContext, block: ts.Block): void {
  context.output.appendLine("{");
  context.output.indent();

  for (const statement of block.statements) {
    emitBlockLevelStatement(context, statement);
  }

  context.output.unindent();
  context.output.append("}");
}

function emitBlockLevelStatement(
  context: EmitContext,
  statement: ts.Statement
): void {
  switch (statement.kind) {
    case ts.SyntaxKind.Block:
      emitBlock(context, statement as ts.Block);
      break;

    // case ts.SyntaxKind.DoStatement:
    //   emitDoStatement(context, statement as ts.DoStatement);
    //   break;

    case ts.SyntaxKind.ExpressionStatement:
      emitExpressionStatement(context, statement as ts.ExpressionStatement);
      break;

    case ts.SyntaxKind.ForStatement:
      emitForStatement(context, statement as ts.ForStatement);
      break;

    // case ts.SyntaxKind.IfStatement:
    //   emitIfStatement(context, statement as ts.IfStatement);
    //   break;

    case ts.SyntaxKind.ReturnStatement:
      emitReturnStatement(context, statement as ts.ReturnStatement);
      break;

    case ts.SyntaxKind.VariableStatement:
      emitVariableStatement(context, statement as ts.VariableStatement);
      break;

    // case ts.SyntaxKind.WhileStatement:
    //   emitWhileStatement(context, statement as ts.WhileStatement);
    //   break;

    default:
      throw new EmitError(
        context,
        statement,
        `Failed to emit ${nodeKindString(statement)} in ${
          emitBlockLevelStatement.name
        }.`
      );
  }
}

function emitExpressionStatement(
  context: EmitContext,
  expressionStatement: ts.ExpressionStatement
): void {
  emitExpression(context, expressionStatement.expression);
  context.output.appendLine();
}

function emitForStatement(
  context: EmitContext,
  forStatement: ts.ForStatement
): void {
  context.output.append("for ");

  if (forStatement.initializer) {
    if (
      forStatement.initializer.kind === ts.SyntaxKind.VariableDeclarationList
    ) {
      emitVariableDeclarationList(
        context,
        forStatement.initializer as ts.VariableDeclarationList
      );
    } else {
      emitExpression(context, forStatement.initializer as ts.Expression);
    }
  }
  context.output.append("; ");

  if (forStatement.condition) {
    emitExpression(context, forStatement.condition);
  }
  context.output.append("; ");

  if (forStatement.incrementor) {
    emitExpression(context, forStatement.incrementor);
  }
  context.output.append(" ");

  emitBlockLevelStatement(context, forStatement.statement);

  context.output.appendLine();
}

function emitReturnStatement(
  context: EmitContext,
  returnStatement: ts.ReturnStatement
): void {
  if (returnStatement.expression) {
    context.output.append("return ");
    emitExpression(context, returnStatement.expression);
    context.output.appendLine();
  } else {
    context.output.appendLine("return");
  }
}

function emitExpression(context: EmitContext, expression: ts.Expression): void {
  switch (expression.kind) {
    case ts.SyntaxKind.ArrayLiteralExpression:
      emitArrayLiteralExpression(
        context,
        expression as ts.ArrayLiteralExpression
      );
      break;

    // case ts.SyntaxKind.AsExpression:
    //   emitAsExpression(context, expression as ts.AsExpression);
    //   break;

    case ts.SyntaxKind.BinaryExpression:
      emitBinaryExpression(context, expression as ts.BinaryExpression);
      break;

    case ts.SyntaxKind.CallExpression:
      emitCallExpression(context, expression as ts.CallExpression);
      break;

    case ts.SyntaxKind.ElementAccessExpression:
      emitElementAccessExpression(
        context,
        expression as ts.ElementAccessExpression
      );
      break;

    case ts.SyntaxKind.Identifier:
      emitIdentifier(context, expression as ts.Identifier);
      break;

    case ts.SyntaxKind.NumericLiteral:
      emitNumericLiteral(context, expression as ts.NumericLiteral);
      break;

    case ts.SyntaxKind.ObjectLiteralExpression:
      emitObjectLiteralExpression(
        context,
        expression as ts.ObjectLiteralExpression
      );
      break;

    case ts.SyntaxKind.ParenthesizedExpression:
      emitParenthesizedExpression(
        context,
        expression as ts.ParenthesizedExpression
      );
      break;

    case ts.SyntaxKind.PrefixUnaryExpression:
      emitPrefixUnaryExpression(
        context,
        expression as ts.PrefixUnaryExpression
      );
      break;

    case ts.SyntaxKind.PostfixUnaryExpression:
      emitPostfixUnaryExpression(
        context,
        expression as ts.PostfixUnaryExpression
      );
      break;

    case ts.SyntaxKind.PropertyAccessExpression:
      emitPropertyAccessExpression(
        context,
        expression as ts.PropertyAccessExpression
      );
      break;

    case ts.SyntaxKind.StringLiteral:
      emitStringLiteral(context, expression as ts.StringLiteral);
      break;

    case ts.SyntaxKind.TemplateExpression:
      emitTemplateExpression(context, expression as ts.TemplateExpression);
      break;

    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
      emitBooleanLiteral(context, expression as ts.BooleanLiteral);
      break;

    default:
      throw new EmitError(
        context,
        expression,
        `Failed to emit ${nodeKindString(expression)} in ${
          emitExpression.name
        }.`
      );
  }
}

function emitArrayLiteralExpression(
  context: EmitContext,
  arrayLiteralExpression: ts.ArrayLiteralExpression
): void {
  const type = context.getTypeName(arrayLiteralExpression);

  context.output.append(`${type}{`);

  for (let i = 0; i < arrayLiteralExpression.elements.length; i++) {
    emitExpression(context, arrayLiteralExpression.elements[i]!);
    if (i !== arrayLiteralExpression.elements.length - 1) {
      context.output.append(", ");
    }
  }

  context.output.append(`}`);
}

function emitBinaryExpression(
  context: EmitContext,
  binaryExpression: ts.BinaryExpression
): void {
  emitExpression(context, binaryExpression.left);

  switch (binaryExpression.operatorToken.kind) {
    case ts.SyntaxKind.AsteriskToken:
      context.output.append(" * ");
      break;

    case ts.SyntaxKind.AsteriskEqualsToken:
      context.output.append(" *= ");
      break;

    case ts.SyntaxKind.FirstAssignment:
      context.output.append(" = ");
      break;

    case ts.SyntaxKind.GreaterThanToken:
      context.output.append(" > ");
      break;

    case ts.SyntaxKind.GreaterThanEqualsToken:
      context.output.append(" >= ");
      break;

    case ts.SyntaxKind.LessThanToken:
      context.output.append(" < ");
      break;

    case ts.SyntaxKind.LessThanEqualsToken:
      context.output.append(" <= ");
      break;

    case ts.SyntaxKind.MinusToken:
      context.output.append(" - ");
      break;

    case ts.SyntaxKind.MinusEqualsToken:
      context.output.append(" -= ");
      break;

    case ts.SyntaxKind.PlusToken:
      context.output.append(" + ");
      break;

    case ts.SyntaxKind.PlusEqualsToken:
      context.output.append(" += ");
      break;

    case ts.SyntaxKind.SlashToken:
      context.output.append(" / ");
      break;

    case ts.SyntaxKind.SlashEqualsToken:
      context.output.append(" /= ");
      break;

    default:
      throw new EmitError(
        context,
        binaryExpression,
        `Failed to emit ${nodeKindString(
          binaryExpression.operatorToken
        )} for ${nodeKindString(binaryExpression)} in ${
          emitBinaryExpression.name
        }.`
      );
  }

  let convertRightToString = false;
  if (
    context.getTypeName(binaryExpression.left) === "string" &&
    context.getTypeName(binaryExpression.right) !== "string"
  ) {
    convertRightToString = true;
    context.output.append(`fmt.Sprintf("%v", `);
  }

  emitExpression(context, binaryExpression.right);

  if (convertRightToString) {
    context.output.append(")");
  }
}

function emitTemplateExpression(
  context: EmitContext,
  templateExpression: ts.TemplateExpression
): void {
  const expressions: ts.Expression[] = [];

  context.output.append('fmt.Sprintf("');

  if (templateExpression.head.text) {
    context.output.append(templateExpression.head.text);
  }

  for (const templateSpan of templateExpression.templateSpans) {
    if (templateSpan.expression) {
      expressions.push(templateSpan.expression);
      // TODO: Output correct placeholder
      context.output.append("%s");
    }

    if (templateSpan.literal.text) {
      context.output.append(templateSpan.literal.text);
    }
  }

  context.output.append('"');

  for (const expression of expressions) {
    context.output.append(", ");
    emitExpression(context, expression);
  }

  context.output.append(")");
}

function emitBooleanLiteral(
  context: EmitContext,
  booleanLiteral: ts.BooleanLiteral
): void {
  if (booleanLiteral.kind === ts.SyntaxKind.TrueKeyword) {
    context.output.append("true");
  } else {
    context.output.append("false");
  }
}

function emitCallExpression(
  context: EmitContext,
  callExpression: ts.CallExpression
): void {
  // if (isNumberToStringExpression(context, callExpression)) {
  //   context.output.append("Number::toString(");
  //   emitExpression(context, callExpression.expression.expression);

  //   if (callExpression.arguments.length === 1) {
  //     context.output.append(", ");

  //     if (ts.isNumericLiteral(callExpression.arguments[0])) {
  //       if (!NUMBER_SUPPORTED_RADIX.includes(callExpression.arguments[0].text)) {
  //         throw new EmitError(
  //           context,
  //           callExpression.arguments[0],
  //           `Radix of ${callExpression.arguments[0].text} is not supported.`,
  //         );
  //       }

  //       emitNumericLiteral(context, callExpression.arguments[0]);
  //     } else {
  //       emitExpression(context, callExpression.arguments[0]);
  //     }
  //   }

  //   context.output.append(")");
  //   return;
  // }

  emitExpression(context, callExpression.expression);

  context.output.append("(");

  for (let i = 0; i < callExpression.arguments.length; i++) {
    const argument = callExpression.arguments[i]!;

    emitExpression(context, argument);

    if (i < callExpression.arguments.length - 1) {
      context.output.append(", ");
    }
  }

  context.output.append(")");
}

function emitElementAccessExpression(
  context: EmitContext,
  elementAccessExpression: ts.ElementAccessExpression
): void {
  emitExpression(context, elementAccessExpression.expression);
  context.output.append("[");
  emitExpression(context, elementAccessExpression.argumentExpression);
  context.output.append("]");
}

function emitPrefixUnaryExpression(
  context: EmitContext,
  prefixUnaryExpression: ts.PrefixUnaryExpression
): void {
  switch (prefixUnaryExpression.operator) {
    case ts.SyntaxKind.ExclamationToken:
      context.output.append("!");
      break;

    case ts.SyntaxKind.MinusToken:
      context.output.append("-");
      break;

    case ts.SyntaxKind.MinusMinusToken:
      context.output.append("--");
      break;

    case ts.SyntaxKind.PlusPlusToken:
      context.output.append("++");
      break;

    default:
      throw new EmitError(
        context,
        prefixUnaryExpression,
        `Failed to emit ${ts.SyntaxKind[prefixUnaryExpression.operator]} in ${
          emitPrefixUnaryExpression.name
        }.`
      );
  }

  emitExpression(context, prefixUnaryExpression.operand);
}

function emitPostfixUnaryExpression(
  context: EmitContext,
  postfixUnaryExpression: ts.PostfixUnaryExpression
): void {
  emitExpression(context, postfixUnaryExpression.operand);

  switch (postfixUnaryExpression.operator) {
    case ts.SyntaxKind.MinusMinusToken:
      context.output.append("--");
      break;

    case ts.SyntaxKind.PlusPlusToken:
      context.output.append("++");
      break;

    default:
      throw new EmitError(
        context,
        postfixUnaryExpression,
        `Failed to emit ${ts.SyntaxKind[postfixUnaryExpression.operator]} in ${
          emitPostfixUnaryExpression.name
        }.`
      );
  }
}

function emitPropertyAccessExpression(
  context: EmitContext,
  propertyAccessExpression: ts.PropertyAccessExpression
): void {
  const expressionIsArray = context.isArray(
    propertyAccessExpression.expression
  );

  if (
    expressionIsArray &&
    propertyAccessExpression.name.escapedText === "length"
  ) {
    context.output.append("len(");
    emitExpression(context, propertyAccessExpression.expression);
    context.output.append(")");
    return;
  }

  emitExpression(context, propertyAccessExpression.expression);
  context.output.append(".");
  emitMemberName(context, propertyAccessExpression.name);
}

function emitMemberName(context: EmitContext, memberName: ts.MemberName): void {
  emitIdentifier(context, memberName, { firstLetterToUpper: true });
}

interface EmitIdentifierOptions {
  firstLetterToUpper?: boolean;
}

function emitIdentifier(
  context: EmitContext,
  identifier: ts.Identifier | ts.PrivateIdentifier,
  options: EmitIdentifierOptions = {}
): void {
  let identifierValue = identifier.escapedText as string;

  if (options.firstLetterToUpper) {
    identifierValue = firstLetterToUpper(identifierValue);
  }

  context.output.append(identifierValue);
}

function emitNumericLiteral(
  context: EmitContext,
  numcericLiteral: ts.NumericLiteral
): void {
  context.output.append(numcericLiteral.text);
}

function emitObjectLiteralExpression(
  context: EmitContext,
  objectLiteralExpression: ts.ObjectLiteralExpression
): void {
  context.output.append("{");

  for (let i = 0; i < objectLiteralExpression.properties.length; i++) {
    const property = objectLiteralExpression.properties[i];

    if (i != 0) {
      context.output.append(", ");
    } else {
      context.output.append(" ");
    }

    context.output.append(".");
    emitIdentifier(context, property.name as ts.Identifier);
    context.output.append(" = ");

    if (property.kind === ts.SyntaxKind.PropertyAssignment) {
      emitExpression(context, property.initializer);
    } else if (property.kind === ts.SyntaxKind.ShorthandPropertyAssignment) {
      emitIdentifier(context, property.name as ts.Identifier);
    } else {
      throw new EmitError(
        context,
        property,
        `Failed to emit ${nodeKindString(property)} in ${
          emitObjectLiteralExpression.name
        }.`
      );
    }

    if (i === objectLiteralExpression.properties.length - 1) {
      context.output.append(" ");
    }
  }

  context.output.append("}");
}

function emitParenthesizedExpression(
  context: EmitContext,
  parenthesizedExpression: ts.ParenthesizedExpression
): void {
  context.output.append("(");
  emitExpression(context, parenthesizedExpression.expression);
  context.output.append(")");
}

function emitStringLiteral(
  context: EmitContext,
  stringLiteral: ts.StringLiteral
): void {
  context.output.append(`"${stringLiteral.text}"`);
}
