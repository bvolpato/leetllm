/**
 * Illustration Build Cache
 *
 * Tracks content hashes for illustration source files and shared rendering inputs.
 * Only rebuilds illustrations whose inputs have changed.
 *
 * Cache key per illustration = web-relative POSIX path
 * Cache value per illustration = `${frameworkHash}:${fileHash}`
 *
 * Framework hash covers only shared rendering helpers (excluding tests, build/cache
 * orchestration, and print-only modules), rendering-relevant package versions, and
 * Vizmatic patches. Per-file composite hashes let completed renders persist even
 * when a rebuild is interrupted or partially fails.
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

const RENDERING_PACKAGES = [
    'vizmatic',
    'satori',
    '@resvg/resvg-js',
    'gifenc',
    'sharp',
    'react',
] as const

const EXCLUDED_LIB_FILES = new Set(['cache.ts', 'print-typography.ts', 'svg-print.ts'])

const LOCKFILE_RENDERING_PKG_RE = new RegExp(
    `^  ['"]?((?:${RENDERING_PACKAGES.map((pkg) => pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})@[^('":\\s]+)`,
)

interface CacheManifest {
    /** Latest completed framework hash for full-run visibility */
    frameworkHash: string
    /** Per-illustration composite hash: web-relative POSIX path -> `${frameworkHash}:${fileHash}` */
    files: Record<string, string>
}

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'])
let cachedCompilerOptions: ts.CompilerOptions | undefined

type SourceContentCache = Map<string, Promise<Buffer>>
type ModuleSpecifierCache = Map<string, string[]>

function hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

function isTestFile(filename: string): boolean {
    return /\.test\.[cm]?[jt]sx?$/.test(filename)
}

function cacheKeyFor(filePath: string): string {
    return relative(WEB_DIR, resolve(filePath)).split(sep).join('/')
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

function extractRenderingLockfileVersions(lockfile: string): string[] {
    const matches = new Set<string>()
    for (const line of lockfile.split(/\r?\n/)) {
        const match = LOCKFILE_RENDERING_PKG_RE.exec(line)
        if (match) matches.add(match[1])
    }
    return [...matches].sort()
}

/**
 * Compute a combined hash of shared illustration rendering inputs.
 * Covers rendering-relevant package versions, Vizmatic patches, and shared
 * rendering helpers, excluding tests, cache/build orchestration, and print-only modules.
 */
async function computeFrameworkHash(): Promise<string> {
    const entries = await readdir(LIB_DIR)
    const tsFiles = entries
        .filter(
            (f) =>
                (f.endsWith('.ts') || f.endsWith('.tsx')) &&
                !EXCLUDED_LIB_FILES.has(f) &&
                !isTestFile(f),
        )
        .sort()

    const contents: string[] = []

    try {
        const rawPkg = await readFile(join(WEB_DIR, 'package.json'), 'utf-8')
        const pkg = JSON.parse(rawPkg) as {
            dependencies?: Record<string, string>
            devDependencies?: Record<string, string>
            pnpm?: { patchedDependencies?: Record<string, string> }
        }
        const specs = RENDERING_PACKAGES.map(
            (name) =>
                `${name}=${pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? 'missing'}`,
        )
        const patches = Object.entries(pkg.pnpm?.patchedDependencies ?? {})
            .filter(([key]) => key === 'vizmatic' || key.startsWith('vizmatic@'))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
        contents.push(`--- package.json ---\n${[...specs, ...patches].join('\n')}`)
    } catch {
        contents.push('--- package.json ---\nmissing')
    }

    try {
        const lockfile = await readFile(join(WEB_DIR, 'pnpm-lock.yaml'), 'utf-8')
        contents.push(
            `--- pnpm-lock.yaml ---\n${extractRenderingLockfileVersions(lockfile).join('\n')}`,
        )
    } catch {
        contents.push('--- pnpm-lock.yaml ---\nmissing')
    }

    for (const name of RENDERING_PACKAGES) {
        try {
            const raw = await readFile(
                join(WEB_DIR, 'node_modules', ...name.split('/'), 'package.json'),
                'utf-8',
            )
            const pkg = JSON.parse(raw) as { version?: string }
            contents.push(`--- dependency:${name} ---\n${pkg.version ?? 'unknown'}`)
        } catch {
            contents.push(`--- dependency:${name} ---\nmissing`)
        }
    }

    const patchesDir = join(WEB_DIR, 'patches')
    if (existsSync(patchesDir)) {
        const patchFiles = (await readdir(patchesDir))
            .filter((name) => name.startsWith('vizmatic'))
            .sort()
        for (const patchFile of patchFiles) {
            const content = await readFile(join(patchesDir, patchFile), 'utf-8')
            contents.push(`--- patches/${patchFile} ---\n${content}`)
        }
    }

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
        const parsed = JSON.parse(raw) as Partial<CacheManifest>
        return {
            frameworkHash: typeof parsed.frameworkHash === 'string' ? parsed.frameworkHash : '',
            files: parsed.files && typeof parsed.files === 'object' ? { ...parsed.files } : {},
        }
    } catch {
        return { frameworkHash: '', files: {} }
    }
}

/**
 * Save the cache manifest to disk with deterministic key order, skipping writes
 * when the serialized manifest is already identical on disk.
 */
async function saveCache(manifest: CacheManifest): Promise<void> {
    const sortedFiles: Record<string, string> = {}
    for (const key of Object.keys(manifest.files).sort()) {
        sortedFiles[key] = manifest.files[key]
    }
    const serialized =
        JSON.stringify(
            {
                frameworkHash: manifest.frameworkHash,
                files: sortedFiles,
            },
            null,
            2,
        ) + '\n'

    try {
        const existing = await readFile(CACHE_FILE, 'utf-8')
        if (existing === serialized) return
    } catch {
        // Cache file does not exist yet
    }

    await mkdir(CACHE_DIR, { recursive: true })
    await writeFile(CACHE_FILE, serialized)
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
        const key = cacheKeyFor(filePath)
        const content = (await readSource(filePath, sourceContentCache)).toString('utf-8')
        const fileHash = await hashIllustrationInputs(
            filePath,
            compilerOptions,
            sourceContentCache,
            moduleSpecifierCache,
        )
        const compositeHash = `${frameworkHash}:${fileHash}`

        if (cache.files[key] !== compositeHash || !expectedOutputsExist(filePath, content)) {
            filesToBuild.push(filePath)
            pendingHashes.set(key, compositeHash)
            delete newManifest.files[key]
        }
    }

    // Only prune stale entries on full runs — partial runs (--article, --file)
    // should preserve cache entries for files not in the current scan.
    if (!opts?.partialRun) {
        const inputKeys = new Set(inputFiles.map(cacheKeyFor))
        for (const key of Object.keys(newManifest.files)) {
            if (!inputKeys.has(key)) {
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
        const key = cacheKeyFor(filePath)
        const hash = this.pendingHashes.get(key)
        if (hash === undefined) throw new Error(`Illustration is not pending: ${filePath}`)
        this.manifest.files[key] = hash
        this.pendingHashes.delete(key)
    }

    /** Persist the cache to disk */
    async save(): Promise<void> {
        if (this.pendingHashes.size === 0 && this.completedFrameworkHash !== undefined) {
            this.manifest.frameworkHash = this.completedFrameworkHash
        }
        await saveCache(this.manifest)
    }
}
