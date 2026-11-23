/**
 * Illustration Build Cache
 *
 * Tracks content hashes for illustration source files and framework files.
 * Only rebuilds illustrations whose inputs have changed.
 *
 * Cache key per illustration = hash(illustration .tsx file and its local imports)
 * Framework hash = hash(all lib/*.ts and lib/*.tsx files)
 *
 * If the framework hash changes, ALL illustrations are rebuilt.
 * If an illustration or one of its local source imports changes, only affected figures are rebuilt.
 */

import { existsSync, statSync } from 'fs'
import { readFile, writeFile, mkdir, readdir } from 'fs/promises'
import { createHash } from 'crypto'
import { join, dirname, basename, relative, resolve, isAbsolute, sep, extname } from 'path'
import ts from 'typescript'

const CACHE_DIR = join(dirname(new URL(import.meta.url).pathname), '..', '.cache')
const CACHE_FILE = join(CACHE_DIR, 'illustrations.json')
const LIB_DIR = dirname(new URL(import.meta.url).pathname)
const WEB_DIR = join(LIB_DIR, '..', '..', '..')

interface CacheManifest {
    /** Hash of all framework lib files — if this changes, rebuild everything */
    frameworkHash: string
    /** Per-illustration hash: filePath → transitive local input hash */
    files: Record<string, string>
}

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'])
let cachedCompilerOptions: ts.CompilerOptions | undefined

type SourceContentCache = Map<string, Promise<Buffer>>
type ModuleSpecifierCache = Map<string, string[]>

function hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

function expectedOutputsExist(filePath: string, content: string): boolean {
    const outputDir = join(dirname(filePath), '_generated')
    const baseName = basename(filePath, '.tsx')

    if (/\bcreateFilm\b/.test(content)) {
        return (
            existsSync(join(outputDir, `${baseName}_film.json`)) &&
            ['dark', 'light'].every(
                (theme) =>
                    existsSync(join(outputDir, `${baseName}_${theme}.mp4`)) &&
                    existsSync(join(outputDir, `${baseName}_${theme}.vtt`)) &&
                    existsSync(join(outputDir, `${baseName}_${theme}.png`)),
            )
        )
    }

    if (/\bcreateScenes\b/.test(content)) {
        return (
            existsSync(join(outputDir, `${baseName}_dark_manifest.json`)) &&
            existsSync(join(outputDir, `${baseName}_light_manifest.json`))
        )
    }

    if (/\bcreateAnimation\b/.test(content)) {
        return (
            existsSync(join(outputDir, `${baseName}_animation.json`)) &&
            existsSync(join(outputDir, `${baseName}_dark.gif`)) &&
            existsSync(join(outputDir, `${baseName}_light.gif`)) &&
            existsSync(join(outputDir, `${baseName}_dark.png`)) &&
            existsSync(join(outputDir, `${baseName}_light.png`))
        )
    }

    return (
        existsSync(join(outputDir, `${baseName}_dark.png`)) &&
        existsSync(join(outputDir, `${baseName}_light.png`))
    )
}

/**
 * Compute a combined hash of shared illustration inputs.
 * Any change to local shared helpers or the installed Vizmatic version forces a
 * full rebuild.
 */
async function computeFrameworkHash(): Promise<string> {
    const entries = await readdir(LIB_DIR)
    const tsFiles = entries.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx')).sort()

    const contents: string[] = []
    contents.push(
        `--- pnpm-lock.yaml ---\n${await readFile(join(WEB_DIR, 'pnpm-lock.yaml'), 'utf-8')}`,
    )
    for (const file of tsFiles) {
        const filePath = join(LIB_DIR, file)
        const content = await readFile(filePath, 'utf-8')
        contents.push(`--- ${relative(LIB_DIR, filePath)} ---\n${content}`)
    }

    for (const name of ['discovery.ts', 'embedded.ts']) {
        contents.push(
            '--- ' + name + ' ---\n' + (await readFile(join(LIB_DIR, '..', name), 'utf-8')),
        )
    }

    const buildScriptPath = join(LIB_DIR, '..', 'build.ts')
    try {
        contents.push(`--- build.ts ---\n${await readFile(buildScriptPath, 'utf-8')}`)
    } catch {
        contents.push('--- build.ts ---\nmissing')
    }

    try {
        const raw = await readFile(
            join(WEB_DIR, 'node_modules', 'vizmatic', 'package.json'),
            'utf-8',
        )
        const pkg = JSON.parse(raw) as { version?: string }
        contents.push(`--- dependency:vizmatic ---\n${pkg.version ?? 'unknown'}`)
    } catch {
        contents.push('--- dependency:vizmatic ---\nmissing')
    }

    return hashContent(contents.join('\n'))
}

