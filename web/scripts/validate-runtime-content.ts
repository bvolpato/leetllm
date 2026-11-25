import { createHash } from "crypto"
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { basename, dirname, join, relative, resolve, sep } from "path"
import { fileURLToPath } from "url"
import {
    createBundlePublicClassifier,
    isTrackedContentMedia,
} from "./generate-content-image-manifest"

export const RUNTIME_CONTENT_MANIFEST_FILENAME = ".runtime-content-manifest.json"

export type RuntimeContentManifestEntry = {
    path: string
    size: number
    sha256: string
}

export type RuntimeContentManifest = {
    version: 1
    algorithm: "sha256"
    files: RuntimeContentManifestEntry[]
}

export type RuntimeContentOptions = {
    /**
     * When true, binary media belonging to public bundles (delivered via R2 CDN
     * `assets.leetllm.com`) are omitted from `/runtime-content` while private/draft
     * media and all `_generated/*.json` manifests stay on container disk.
     * Defaults to `Boolean(process.env.NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN?.trim())`.
     */
    offloadPublicMedia?: boolean
}

function walk(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true })
        .sort((left, right) => left.name.localeCompare(right.name))
        .flatMap((entry) => {
            const path = join(directory, entry.name)
            return entry.isDirectory() ? walk(path) : [path]
        })
}

function portableRelativePath(root: string, path: string): string {
    return relative(root, path).split(sep).join("/")
}

export function isRuntimeContentPath(path: string): boolean {
    const name = basename(path)
    if (path.includes("/__pycache__/") || name.endsWith(".pyc")) {
        return false
    }
    return name === "references.json"
        || name === "metadata.json"
        || name === "content.md"
        || name === "content-free.md"
        || name === "social_banner.png"
        || (path.startsWith("glossary/") && path.endsWith(".md"))
        || name.endsWith(".tsx")
        || (path.includes("/illustrations/") && name.endsWith(".ts"))
        || (path.includes("/illustrations/") && name.endsWith(".json"))
        || path.includes("/illustrations/_generated/")
        || path.includes("/diagrams/_generated/")
        || path.includes("/assets/")
}

function shouldOffloadPublicMedia(options?: RuntimeContentOptions): boolean {
    if (options?.offloadPublicMedia !== undefined) return options.offloadPublicMedia
    return Boolean(process.env.NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN?.trim())
}

function selectRuntimeFiles(sourceRoot: string, options?: RuntimeContentOptions): Array<{ path: string; relativePath: string }> {
    const offloadPublicMedia = shouldOffloadPublicMedia(options)
    const isPublicMedia = offloadPublicMedia ? createBundlePublicClassifier(sourceRoot) : null

    return walk(sourceRoot)
        .map((path) => ({ path, relativePath: portableRelativePath(sourceRoot, path) }))
        .filter(({ relativePath }) => {
            if (!isRuntimeContentPath(relativePath)) return false
            if (isPublicMedia && isTrackedContentMedia(relativePath) && isPublicMedia(relativePath)) {
                return false
            }
            return true
        })
        .sort((left, right) => left.relativePath.localeCompare(right.relativePath))
}

function manifestEntry(root: string, path: string): RuntimeContentManifestEntry {
    const content = readFileSync(path)
    return {
        path: portableRelativePath(root, path),
        size: content.byteLength,
        sha256: createHash("sha256").update(content).digest("hex"),
    }
}

export function buildRuntimeContentManifest(
    sourceRoot: string,
    options?: RuntimeContentOptions,
): RuntimeContentManifest {
    const files = selectRuntimeFiles(sourceRoot, options)
        .map(({ path }) => manifestEntry(sourceRoot, path))

    return { version: 1, algorithm: "sha256", files }
}

export function serializeRuntimeContentManifest(manifest: RuntimeContentManifest): string {
    return `${JSON.stringify(manifest, null, 2)}\n`
}

export function runtimeContentManifestDigest(manifest: RuntimeContentManifest): string {
    return createHash("sha256").update(serializeRuntimeContentManifest(manifest)).digest("hex")
}

function mismatchSummary(label: string, paths: string[]): string {
    if (paths.length === 0) return ""
    const displayed = paths.slice(0, 20).map((path) => `  ${path}`).join("\n")
    const remainder = paths.length > 20 ? `\n  ... and ${paths.length - 20} more` : ""
    return `\n${label}:\n${displayed}${remainder}`
}

export function collectRuntimeContent(
    sourceRoot: string,
    runtimeRoot: string,
    options?: RuntimeContentOptions,
): RuntimeContentManifest {
    const selected = selectRuntimeFiles(sourceRoot, options)
    mkdirSync(runtimeRoot, { recursive: true })
    for (const { path, relativePath } of selected) {
        const target = join(runtimeRoot, relativePath)
        mkdirSync(dirname(target), { recursive: true })
        copyFileSync(path, target)
    }
    return validateRuntimeContent(sourceRoot, runtimeRoot, options)
}

export function validateRuntimeContent(
    sourceRoot: string,
    runtimeRoot: string,
    options?: RuntimeContentOptions,
): RuntimeContentManifest {
    const expected = buildRuntimeContentManifest(sourceRoot, options)
    const actualEntries = walk(runtimeRoot)
        .filter((path) => basename(path) !== RUNTIME_CONTENT_MANIFEST_FILENAME)
        .map((path) => manifestEntry(runtimeRoot, path))
        .sort((left, right) => left.path.localeCompare(right.path))

    const expectedByPath = new Map(expected.files.map((entry) => [entry.path, entry]))
    const actualByPath = new Map(actualEntries.map((entry) => [entry.path, entry]))
    const missing = expected.files
        .filter((entry) => !actualByPath.has(entry.path))
        .map((entry) => entry.path)
    const extra = actualEntries
        .filter((entry) => !expectedByPath.has(entry.path))
        .map((entry) => entry.path)
    const different = expected.files
        .filter((entry) => {
            const actual = actualByPath.get(entry.path)
            return actual && (actual.size !== entry.size || actual.sha256 !== entry.sha256)
        })
        .map((entry) => entry.path)

    if (missing.length > 0 || extra.length > 0 || different.length > 0) {
        throw new Error(
            `Runtime content differs from source: missing=${missing.length} extra=${extra.length} different=${different.length}`
            + mismatchSummary("Missing", missing)
            + mismatchSummary("Extra", extra)
            + mismatchSummary("Different", different),
        )
    }

    writeFileSync(
        join(runtimeRoot, RUNTIME_CONTENT_MANIFEST_FILENAME),
        serializeRuntimeContentManifest(expected),
    )
    return expected
}

function main(): void {
    const sourceRoot = join(process.cwd(), "src", "content")
    const args = process.argv.slice(2).filter((argument) => argument !== "--")
    const collect = args.includes("--collect")
    const runtimeDirectory = args.find((argument) => !argument.startsWith("--"))
    if (!runtimeDirectory) {
        throw new Error("Usage: tsx scripts/validate-runtime-content.ts [--collect] <runtime-content-directory>")
    }

    const resolvedRuntime = resolve(runtimeDirectory)
    const manifest = collect
        ? collectRuntimeContent(sourceRoot, resolvedRuntime)
        : validateRuntimeContent(sourceRoot, resolvedRuntime)
    const mode = shouldOffloadPublicMedia() ? "public media offloaded to CDN" : "local media bundled"
    console.log(
        `Runtime content OK (${mode}): ${manifest.files.length} files, manifest sha256=${runtimeContentManifestDigest(manifest)}`,
    )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main()
}
