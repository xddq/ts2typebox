/*--------------------------------------------------------------------------
@sinclair/typebox/codegen
The MIT License (MIT)
Copyright (c) 2017-2023 Haydn Paterson (sinclair) <haydn.developer@gmail.com>
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
---------------------------------------------------------------------------*/

import * as ts from "typescript";

// --------------------------------------------------------------------------
// Transform
// --------------------------------------------------------------------------

/** Generates TypeBox types from TypeScript code */
export namespace TypeScriptToTypeBox {
  //
  // __INDEXED_ACCESS_TYPES_START__
  //
  /**
   * Collecting type defintions of already created/converted types.
   * These are used to be able to implement indexedAccessTypes.
   **/
  const alreadyCreatedTypes = new Map<string, string>();

  const createASTfromString = (typescriptCode: string) => {
    return ts.createSourceFile(
      "indexedAccessType.ts", // filePath
      typescriptCode, // fileText
      ts.ScriptTarget.Latest, // scriptTarget
      true // setParentNodes -- sets the `parent` property
    );
  };

  const getTypeDefinitionForTypeName = (name: string) => {
    return alreadyCreatedTypes.get(name);
  };

  /**
   * Grabs all attributes and their typebox types of given file and puts them
   * into a map. Expects file to be string of typebox type like:
   * Type.Object({
   * a: Type.String(),
   * b: Type.Number()
   * })
   * and the resulting map would be
   * {a -> "Type.String()", b -> "Type.Number()"}
   **/
  const createTypemapOfAttributes = (node: ts.SourceFile) => {
    const attributeAndTypeboxTypeMap = new Map<string, string>();
    const walkTree = (node: ts.Node) => {
      if (ts.isPropertyAssignment(node)) {
        const [identifierNode, _colonNode, callExpressionNode] =
          node.getChildren();
        attributeAndTypeboxTypeMap.set(
          identifierNode.getText(),
          callExpressionNode.getText()
        );
        return;
      }
      for (const child of node.getChildren()) {
        walkTree(child);
      }
    };
    walkTree(node);
    return attributeAndTypeboxTypeMap;
  };

  const getTypeForIndexAccessDepth1 = (
    node: ts.IndexedAccessTypeNode
  ): string => {
    const [
      typeReferenceNode,
      _openBracketNode,
      literalTypeNode,
      _closeBracketNode,
    ] = node.getChildren();
    if (ts.isTypeReferenceNode(typeReferenceNode)) {
      const attribute = literalTypeNode.getText().replaceAll('"', "");
      const typeDefinition = getTypeDefinitionForTypeName(
        typeReferenceNode.getText()
      );
      if (typeDefinition === undefined) {
        console.log(
          "Error in IndexedAccessType. Expected the type that was indexed to already have been parsed."
        );
        return "Error in IndexedAccessType";
      }
      const astOfMatchedTypeDefinition = createASTfromString(typeDefinition);
      const attributeTypeMap = createTypemapOfAttributes(
        astOfMatchedTypeDefinition
      );
      return (
        attributeTypeMap.get(attribute) ?? "IndexedAccessTypeAttributeNotFound"
      );
    } else {
      return "Error. Expected first child to be typeReferenceNode.";
    }
  };

  const getTypeForIndexAccessDepth2 = (
    node: ts.IndexedAccessTypeNode
  ): string => {
    const [
      indexedAccessTypeNode,
      _openBracketNode,
      literalTypeNode,
      _closeBracketNode,
    ] = node.getChildren();
    const attribute = literalTypeNode.getText().replaceAll('"', "");
    if (ts.isIndexedAccessTypeNode(indexedAccessTypeNode)) {
      const typeDefinition = getTypeForIndexAccessDepth1(indexedAccessTypeNode);
      const astOfMatchedTypeDefinition = createASTfromString(typeDefinition);
      const attributeTypeMap = createTypemapOfAttributes(
        astOfMatchedTypeDefinition
      );
      return (
        attributeTypeMap.get(attribute) ?? "IndexedAccessTypeAttributeNotFound"
      );
    } else {
      return "Error. Expected first child to be indexedAccessTypeNode.";
    }
  };