function getTypeScriptCompilerOptions(): ts.CompilerOptions {
    if (cachedCompilerOptions) return cachedCompilerOptions

    const configPath = join(WEB_DIR, 'tsconfig.json')
    const config = ts.readConfigFile(configPath, ts.sys.readFile)
    if (config.error) {
        throw new Error(
            `Could not read illustration TypeScript config: ${ts.flattenDiagnosticMessageText(config.error.messageText, '\n')}`,
        )
    }

    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, WEB_DIR, {}, configPath)
    const errors = parsed.errors.filter(
        (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    )
    if (errors.length > 0) {
        const details = errors
            .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
            .join('\n')
        throw new Error(`Could not resolve illustration source imports from tsconfig: ${details}`)
    }

    cachedCompilerOptions = parsed.options
    return cachedCompilerOptions
}

function isInside(directory: string, filePath: string): boolean {
    const pathFromDirectory = relative(directory, filePath)
    return (
        pathFromDirectory === '' ||
        (pathFromDirectory !== '..' &&
            !pathFromDirectory.startsWith(`..${sep}`) &&
            !isAbsolute(pathFromDirectory))
    )
}

function isLocalWorkspaceFile(filePath: string): boolean {
    if (!isInside(WEB_DIR, filePath)) return false
    return !relative(WEB_DIR, filePath).split(sep).includes('node_modules')
}

function isFile(filePath: string): boolean {
    try {
        return statSync(filePath).isFile()
    } catch {
        return false
    }
}

function matchesPathMapping(specifier: string, options: ts.CompilerOptions): boolean {
    return Object.keys(options.paths ?? {}).some((pattern) => {
        const wildcard = pattern.indexOf('*')
        if (wildcard < 0) return specifier === pattern
        const prefix = pattern.slice(0, wildcard)
        const suffix = pattern.slice(wildcard + 1)
        return (
            specifier.startsWith(prefix) &&
            specifier.endsWith(suffix) &&
            specifier.length >= prefix.length + suffix.length
        )
    })
}

function isLocalSpecifier(specifier: string, options: ts.CompilerOptions): boolean {
    return (
        specifier.startsWith('./') ||
        specifier.startsWith('../') ||
        isAbsolute(specifier) ||
        matchesPathMapping(specifier, options)
    )
}

/** Resolve literal imports; computed loaders cannot form a reliable cache key. */
function readModuleSpecifiers(filePath: string, source: string): string[] {
    const specifiers = new Set(
        ts.preProcessFile(source, true, true).importedFiles.map((entry) => entry.fileName),
    )
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)

    const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node)) {
            const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword
            const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require'
            if (isDynamicImport || isRequire) {
                const argument = node.arguments[0]
                if (!argument || !ts.isStringLiteralLike(argument)) {
                    throw new Error(
                        `Illustration cache requires a literal ${isDynamicImport ? 'dynamic import' : 'require'} in ${relative(WEB_DIR, filePath)}: ${node.getText(sourceFile)}`,
                    )
                }
            }
        }

        ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return [...specifiers]
}

async function readSource(filePath: string, cache: SourceContentCache): Promise<Buffer> {
    let content = cache.get(filePath)
    if (!content) {
        content = readFile(filePath)
        cache.set(filePath, content)
    }
    return content
}

async function getModuleSpecifiers(
    filePath: string,
    contentCache: SourceContentCache,
    specifierCache: ModuleSpecifierCache,
): Promise<string[]> {
    const cached = specifierCache.get(filePath)
    if (cached) return cached

    const content = await readSource(filePath, contentCache)
    const specifiers = CODE_EXTENSIONS.has(extname(filePath))
        ? readModuleSpecifiers(filePath, content.toString('utf-8'))
        : []
    specifierCache.set(filePath, specifiers)
    return specifiers
}

async function collectLocalInputs(
    rootPath: string,
    compilerOptions: ts.CompilerOptions,
    contentCache: SourceContentCache,
    specifierCache: ModuleSpecifierCache,
): Promise<string[]> {
    const root = resolve(rootPath)
    const visited = new Set<string>()
    const pending = [root]

    while (pending.length > 0) {
        const filePath = resolve(pending.pop()!)
        if (visited.has(filePath)) continue
        visited.add(filePath)
        if (!isLocalWorkspaceFile(filePath)) continue

        const specifiers = await getModuleSpecifiers(filePath, contentCache, specifierCache)
        for (const specifier of specifiers) {
            const resolved = ts.resolveModuleName(specifier, filePath, compilerOptions, ts.sys)
                .resolvedModule?.resolvedFileName
            if (!resolved) {
                const directPath = resolve(dirname(filePath), specifier)
                if (
                    (isLocalSpecifier(specifier, compilerOptions) || existsSync(directPath)) &&
                    isFile(directPath)
                ) {
                    pending.push(directPath)
                    continue
                }
                if (isLocalSpecifier(specifier, compilerOptions)) {
                    throw new Error(
                        `Could not resolve local illustration dependency "${specifier}" imported from ${relative(WEB_DIR, filePath)}`,
                    )
                }
                continue
            }

            const resolvedPath = resolve(resolved)
            if (isLocalWorkspaceFile(resolvedPath)) pending.push(resolvedPath)
        }
    }

    return [...visited].filter(isLocalWorkspaceFile).sort()
}

