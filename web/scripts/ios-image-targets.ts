import { existsSync, readFileSync, readdirSync } from "fs"
import { basename, dirname, join, relative, sep } from "path"
import * as ts from "typescript"

function walkFiles(root: string, predicate: (path: string) => boolean): string[] {
    const result: string[] = []
    if (!existsSync(root)) return result

    function visit(dir: string) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const path = join(dir, entry.name)
            if (entry.isDirectory()) {
                if (entry.name === "_generated") continue
                visit(path)
            } else if (predicate(path)) {
                result.push(path)
            }
        }
    }

    visit(root)
    return result.sort()
}

function contentRelativeDir(contentRoot: string, path: string): string {
    const rel = relative(contentRoot, dirname(path))
    return rel === "" ? "." : rel
}

function normalizeGeneratedRef(raw: string): string | null {
    const clean = raw.split("?")[0]
    if (clean.includes("*")) return null
    const match = clean.match(/^illustrations\/(?:_generated\/)?(.+\.(?:png|gif))$/)
    if (!match) return null
    return `illustrations/_generated/${match[1]}`
}

function addThemePair(targets: Set<string>, rel: string) {
    targets.add(rel)
    if (rel.endsWith("_dark.png")) targets.add(rel.replace(/_dark\.png$/, "_light.png"))
    if (rel.endsWith("_light.png")) targets.add(rel.replace(/_light\.png$/, "_dark.png"))
}

function exportsCreateAnimation(sourcePath: string): boolean {
    if (!existsSync(sourcePath)) return false

    const source = ts.createSourceFile(
        sourcePath,
        readFileSync(sourcePath, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
    )
    const hasExportModifier = (node: ts.Node) =>
        ts.canHaveModifiers(node) &&
        (ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false)
    const isFunction = (initializer: ts.Expression | undefined) =>
        initializer !== undefined && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))

    const exportedNames = new Set<string>()
    for (const statement of source.statements) {
        if (ts.isFunctionDeclaration(statement) && hasExportModifier(statement) && statement.name) {
            exportedNames.add(statement.name.text)
        }
        if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
            for (const declaration of statement.declarationList.declarations) {
                if (
                    ts.isIdentifier(declaration.name) &&
                    declaration.name.text === "createAnimation" &&
                    isFunction(declaration.initializer)
                ) {
                    exportedNames.add(declaration.name.text)
                }
            }
        }
        if (
            ts.isExportDeclaration(statement) &&
            statement.exportClause &&
            ts.isNamedExports(statement.exportClause)
        ) {
            for (const specifier of statement.exportClause.elements) {
                if (specifier.name.text === "createAnimation") exportedNames.add("createAnimation")
            }
        }
    }

    return exportedNames.has("createAnimation")
}

function addAnimationGifPair(
    targets: Set<string>,
    contentRoot: string,
    pngRel: string,
    sourceCache: Map<string, boolean>,
) {
    const normalizedPngRel = pngRel.split(sep).join("/")
    const match = normalizedPngRel.match(/^(.*\/illustrations\/_generated)\/([^/]+)_(?:dark|light)\.png$/)
    if (!match) return

    const [, generatedDir, baseName] = match
    const sourcePath = join(contentRoot, generatedDir, "..", `${baseName}.tsx`)
    let isAnimated = sourceCache.get(sourcePath)
    if (isAnimated === undefined) {
        isAnimated = exportsCreateAnimation(sourcePath)
        sourceCache.set(sourcePath, isAnimated)
    }
    if (!isAnimated) return

    targets.add(`${generatedDir}/${baseName}_dark.gif`)
    targets.add(`${generatedDir}/${baseName}_light.gif`)
}

export function collectImageTargets(contentRoot: string): string[] {
    const targets = new Set<string>()
    const animationSourceCache = new Map<string, boolean>()
    const sourceFiles = walkFiles(
        contentRoot,
        (path) =>
            (path.endsWith(".md") || path.endsWith(".json")) &&
            !path.endsWith(`${sep}_research.md`),
    )

    for (const file of sourceFiles) {
        const text = readFileSync(file, "utf8")
        const imageSourceText = file.endsWith(".md")
            ? text.replace(/```[\s\S]*?```/g, "")
            : text
        const articleDir = contentRelativeDir(contentRoot, file)

        if (file.endsWith(".md")) {
            for (const match of text.matchAll(/^```typescript\s+([^\n]*)$/gm)) {
                const attributes = match[1]
                if (!/\brender=["']illustration["']/.test(attributes)) continue
                const name = attributes.match(/\bname=["']([^"']+)["']/)?.[1]
                if (name) {
                    const rel = `${articleDir}/illustrations/_generated/${name}_dark.png`
                    addThemePair(
                        targets,
                        rel,
                    )
                    addAnimationGifPair(targets, contentRoot, rel, animationSourceCache)
                }
            }
        }

        for (const match of imageSourceText.matchAll(
            /illustrations\/(?:_generated\/)?[^"'()\s]+?\.(?:png|gif)/g,
        )) {
            const generatedRef = normalizeGeneratedRef(match[0])
            if (!generatedRef) continue
            const rel = `${articleDir}/${generatedRef}`
            addThemePair(targets, rel)
            if (rel.endsWith(".png")) addAnimationGifPair(targets, contentRoot, rel, animationSourceCache)
        }

        // Explicit CDN / content-image paths (including glossary diagram HTML after resolve)
        for (const match of imageSourceText.matchAll(
            /(?:\/cdn\/content-image\/|images\/)([^"'()\s]+?\.(?:png|gif))/g,
        )) {
            const rel = decodeURIComponent(match[1].split("?")[0])
            addThemePair(targets, rel)
            if (rel.endsWith(".png")) addAnimationGifPair(targets, contentRoot, rel, animationSourceCache)
        }

        if (file.endsWith("content.md")) {
            let index = 0
            const mermaidRe = /```mermaid\n[\s\S]*?```/g
            while (mermaidRe.exec(text) !== null) {
                addThemePair(targets, `${articleDir}/diagrams/_generated/content_diagram_${index}_dark.png`)
                index += 1
            }
        }

        // Glossary terms: flat glossary/<id>.md → glossary/<id>/diagrams/_generated/<id>_diagram_N_{dark,light}.png
        const glossaryDirPrefix = `${join("content", "glossary")}${sep}`
        const isGlossaryTermMd =
            file.includes(glossaryDirPrefix) &&
            file.endsWith(".md") &&
            !file.endsWith(`${sep}content.md`) &&
            basename(dirname(file)) === "glossary"
        if (isGlossaryTermMd) {
            const base = basename(file, ".md")
            let index = 0
            const mermaidRe = /```mermaid\n[\s\S]*?```/g
            while (mermaidRe.exec(text) !== null) {
                addThemePair(
                    targets,
                    `glossary/${base}/diagrams/_generated/${base}_diagram_${index}_dark.png`,
                )
                index += 1
            }
        }
    }

    return [...targets].sort()
}