  const getTypeForIndexedAccesType = (
    node: ts.IndexedAccessTypeNode
  ): string => {
    /**
     * When we have indexed access with "depth 1", e.g. type X = Y["a"] the
     * first children node is of type "TypeReference".
     *
     * When we have indexed access with "depth 2", e.g. type X = Y["a"]["b"] the
     * first children node is of type "IndexedAccessType"
     **/
    const [thisNodeDecidesTheCase] = node.getChildren();
    if (ts.isTypeReferenceNode(thisNodeDecidesTheCase)) {
      return getTypeForIndexAccessDepth1(node);
    }
    if (ts.isIndexedAccessTypeNode(thisNodeDecidesTheCase)) {
      return getTypeForIndexAccessDepth2(node);
    }
    return "Error. Only supporting indexedAccessTypes with depth 1 and depth 2 yet.";
  };
  //
  // __INDEXED_ACCESS_TYPES_END__
  //

  function isRecursiveType(
    decl: ts.InterfaceDeclaration | ts.TypeAliasDeclaration
  ) {
    function find(
      decl: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
      node: ts.Node
    ): boolean {
      return (
        (ts.isTypeReferenceNode(node) &&
          decl.name.getText() === node.getText()) ||
        node.getChildren().some((node) => find(decl, node))
      );
    }
    return ts.isTypeAliasDeclaration(decl)
      ? [decl.type].some((node) => find(decl, node))
      : decl.members.some((node) => find(decl, node));
  }
  function isReadonlyProperty(node: ts.PropertySignature): boolean {
    return (
      node.modifiers !== undefined &&
      node.modifiers.find((modifier) => modifier.getText() === "readonly") !==
        undefined
    );
  }
  function isOptionalProperty(node: ts.PropertySignature) {
    return node.questionToken !== undefined;
  }
  function isExport(
    node:
      | ts.InterfaceDeclaration
      | ts.TypeAliasDeclaration
      | ts.EnumDeclaration
      | ts.ModuleDeclaration
  ): boolean {
    return (
      node.modifiers !== undefined &&
      node.modifiers.find((modifier) => modifier.getText() === "export") !==
        undefined
    );
  }
  function isNamespace(node: ts.ModuleDeclaration) {
    return node.flags === ts.NodeFlags.Namespace;
  }
  function* SourceFile(node: ts.SourceFile): IterableIterator<string> {
    for (const next of node.getChildren()) {
      yield* Visit(next);
    }
  }
  function* PropertySignature(
    node: ts.PropertySignature
  ): IterableIterator<string> {
    const [readonly, optional] = [
      isReadonlyProperty(node),
      isOptionalProperty(node),
    ];
    const type = Collect(node.type);
    if (readonly && optional) {
      return yield `${node.name.getText()}: Type.ReadonlyOptional(${type})`;
    } else if (readonly) {
      return yield `${node.name.getText()}: Type.Readonly(${type})`;
    } else if (optional) {
      return yield `${node.name.getText()}: Type.Optional(${type})`;
    } else {
      return yield `${node.name.getText()}: ${type}`;
    }
  }
  function* ArrayTypeNode(node: ts.ArrayTypeNode): IterableIterator<string> {
    const type = Collect(node.elementType);
    yield `Type.Array(${type})`;
  }
  function* TupleTypeNode(node: ts.TupleTypeNode): IterableIterator<string> {
    const types = node.elements.map((type) => Collect(type)).join(",\n");
    yield `Type.Tuple([\n${types}\n])`;
  }
  function* UnionTypeNode(node: ts.UnionTypeNode): IterableIterator<string> {
    const types = node.types.map((type) => Collect(type)).join(",\n");
    yield `Type.Union([\n${types}\n])`;
  }
  function* IntersectionTypeNode(
    node: ts.IntersectionTypeNode
  ): IterableIterator<string> {
    const types = node.types.map((type) => Collect(type)).join(",\n");
    yield `Type.Intersect([\n${types}\n])`;
  }
  function* TypeOperatorNode(
    node: ts.TypeOperatorNode
  ): IterableIterator<string> {
    if (node.operator === ts.SyntaxKind.KeyOfKeyword) {
      const type = Collect(node.type);
      yield `Type.KeyOf(${type})`;
    }
  }
  function* Parameter(node: ts.ParameterDeclaration): IterableIterator<string> {
    yield Collect(node.type);
  }
  function* FunctionTypeNode(
    node: ts.FunctionTypeNode
  ): IterableIterator<string> {
    const parameters = node.parameters
      .map((param) => Collect(param))
      .join(", ");
    const returns = Collect(node.type);
    yield `Type.Function([${parameters}], ${returns})`;
  }
  function* ConstructorTypeNode(
    node: ts.ConstructorTypeNode
  ): IterableIterator<string> {
    const parameters = node.parameters
      .map((param) => Collect(param))
      .join(", ");
    const returns = Collect(node.type);
    yield `Type.Constructor([${parameters}], ${returns})`;
  }
  function* EnumDeclaration(
    node: ts.EnumDeclaration
  ): IterableIterator<string> {
    const exports = isExport(node) ? "export " : "";
    const name = node.name.getText();
    const members = node.members.map((member) => member.getText()).join(", ");
    const enumType = `${exports}enum ${name}Enum { ${members} }`;
    const type = `${exports}const ${name} = Type.Enum(${name}Enum)`;
    yield [enumType, "", type].join("\n");
  }
  function* InterfaceDeclaration(
    node: ts.InterfaceDeclaration
  ): IterableIterator<string> {
    useImports = true;
    const heritage =
      node.heritageClauses !== undefined
        ? node.heritageClauses.flatMap((node) => Collect(node))
        : [];
    if (node.typeParameters) {
      useGenerics = true;
      const exports = isExport(node) ? "export " : "";
      const constraints = node.typeParameters
        .map((param) => `${Collect(param)} extends TSchema`)
        .join(", ");
      const parameters = node.typeParameters
        .map((param) => `${Collect(param)}: ${Collect(param)}`)
        .join(", ");
      const names = node.typeParameters
        .map((param) => `${Collect(param)}`)
        .join(", ");
      const members = node.members.map((member) => Collect(member)).join(",\n");
      const staticDeclaration = `${exports}type ${node.name.getText()}<${constraints}> = Static<ReturnType<typeof ${node.name.getText()}<${names}>>>`;
      const rawTypeExpression = isRecursiveType(node)
        ? `Type.Recursive(${node.name.getText()} => Type.Object({\n${members}\n}))`
        : `Type.Object({\n${members}\n})`;
      const typeExpression =
        heritage.length === 0
          ? rawTypeExpression
          : `Type.Intersect([${heritage.join(", ")}, ${rawTypeExpression}])`;
      const typeDeclaration = `${exports}const ${node.name.getText()} = <${constraints}>(${parameters}) => ${typeExpression}`;
      yield `${staticDeclaration}\n${typeDeclaration}`;
    } else {
      const exports = isExport(node) ? "export " : "";
      const members = node.members.map((member) => Collect(member)).join(",\n");
      const staticDeclaration = `${exports}type ${node.name.getText()} = Static<typeof ${node.name.getText()}>`;
      const rawTypeExpression = isRecursiveType(node)
        ? `Type.Recursive(${node.name.getText()} => Type.Object({\n${members}\n}))`
        : `Type.Object({\n${members}\n})`;
      const typeExpression =
        heritage.length === 0
          ? rawTypeExpression
          : `Type.Intersect([${heritage.join(", ")}, ${rawTypeExpression}])`;
      const typeDeclaration = `${exports}const ${node.name.getText()} = ${typeExpression}`;
      // store all types we already have created to enable indexed access types
      alreadyCreatedTypes.set(node.name.getText(), typeExpression);
      yield `${staticDeclaration}\n${typeDeclaration}`;
    }
  }
  function* TypeAliasDeclaration(
    node: ts.TypeAliasDeclaration
  ): IterableIterator<string> {
    useImports = true;
    if (node.typeParameters) {
      useGenerics = true;
      const exports = isExport(node) ? "export " : "";
      const constraints = node.typeParameters
        .map((param) => `${Collect(param)} extends TSchema`)
        .join(", ");
      const parameters = node.typeParameters
        .map((param) => `${Collect(param)}: ${Collect(param)}`)
        .join(", ");
      const names = node.typeParameters
        .map((param) => Collect(param))
        .join(", ");
      const type = Collect(node.type);
      const staticDeclaration = `${exports}type ${node.name.getText()}<${constraints}> = Static<ReturnType<typeof ${node.name.getText()}<${names}>>>`;
      const typeDeclaration = isRecursiveType(node)
        ? `${exports}const ${node.name.getText()} = <${constraints}>(${parameters}) => Type.Recursive(${node.name.getText()} => ${type})`
        : `${exports}const ${node.name.getText()} = <${constraints}>(${parameters}) => ${type}`;
      yield `${staticDeclaration}\n${typeDeclaration}`;
    } else {
      const exports = isExport(node) ? "export " : "";
      const type = Collect(node.type);
      const staticDeclaration = `${exports}type ${node.name.getText()} = Static<typeof ${node.name.getText()}>`;
      const typeDeclaration = isRecursiveType(node)
        ? `${exports}const ${node.name.getText()} = Type.Recursive(${node.name.getText()} => ${type})`
        : `${exports}const ${node.name.getText()} = ${type}`;
      // store all types we already have created to enable indexed access types
      alreadyCreatedTypes.set(
        node.name.getText(),
        isRecursiveType(node)
          ? `Type.Recursive(${node.name.getText()} => ${type})`
          : `${type}`
      );
      yield `${staticDeclaration}\n${typeDeclaration}`;
    }
  }
  function* HeritageClause(node: ts.HeritageClause): IterableIterator<string> {
    const types = node.types.map((node) => Collect(node));
    if (types.length === 1) return yield types[0];
    yield `Type.Intersect([${types.join(", ")}])`;
  }
  function* ExpressionWithTypeArguments(
    node: ts.ExpressionWithTypeArguments
  ): IterableIterator<string> {
    const name = Collect(node.expression);
    const typeArguments =
      node.typeArguments === undefined
        ? []
        : node.typeArguments.map((node) => Collect(node));
    // todo: default type argument (resolve `= number` from `type Foo<T = number>`)
    return yield typeArguments.length === 0
      ? `${name}`
      : `${name}(${typeArguments.join(", ")})`;
  }
  function* TypeParameterDeclaration(
    node: ts.TypeParameterDeclaration
  ): IterableIterator<string> {
    yield node.name.getText();
  }
  function* ParenthesizedTypeNode(
    node: ts.ParenthesizedTypeNode
  ): IterableIterator<string> {
    yield Collect(node.type);
  }
  function* RestTypeNode(node: ts.RestTypeNode): IterableIterator<string> {
    yield `Type.Rest()`;
  }
  function* ConditionalTypeNode(
    node: ts.ConditionalTypeNode
  ): IterableIterator<string> {
    const checkType = Collect(node.checkType);
    const extendsType = Collect(node.extendsType);
    const trueType = Collect(node.trueType);
    const falseType = Collect(node.falseType);
    yield `Type.Extends(${checkType}, ${extendsType}, ${trueType}, ${falseType})`;
  }
  function* TypeReferenceNode(
    node: ts.TypeReferenceNode
  ): IterableIterator<string> {
    const name = node.typeName.getText();
    const args = node.typeArguments
      ? `(${node.typeArguments.map((type) => Collect(type)).join(", ")})`
      : "";
    if (name === "Array") {
      return yield `Type.Array${args}`;
    } else if (name === "Record") {
      return yield `Type.Record${args}`;
    } else if (name === "Partial") {
      return yield `Type.Partial${args}`;
    } else if (name === "Uint8Array") {
      return yield `Type.Uint8Array()`;
    } else if (name === "Required") {
      return yield `Type.Required${args}`;
    } else if (name === "Omit") {
      return yield `Type.Omit${args}`;
    } else if (name === "Pick") {
      return yield `Type.Pick${args}`;
    } else if (name === "Promise") {
      return yield `Type.Promise${args}`;
    } else if (name === "ReturnType") {
      return yield `Type.ReturnType${args}`;
    } else if (name === "InstanceType") {
      return yield `Type.InstanceType${args}`;
    } else if (name === "Parameters") {
      return yield `Type.Parameters${args}`;
    } else if (name === "ConstructorParameters") {
      return yield `Type.ConstructorParameters${args}`;
    } else if (name === "Exclude") {
      return yield `Type.Exclude${args}`;
    } else if (name === "Extract") {
      return yield `Type.Extract${args}`;
    } else {
      return yield `${name}${args}`;
    }
  }
  function* TypeLiteralNode(
    node: ts.TypeLiteralNode
  ): IterableIterator<string> {
    const members = node.members.map((member) => Collect(member)).join(",\n");
    yield `Type.Object({\n${members}\n})`;
  }
  function* LiteralTypeNode(
    node: ts.LiteralTypeNode
  ): IterableIterator<string> {
    const text = node.getText();
    if (text === "null") return yield `Type.Null()`;
    yield `Type.Literal(${node.getText()})`;
  }
  function* ModuleDeclaration(
    node: ts.ModuleDeclaration
  ): IterableIterator<string> {
    const export_specifier = isExport(node) ? "export " : "";
    const module_specifier = isNamespace(node) ? "namespace" : "module";
    yield `${export_specifier}${module_specifier} ${node.name.getText()} {`;
    yield* Visit(node.body);
    yield `}`;
  }
  function* ModuleBlock(node: ts.ModuleBlock): IterableIterator<string> {
    for (const statement of node.statements) {
      yield* Visit(statement);
    }
  }
  function* FunctionDeclaration(
    node: ts.FunctionDeclaration
  ): IterableIterator<string> {
    yield node.getText();
  }
  function* ClassDeclaration(
    node: ts.ClassDeclaration
  ): IterableIterator<string> {
    yield node.getText();
  }
  function Collect(node: ts.Node | undefined): string {
    return `${[...Visit(node)].join("")}`;
  }
  function CollectNewLine(node: ts.Node | undefined): string {
    return [...Visit(node)].join("\n\n");
  }
  function* Visit(node: ts.Node | undefined): IterableIterator<string> {
    if (node === undefined) return;
    if (ts.isSourceFile(node)) {
      return yield* SourceFile(node);
    } else if (ts.isInterfaceDeclaration(node)) {
      return yield* InterfaceDeclaration(node);
    } else if (ts.isTypeAliasDeclaration(node)) {
      return yield* TypeAliasDeclaration(node);
    } else if (ts.isParameter(node)) {
      return yield* Parameter(node);
    } else if (ts.isFunctionTypeNode(node)) {
      return yield* FunctionTypeNode(node);
    } else if (ts.isConstructorTypeNode(node)) {
      return yield* ConstructorTypeNode(node);
    } else if (ts.isEnumDeclaration(node)) {
      return yield* EnumDeclaration(node);
    } else if (ts.isPropertySignature(node)) {
      return yield* PropertySignature(node);
    } else if (ts.isTypeReferenceNode(node)) {
      return yield* TypeReferenceNode(node);
    } else if (ts.isTypeLiteralNode(node)) {
      return yield* TypeLiteralNode(node);
    } else if (ts.isLiteralTypeNode(node)) {
      return yield* LiteralTypeNode(node);
    } else if (ts.isModuleDeclaration(node)) {
      return yield* ModuleDeclaration(node);
    } else if (ts.isModuleBlock(node)) {
      return yield* ModuleBlock(node);
    } else if (ts.isArrayTypeNode(node)) {
      return yield* ArrayTypeNode(node);
    } else if (ts.isTupleTypeNode(node)) {
      return yield* TupleTypeNode(node);
    } else if (ts.isIntersectionTypeNode(node)) {
      return yield* IntersectionTypeNode(node);
    } else if (ts.isUnionTypeNode(node)) {
      return yield* UnionTypeNode(node);
    } else if (ts.isTypeOperatorNode(node)) {
      return yield* TypeOperatorNode(node);
    } else if (ts.isHeritageClause(node)) {
      return yield* HeritageClause(node);
    } else if (ts.isExpressionWithTypeArguments(node)) {
      return yield* ExpressionWithTypeArguments(node);
    } else if (ts.isTypeParameterDeclaration(node)) {
      return yield* TypeParameterDeclaration(node);
    } else if (ts.isParenthesizedTypeNode(node)) {
      return yield* ParenthesizedTypeNode(node);
    } else if (ts.isRestTypeNode(node)) {
      return yield* RestTypeNode(node);
    } else if (ts.isFunctionDeclaration(node)) {
      return yield* FunctionDeclaration(node);
    } else if (ts.isClassDeclaration(node)) {
      return yield* ClassDeclaration(node);
    } else if (ts.isConditionalTypeNode(node)) {
      return yield* ConditionalTypeNode(node);
    } else if (ts.isIdentifier(node)) {
      return yield node.getText();
    } else if (node.kind === ts.SyntaxKind.ExportKeyword) {
      return yield `export`;
    } else if (node.kind === ts.SyntaxKind.KeyOfKeyword) {
      return yield `Type.KeyOf()`;
    } else if (node.kind === ts.SyntaxKind.NumberKeyword) {
      return yield `Type.Number()`;
    } else if (node.kind === ts.SyntaxKind.BigIntKeyword) {
      return yield `Type.BigInt()`;
    } else if (node.kind === ts.SyntaxKind.StringKeyword) {
      return yield `Type.String()`;
    } else if (node.kind === ts.SyntaxKind.BooleanKeyword) {
      return yield `Type.Boolean()`;
    } else if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
      return yield `Type.Undefined()`;
    } else if (node.kind === ts.SyntaxKind.UnknownKeyword) {
      return yield `Type.Unknown()`;
    } else if (node.kind === ts.SyntaxKind.AnyKeyword) {
      return yield `Type.Any()`;
    } else if (node.kind === ts.SyntaxKind.NeverKeyword) {
      return yield `Type.Never()`;
    } else if (node.kind === ts.SyntaxKind.NullKeyword) {
      return yield `Type.Null()`;
    } else if (node.kind === ts.SyntaxKind.VoidKeyword) {
      return yield `Type.Void()`;
    } else if (node.kind === ts.SyntaxKind.EndOfFileToken) {
      return;
    } else if (node.kind === ts.SyntaxKind.SyntaxList) {
      for (const child of node.getChildren()) {
        yield* Visit(child);
      }
      return;
    } else if (ts.isIndexedAccessTypeNode(node)) {
      return yield getTypeForIndexedAccesType(node);
    } else {
      console.log("Unhandled:", ts.SyntaxKind[node.kind]);
      return yield node.getText();
    }
  }
  let useImports = false;
  let useGenerics = false;
  /** Generates TypeBox types from TypeScript interface and type definitions */
  export function Generate(typescriptCode: string) {
    useImports = false;
    useGenerics = false;
    const source = ts.createSourceFile(
      "code.ts",
      typescriptCode,
      ts.ScriptTarget.ESNext,
      true
    );
    const typeDeclarations = CollectNewLine(source);
    const importStatments: string[] = [];
    if (useImports) {
      if (useGenerics)
        importStatments.push(
          `import { Type, Static, TSchema } from '@sinclair/typebox'`
        );
      if (!useGenerics)
        importStatments.push(
          `import { Type, Static } from '@sinclair/typebox'`
        );
    }
    const imports = importStatments.join("\n");

    return imports + "\n\n" + typeDeclarations;
  }
}
