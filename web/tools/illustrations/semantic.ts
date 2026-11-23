import ts from 'typescript'

const metadataFields = new Set([
    'pos',
    'end',
    'parent',
    'id',
    'transformFlags',
    'modifierFlagsCache',
    'emitNode',
    'original',
    'symbol',
    'localSymbol',
    'locals',
    'nextContainer',
    'flowNode',
    'endFlowNode',
    'returnFlowNode',
    'jsDoc',
    'singleQuote',
    'numericLiteralFlags',
    'multiLine',
])
const jsxTextCache = new Map<string, string>()

/** Use the actual JSX compiler to normalize indentation and decode entities in text only. */
function jsxText(raw: string): string {
    const cached = jsxTextCache.get(raw)
    if (cached !== undefined) return cached
    const output = ts.transpileModule(`const value = <Label>${raw}</Label>`, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ESNext },
    }).outputText
    const tree = ts.createSourceFile('text.js', output, ts.ScriptTarget.Latest, true)
    let result = ''
    function find(node: ts.Node): void {
        if (ts.isPropertyAssignment(node) && node.name.getText(tree) === 'children') {
            if (!ts.isStringLiteralLike(node.initializer))
                throw new Error('Unexpected JSX text output.')
            result = node.initializer.text
        }
        ts.forEachChild(node, find)
    }
    find(tree)
    jsxTextCache.set(raw, result)
    return result
}

/** Compare all parsed semantic fields, preserving types, declaration flags and raw templates. */
function signature(source: string, file: string): string {
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const diagnostics = ts.transpileModule(source, {
        fileName: file,
        reportDiagnostics: true,
        compilerOptions: { target: ts.ScriptTarget.ESNext, jsx: ts.JsxEmit.ReactJSX },
    }).diagnostics
    if (diagnostics?.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) {
        throw new Error(`Could not parse illustration source: ${file}`)
    }

    function children(nodes: readonly ts.JsxChild[]): unknown[] {
        return nodes.map(visit).filter((value) => value !== null)
    }

    function visit(value: unknown): unknown {
        if (Array.isArray(value)) return value.map(visit).filter((child) => child !== null)
        if (!value || typeof value !== 'object') return value
        const node = value as ts.Node
        if (ts.isParenthesizedExpression(node)) return visit(node.expression)
        if (ts.isParenthesizedTypeNode(node)) return visit(node.type)
        if (node.kind === ts.SyntaxKind.EmptyStatement && ts.isBlock(node.parent)) return null
        if (ts.isJsxText(node)) {
            const text = jsxText(source.slice(node.pos, node.end))
            return text ? ['jsx-text', text] : null
        }
        if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteral(node.expression)) {
            return ['jsx-text', node.expression.text]
        }
        if (ts.isJsxExpression(node) && !node.expression) return null
        if (ts.isSourceFile(node)) return { kind: node.kind, statements: visit(node.statements) }
        if (ts.isJsxElement(node))
            return {
                kind: node.kind,
                opening: visit(node.openingElement),
                children: children(node.children),
                closing: visit(node.closingElement),
            }
        if (ts.isJsxFragment(node)) return { kind: node.kind, children: children(node.children) }

        const fields: Record<string, unknown> = {}
        for (const key of Object.keys(value).sort()) {
            if (metadataFields.has(key)) continue
            const field = (value as Record<string, unknown>)[key]
            if (field !== undefined && typeof field !== 'function') fields[key] = visit(field)
        }
        if (ts.isNumericLiteral(node)) fields.text = Number(node.text)
        return fields
    }
    const directives = [
        ...source.matchAll(/^\s*\/\/\s*(@ts-(?:check|nocheck|ignore|expect-error)\b[^\n]*)/gm),
    ].map((match) => match[1].trim())
    return JSON.stringify({ directives, tree: visit(tree) })
}

export function assertFormattingEquivalent(before: string, after: string, file: string): void {
    if (signature(before, file) !== signature(after, file)) {
        throw new Error(`Formatting changes the parsed illustration or JSX children: ${file}`)
    }
}
