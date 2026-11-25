import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import sharp from "sharp"
import { afterEach, describe, expect, test, vi } from "vitest"
import { serveContentImage } from "./content-image-response"
import { getResponsiveContentImageProps } from "./responsive-content-image"
import { resetPrebuiltImageManifestCacheForTests } from "./content-utils"

const temporaryDirectories: string[] = []

function makeImageFixture(pathSegments = ["lesson", "illustrations", "_generated", "small.png"]) {
    const contentDir = mkdtempSync(join(tmpdir(), "leetllm-responsive-image-"))
    temporaryDirectories.push(contentDir)
    const imagePath = join(contentDir, ...pathSegments)
    mkdirSync(dirname(imagePath), { recursive: true })

    return {
        contentDir,
        pathSegments,
        imagePath,
    }
}

async function makeFallbackDiagramPng() {
    const width = 960
    const height = 540
    const colors = Array.from({ length: 16 }, (_, index) => [
        index * 17,
        (index * 73 + 23) & 255,
        (index * 131 + 71) & 255,
    ])
    const pixels = Buffer.alloc(width * height * 3)
    let state = 0x7f4a7c15

    for (let offset = 0; offset < pixels.length; offset += 3) {
        state ^= state << 13
        state ^= state >>> 17
        state ^= state << 5
        const color = colors[state >>> 28]
        pixels[offset] = color[0]
        pixels[offset + 1] = color[1]
        pixels[offset + 2] = color[2]
    }

    return sharp(pixels, { raw: { width, height, channels: 3 } })
        .png({ palette: true, colours: 16, quality: 100, effort: 10 })
        .toBuffer()
}

afterEach(() => {
    vi.unstubAllEnvs()
    resetPrebuiltImageManifestCacheForTests()
    for (const directory of temporaryDirectories.splice(0)) {
        rmSync(directory, { recursive: true, force: true })
    }
})

describe("film byte-range delivery", () => {
    test.each([
        [null, 200, "0123456789", null],
        ["bytes=2-5", 206, "2345", "bytes 2-5/10"],
        ["bytes=7-", 206, "789", "bytes 7-9/10"],
        ["bytes=-3", 206, "789", "bytes 7-9/10"],
        ["bytes=8-100", 206, "89", "bytes 8-9/10"],
    ])("serves %s for browser seeking", async (range, status, bytes, contentRange) => {
        const fixture = makeImageFixture(["lesson", "illustrations", "_generated", "backup_dark.mp4"])
        writeFileSync(fixture.imagePath, "0123456789")
        const response = await serveContentImage(fixture.pathSegments,
            new URL("https://leetllm.com/cdn/content-image/lesson/illustrations/_generated/backup_dark.mp4?v=0123456789ab"),
            fixture.contentDir, range)
        expect(response.status).toBe(status)
        expect(response.headers.get("content-type")).toBe("video/mp4")
        expect(response.headers.get("content-range")).toBe(contentRange)
        expect(response.headers.get("content-length")).toBe(String(bytes.length))
        expect(response.headers.get("cache-control")).toContain("immutable")
        expect(await response.text()).toBe(bytes)
    })

    test.each(["bytes=10-", "bytes=7-2", "bytes=-0", "bytes=-", "bytes=0-1,4-5", "bytes=99999999999999999999-"])("rejects unsatisfiable range %s", async (range) => {
        const fixture = makeImageFixture(["lesson", "illustrations", "_generated", "backup_dark.mp4"])
        writeFileSync(fixture.imagePath, "0123456789")
        const response = await serveContentImage(fixture.pathSegments, undefined, fixture.contentDir, range)
        expect(response.status).toBe(416)
        expect(response.headers.get("content-range")).toBe("bytes */10")
    })
})

