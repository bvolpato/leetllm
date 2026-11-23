import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, test } from "vitest"
import {
    RUNTIME_CONTENT_MANIFEST_FILENAME,
    runtimeContentManifestDigest,
    serializeRuntimeContentManifest,
    validateRuntimeContent,
} from "./validate-runtime-content"

const temporaryRoots: string[] = []

afterEach(() => {
    for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function write(root: string, relativePath: string, content: string): void {
    const path = join(root, relativePath)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
}

function fixture(): { source: string; runtime: string } {
    const root = mkdtempSync(join(tmpdir(), "leetllm-runtime-manifest-"))
    temporaryRoots.push(root)
    const source = join(root, "source")
    const runtime = join(root, "runtime")
    const selected = new Map([
        ["references.json", "{}\n"],
        ["glossary/test-term.md", "# Test term\n"],
        ["foundations/test/content.md", "---\n{}\n---\nBody\n"],
        ["foundations/test/illustrations/scene.tsx", "import './theme'\n"],
        ["foundations/test/illustrations/theme.ts", "export const color = 'blue'\n"],
    ])
    for (const [path, content] of selected) {
        write(source, path, content)
        write(runtime, path, content)
    }
    write(source, "foundations/test/research.txt", "not selected\n")
    return { source, runtime }
}

describe("runtime content manifest", () => {
    test("writes a deterministic manifest for the exact selected path and content set", () => {
        const { source, runtime } = fixture()
        const first = validateRuntimeContent(source, runtime)
        const firstSource = readFileSync(join(runtime, RUNTIME_CONTENT_MANIFEST_FILENAME), "utf8")
        const second = validateRuntimeContent(source, runtime)

        expect(first.files.map(({ path }) => path)).toEqual([
            "foundations/test/content.md",
            "foundations/test/illustrations/scene.tsx",
            "foundations/test/illustrations/theme.ts",
            "glossary/test-term.md",
            "references.json",
        ])
        expect(firstSource).toBe(serializeRuntimeContentManifest(first))
        expect(second).toEqual(first)
        expect(runtimeContentManifestDigest(second)).toBe(runtimeContentManifestDigest(first))
    })

    test.each([
        {
            name: "missing file",
            mutate: (runtime: string) => rmSync(join(runtime, "references.json")),
            error: /missing=1 extra=0 different=0/,
        },
        {
            name: "extra file",
            mutate: (runtime: string) => write(runtime, "unexpected.txt", "extra\n"),
            error: /missing=0 extra=1 different=0/,
        },
        {
            name: "different content",
            mutate: (runtime: string) => write(runtime, "references.json", "{\"stale\":true}\n"),
            error: /missing=0 extra=0 different=1/,
        },
    ])("rejects a runtime tree with $name", ({ mutate, error }) => {
        const { source, runtime } = fixture()
        mutate(runtime)
        expect(() => validateRuntimeContent(source, runtime)).toThrow(error)
    })
})
