import { spawnSync } from "child_process"
import { join } from "path"
import {
    RUNTIME_CONTENT_MANIFEST_FILENAME,
    buildRuntimeContentManifest,
    runtimeContentManifestDigest,
} from "./validate-runtime-content"

const image = process.argv.slice(2).find((argument) => argument !== "--")
if (!image || !/^[a-z0-9][a-z0-9._:/-]*@sha256:[0-9a-f]{64}$/i.test(image)) {
    throw new Error("Usage: pnpm runtime-image:validate -- <repository>@sha256:<digest>")
}

const offloadPublicMedia = (process.env.NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN ?? "https://assets.leetllm.com").trim().length > 0
const expectedManifest = buildRuntimeContentManifest(join(process.cwd(), "src", "content"), { offloadPublicMedia })
const expectedManifestDigest = runtimeContentManifestDigest(expectedManifest)

const validator = String.raw`
const { createHash } = require("crypto")
const { readdirSync, readFileSync } = require("fs")
const { join, relative, sep } = require("path")

const contentRoot = "/app/src/content"
const manifestFilename = process.argv[1]
const expectedManifestDigest = process.argv[2]
const manifestSource = readFileSync(join(contentRoot, manifestFilename), "utf8")
const manifestDigest = createHash("sha256").update(manifestSource).digest("hex")
if (manifestDigest !== expectedManifestDigest) {
    throw new Error(
        "Runtime manifest does not match deploy source: expected=" + expectedManifestDigest
        + " actual=" + manifestDigest,
    )
}

const manifest = JSON.parse(manifestSource)
if (manifest.version !== 1 || manifest.algorithm !== "sha256" || !Array.isArray(manifest.files)) {
    throw new Error("Invalid runtime content manifest")
}

function walk(directory) {
    return readdirSync(directory, { withFileTypes: true })
        .sort((left, right) => left.name.localeCompare(right.name))
        .flatMap((entry) => {
            const path = join(directory, entry.name)
            return entry.isDirectory() ? walk(path) : [path]
        })
}

function portableRelativePath(path) {
    return relative(contentRoot, path).split(sep).join("/")
}

function summarize(label, paths) {
    if (paths.length === 0) return ""
    const displayed = paths.slice(0, 20).map((path) => "  " + path).join("\n")
    const remainder = paths.length > 20 ? "\n  ... and " + (paths.length - 20) + " more" : ""
    return "\n" + label + ":\n" + displayed + remainder
}

const expectedByPath = new Map()
for (const entry of manifest.files) {
    const validPath = typeof entry.path === "string"
        && entry.path.length > 0
        && !entry.path.startsWith("/")
        && !entry.path.includes("\\")
        && entry.path.split("/").every((part) => part.length > 0 && part !== "." && part !== "..")
    const validEntry = validPath
        && Number.isSafeInteger(entry.size)
        && entry.size >= 0
        && typeof entry.sha256 === "string"
        && /^[0-9a-f]{64}$/.test(entry.sha256)
    if (!validEntry || expectedByPath.has(entry.path)) {
        throw new Error("Invalid runtime content manifest entry")
    }
    expectedByPath.set(entry.path, entry)
}

const actualPaths = walk(contentRoot)
    .map(portableRelativePath)
    .filter((path) => path !== manifestFilename)
    .sort()
const actualPathSet = new Set(actualPaths)
const expectedPaths = [...expectedByPath.keys()].sort()
const missing = expectedPaths.filter((path) => !actualPathSet.has(path))
const extra = actualPaths.filter((path) => !expectedByPath.has(path))
const different = []
for (const path of expectedPaths) {
    if (!actualPathSet.has(path)) continue
    const content = readFileSync(join(contentRoot, path))
    const entry = expectedByPath.get(path)
    const digest = createHash("sha256").update(content).digest("hex")
    if (content.byteLength !== entry.size || digest !== entry.sha256) different.push(path)
}

if (missing.length > 0 || extra.length > 0 || different.length > 0) {
    throw new Error(
        "Runtime image content mismatch: missing=" + missing.length
        + " extra=" + extra.length
        + " different=" + different.length
        + summarize("Missing", missing)
        + summarize("Extra", extra)
        + summarize("Different", different),
    )
}

console.log(
    "Runtime image content OK: " + expectedPaths.length + " files, manifest sha256=" + manifestDigest,
)
`

const result = spawnSync(
    "docker",
    [
        "run",
        "--platform",
        "linux/amd64",
        "--rm",
        "--read-only",
        "--network",
        "none",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--entrypoint",
        "node",
        image,
        "-e",
        validator,
        RUNTIME_CONTENT_MANIFEST_FILENAME,
        expectedManifestDigest,
    ],
    { stdio: "inherit" },
)
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