describe("getResponsiveContentImageProps", () => {
    test("preserves the content version on fixed-width WebP candidates", () => {
        expect(getResponsiveContentImageProps(
            "/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?v=0123456789ab",
            1600,
            "(min-width: 768px) 720px, 100vw",
        )).toEqual({
            srcSet: [320, 640, 960, 1280, 1600]
                .map((width) => `/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?w=${width}&v=0123456789ab&cv=2 ${width}w`)
                .join(", "),
            sizes: "(min-width: 768px) 720px, 100vw",
        })
    })

    test("only advertises presets no wider than the known source pixels", () => {
        expect(getResponsiveContentImageProps(
            "/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?v=1",
            640,
        ).srcSet).toBe([
            "/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?w=320&v=1&cv=2 320w",
            "/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?w=640&v=1&cv=2 640w",
        ].join(", "))
        expect(getResponsiveContentImageProps(
            "/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?v=1",
            319,
        ).srcSet).toBe("/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?v=1 319w")
        expect(getResponsiveContentImageProps(
            "/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?v=1",
        )).toEqual({})
    })

    test("appends the original versioned PNG at its exact width when no preset matches", () => {
        expect(getResponsiveContentImageProps(
            "/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?v=0123456789ab",
            1700,
        ).srcSet).toBe([
            ...[320, 640, 960, 1280, 1600].map((width) => `/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?w=${width}&v=0123456789ab&cv=2 ${width}w`),
            "/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?v=0123456789ab 1700w",
        ].join(", "))
        expect(getResponsiveContentImageProps(
            "/cdn/content-image/lesson/illustrations/_generated/flow_dark.png",
            1700,
        ).srcSet).toBe([
            ...[320, 640, 960, 1280, 1600].map((width) => `/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?w=${width}&cv=2 ${width}w`),
        ].join(", "))
        expect(getResponsiveContentImageProps(
            "/cdn/content-image/lesson/illustrations/_generated/flow_dark.png?v=1",
            320.5,
        )).toEqual({})
    })

    test.each([
        undefined,
        "/cdn/content-image/lesson/illustrations/_generated/flow.gif?v=1",
        "/cdn/content-image/blog/example/social_banner.png?v=1",
        "/api/content-image/lesson/illustrations/_generated/flow.png?v=1",
        "https://leetllm.com/cdn/content-image/lesson/illustrations/_generated/flow.png?v=1",
        "/cdn/content-image/lesson/illustrations/_generated/flow.png?v=too-long",
        "https://assets.leetllm.com/v1/0123456789ab/blog/example/social_banner.png",
        "https://untrusted.example.com/v1/0123456789ab/lesson/illustrations/_generated/flow_dark.png",
    ])("leaves non-eligible image source %j unchanged", (src) => {
        expect(getResponsiveContentImageProps(src, 1600)).toEqual({})
    })

    test("builds immutable R2 CDN WebP srcSet for trusted assets.leetllm.com PNG URLs", () => {
        expect(getResponsiveContentImageProps(
            "https://assets.leetllm.com/v1/0123456789ab/lesson/illustrations/_generated/flow_dark.png",
            1700,
            "(min-width: 768px) 720px, 100vw",
        )).toEqual({
            srcSet: [
                ...[320, 640, 960, 1280, 1600].map(
                    (width) => `https://assets.leetllm.com/v1/0123456789ab-w${width}-cv2/lesson/illustrations/_generated/flow_dark.png.webp ${width}w`,
                ),
                "https://assets.leetllm.com/v1/0123456789ab/lesson/illustrations/_generated/flow_dark.png 1700w",
            ].join(", "),
            sizes: "(min-width: 768px) 720px, 100vw",
        })
    })
})