async function hashIllustrationInputs(
    filePath: string,
    compilerOptions: ts.CompilerOptions,
    contentCache: SourceContentCache,
    specifierCache: ModuleSpecifierCache,
): Promise<string> {
    const inputs = await collectLocalInputs(filePath, compilerOptions, contentCache, specifierCache)
    const hash = createHash('sha256')
    for (const input of inputs) {
        const relativePath = relative(WEB_DIR, input).split(sep).join('/')
        hash.update(relativePath)
            .update('\0')
            .update(await readSource(input, contentCache))
            .update('\0')
    }
    return hash.digest('hex').slice(0, 16)
}

/**
 * Load the cache manifest from disk. Returns empty manifest if not found.
 */
async function loadCache(): Promise<CacheManifest> {
    try {
        const raw = await readFile(CACHE_FILE, 'utf-8')
        return JSON.parse(raw) as CacheManifest
    } catch {
        return { frameworkHash: '', files: {} }
    }
}

/**
 * Save the cache manifest to disk.
 */
async function saveCache(manifest: CacheManifest): Promise<void> {
    await mkdir(CACHE_DIR, { recursive: true })
    await writeFile(CACHE_FILE, JSON.stringify(manifest, null, 2) + '\n')
}

/**
 * Check which illustrations need rebuilding.
 *
 * Returns:
 * - filesToBuild: subset of inputFiles that need rendering
 * - updater: call updater.markBuilt(filePath) after successful render,
 *            and updater.save() when done to persist the cache.
 */
export async function checkCache(
    inputFiles: string[],
    opts?: { partialRun?: boolean },
): Promise<{
    filesToBuild: string[]
    updater: CacheUpdater
}> {
    const [cache, frameworkHash] = await Promise.all([loadCache(), computeFrameworkHash()])

    const frameworkChanged = cache.frameworkHash !== frameworkHash
    const newManifest: CacheManifest = {
        frameworkHash: cache.frameworkHash,
        files: { ...cache.files },
    }

    const filesToBuild: string[] = []
    const pendingHashes = new Map<string, string>()
    const sourceContentCache: SourceContentCache = new Map()
    const moduleSpecifierCache: ModuleSpecifierCache = new Map()
    const compilerOptions = getTypeScriptCompilerOptions()

    for (const filePath of inputFiles) {
        const content = await readFile(filePath, 'utf-8')
        const fileHash = await hashIllustrationInputs(
            filePath,
            compilerOptions,
            sourceContentCache,
            moduleSpecifierCache,
        )

        if (
            frameworkChanged ||
            cache.files[filePath] !== fileHash ||
            !expectedOutputsExist(filePath, content)
        ) {
            filesToBuild.push(filePath)
            pendingHashes.set(filePath, fileHash)
            delete newManifest.files[filePath]
        }
    }

    // Only prune stale entries on full runs — partial runs (--article, --file)
    // should preserve cache entries for files not in the current scan.
    if (!opts?.partialRun) {
        const inputSet = new Set(inputFiles)
        for (const key of Object.keys(newManifest.files)) {
            if (!inputSet.has(key)) {
                delete newManifest.files[key]
            }
        }
    }

    return {
        filesToBuild,
        updater: new CacheUpdater(
            newManifest,
            pendingHashes,
            opts?.partialRun ? undefined : frameworkHash,
        ),
    }
}

class CacheUpdater {
    constructor(
        private manifest: CacheManifest,
        private pendingHashes: Map<string, string>,
        private completedFrameworkHash: string | undefined,
    ) {}

    markBuilt(filePath: string): void {
        const hash = this.pendingHashes.get(filePath)
        if (hash === undefined) throw new Error(`Illustration is not pending: ${filePath}`)
        this.manifest.files[filePath] = hash
        this.pendingHashes.delete(filePath)
    }

    /** Persist the cache to disk */
    async save(): Promise<void> {
        // Only a complete, successful full run can validate shared rendering inputs.
        if (this.pendingHashes.size === 0 && this.completedFrameworkHash !== undefined) {
            this.manifest.frameworkHash = this.completedFrameworkHash
        }
        await saveCache(this.manifest)
    }
}