describe("serveContentImage responsive variants", () => {
    test("returns WebP at the source dimensions when the request would upscale", async () => {
        const fixture = makeImageFixture()
        const source = await sharp({
            create: { width: 96, height: 48, channels: 4, background: "#2870a8" },
        }).png().toBuffer()
        writeFileSync(fixture.imagePath, source)

        const response = await serveContentImage(
            fixture.pathSegments,
            new URL("https://leetllm.com/cdn/content-image/lesson/illustrations/_generated/small.png?w=320&v=0123456789ab"),
            fixture.contentDir,
        )
        const output = Buffer.from(await response.arrayBuffer())
        const metadata = await sharp(output).metadata()

        expect(response.status).toBe(200)
        expect(response.headers.get("content-type")).toBe("image/webp")
        expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
        expect(response.headers.get("x-image-width")).toBe("96")
        expect(response.headers.get("x-image-height")).toBe("48")
        expect(metadata).toMatchObject({ format: "webp", width: 96, height: 48 })
        expect(output.length).toBeLessThan(source.length)
    })

    test("shrinks a diagram to a lossless responsive WebP", async () => {
        const pathSegments = ["lesson", "diagrams", "_generated", "pipeline.png"]
        const fixture = makeImageFixture(pathSegments)
        const { contentDir } = fixture
        const rows = Array.from({ length: 10 }, (_, index) => {
            const y = 30 + index * 140
            const nodes = ["Request", "Validate", "Reply"].map((label, column) => {
                const x = 40 + column * 900
                return `<rect x="${x}" y="${y}" width="680" height="100" rx="8" fill="#e7efff" stroke="#234a88" stroke-width="4"/><text x="${x + 30}" y="${y + 65}" font-size="44" font-family="sans-serif">${label} ${index + 1}</text>`
            }).join("")
            return `${nodes}<path d="M720 ${y + 50}H940 M1620 ${y + 50}H1840" stroke="#222" stroke-width="4"/>`
        }).join("")
        const source = await sharp(Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1440"><rect width="2560" height="1440" fill="white"/>${rows}</svg>`,
        )).png().toBuffer()
        writeFileSync(fixture.imagePath, source)
        const sourceMetadata = await sharp(source).metadata()
        const response = await serveContentImage(
            pathSegments,
            new URL("https://leetllm.com/cdn/content-image/lesson/diagrams/_generated/pipeline.png?w=640&v=0123456789ab&cv=2"),
            contentDir,
        )
        const output = Buffer.from(await response.arrayBuffer())
        const metadata = await sharp(output).metadata()
        const expectedLossless = await sharp(source)
            .resize({ width: 640, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
            .webp({ lossless: true, effort: 4 })
            .toBuffer()

        expect(response.status).toBe(200)
        expect(response.headers.get("content-type")).toBe("image/webp")
        expect(metadata).toMatchObject({ format: "webp", width: 640, height: Math.round(640 * sourceMetadata.height! / sourceMetadata.width!) })
        expect(output.length).toBeLessThan(source.length / 4)
        expect(output).toEqual(expectedLossless)
    })

    test("uses q95 only for the versioned diagram variant when lossless is larger than its source", async () => {
        const pathSegments = ["lesson", "diagrams", "_generated", "fallback.png"]
        const fixture = makeImageFixture(pathSegments)
        const { contentDir } = fixture
        const source = await makeFallbackDiagramPng()
        writeFileSync(fixture.imagePath, source)
        const sourceMetadata = await sharp(source).metadata()
        const sourcePath = `/cdn/content-image/${pathSegments.join("/")}`
        const encode = (options: { lossless: true; effort: number } | { quality: number; effort: number }) => sharp(source)
            .resize({ width: 640, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
            .webp(options)
            .toBuffer()
        const legacyLossless = await encode({ lossless: true, effort: 4 })
        const expectedQ95 = await encode({ quality: 95, effort: 4 })

        const legacyResponse = await serveContentImage(
            pathSegments,
            new URL(`https://leetllm.com${sourcePath}?w=640&v=045175bb463e`),
            contentDir,
        )
        const versionedResponse = await serveContentImage(
            pathSegments,
            new URL(`https://leetllm.com${sourcePath}?w=640&v=045175bb463e&cv=2`),
            contentDir,
        )
        const legacyOutput = Buffer.from(await legacyResponse.arrayBuffer())
        const output = Buffer.from(await versionedResponse.arrayBuffer())
        const metadata = await sharp(output).metadata()

        expect(legacyLossless.length - source.length).toBeGreaterThan(100_000)
        expect(source.length - expectedQ95.length).toBeGreaterThan(20_000)
        expect(legacyResponse.status).toBe(200)
        expect(legacyOutput).toEqual(legacyLossless)
        expect(versionedResponse.status).toBe(200)
        expect(versionedResponse.headers.get("content-type")).toBe("image/webp")
        expect(metadata).toMatchObject({ format: "webp", width: 640, height: Math.round(640 * sourceMetadata.height! / sourceMetadata.width!) })
        expect(output.length).toBeLessThan(source.length)
        expect(output).toEqual(expectedQ95)
    })

    test("serves the original PNG when a valid source exceeds transformation dimensions", async () => {
        const fixture = makeImageFixture()
        const source = await sharp({
            create: { width: 6001, height: 1, channels: 4, background: "#2870a8" },
        }).png().toBuffer()
        writeFileSync(fixture.imagePath, source)

        const response = await serveContentImage(
            fixture.pathSegments,
            new URL("https://leetllm.com/cdn/content-image/lesson/illustrations/_generated/small.png?w=640&v=0123456789ab"),
            fixture.contentDir,
        )

        expect(response.status).toBe(200)
        expect(response.headers.get("content-type")).toBe("image/png")
        expect(response.headers.get("cache-control")).toBe("no-store")
        expect(Buffer.from(await response.arrayBuffer())).toEqual(source)
    })

    test("keeps animated GIF URLs and bytes unchanged", async () => {
        const contentDir = join(process.cwd(), "src", "content")
        const pathSegments = [
            "projects",
            "deep-dive-nccl",
            "illustrations",
            "_generated",
            "nccl_allgather_light.gif",
        ]
        const source = readFileSync(join(contentDir, ...pathSegments))
        const response = await serveContentImage(
            pathSegments,
            new URL("https://leetllm.com/cdn/content-image/projects/deep-dive-nccl/illustrations/_generated/nccl_allgather_light.gif?v=0123456789ab"),
            contentDir,
        )

        expect(response.status).toBe(200)
        expect(response.headers.get("content-type")).toBe("image/gif")
        expect(Buffer.from(await response.arrayBuffer()).equals(source)).toBe(true)
    })

    test.each([
        "?w=0",
        "?w=99999999",
        "?w=320&w=640",
        "?w=320&format=png",
        "?w=320&cv=1",
        "?w=320&cv=3",
        "?w=320&cv=2&cv=2",
        "?cv=2",
        `?w=320&v=${"a".repeat(100)}`,
        `?x=${"a".repeat(100)}`,
    ])("rejects unsafe responsive query %s", async (query) => {
        const fixture = makeImageFixture()
        const response = await serveContentImage(
            fixture.pathSegments,
            new URL(`https://leetllm.com/cdn/content-image/lesson/illustrations/_generated/small.png${query}`),
            fixture.contentDir,
        )

        expect(response.status).toBe(400)
    })

    test("rejects traversal and retains the original PNG response", async () => {
        const fixture = makeImageFixture()
        const source = await sharp({
            create: { width: 96, height: 48, channels: 4, background: "#2870a8" },
        }).png().toBuffer()
        writeFileSync(fixture.imagePath, source)

        const traversal = await serveContentImage(["..", "outside.png"], undefined, fixture.contentDir)
        const original = await serveContentImage(
            fixture.pathSegments,
            new URL("https://leetllm.com/cdn/content-image/lesson/illustrations/_generated/small.png?v=0123456789ab"),
            fixture.contentDir,
        )
        const unversioned = await serveContentImage(
            fixture.pathSegments,
            new URL("https://leetllm.com/cdn/content-image/lesson/illustrations/_generated/small.png"),
            fixture.contentDir,
        )
        const invalidVersion = await serveContentImage(
            fixture.pathSegments,
            new URL("https://leetllm.com/cdn/content-image/lesson/illustrations/_generated/small.png?v=mutable"),
            fixture.contentDir,
        )

        expect(traversal.status).toBe(400)
        expect(original.status).toBe(200)
        expect(original.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
        expect(original.headers.get("content-type")).toBe("image/png")
        expect(Buffer.from(await original.arrayBuffer())).toEqual(source)
        expect(unversioned.headers.get("cache-control")).toBe("public, max-age=300, s-maxage=300")
        expect(invalidVersion.status).toBe(400)
    })

    test("redirects missing public media to assets.leetllm.com while keeping private media 404 when absent", async () => {
        vi.stubEnv("NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN", "https://assets.leetllm.com")
        resetPrebuiltImageManifestCacheForTests()

        const emptyDir = mkdtempSync(join(tmpdir(), "leetllm-cdn-redirect-"))
        temporaryDirectories.push(emptyDir)

        const publicSegments = ["blog", "how-we-built-leetllm", "illustrations", "_generated", "content_pipeline_dark.png"]
        const originalRedirect = await serveContentImage(
            publicSegments,
            new URL(`https://leetllm.com/cdn/content-image/${publicSegments.join("/")}`),
            emptyDir,
        )
        expect(originalRedirect.status).toBe(308)
        expect(originalRedirect.headers.get("location")).toMatch(
            /^https:\/\/assets\.leetllm\.com\/v1\/[a-f0-9]{12}\/blog\/how-we-built-leetllm\/illustrations\/_generated\/content_pipeline_dark\.png$/,
        )
        expect(originalRedirect.headers.get("cache-control")).toBe("public, max-age=300, s-maxage=3600")

        const webpRedirect = await serveContentImage(
            publicSegments,
            new URL(`https://leetllm.com/cdn/content-image/${publicSegments.join("/")}?w=640&cv=2`),
            emptyDir,
        )
        expect(webpRedirect.status).toBe(308)
        expect(webpRedirect.headers.get("location")).toMatch(
            /^https:\/\/assets\.leetllm\.com\/v1\/[a-f0-9]{12}-w640-cv2\/blog\/how-we-built-leetllm\/illustrations\/_generated\/content_pipeline_dark\.png\.webp$/,
        )

        const privateSegments = [
            "blog",
            "glm-53-training-masterclass-3c1efdc30f7c0d3341d5",
            "social_banner.png",
        ]
        const privateMissing = await serveContentImage(
            privateSegments,
            new URL(`https://leetllm.com/cdn/content-image/${privateSegments.join("/")}`),
            emptyDir,
        )
        expect(privateMissing.status).toBe(404)
    })
})
