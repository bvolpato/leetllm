import { existsSync, mkdirSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { collectImageTargets } from "./ios-image-targets"

const webRoot = process.cwd()
const contentRoot = join(webRoot, "src", "content")
const sourceBaseUrl = (process.env.LEETLLM_IOS_IMAGE_SOURCE_URL ?? "https://leetllm.com").replace(/\/$/, "")
const missingImagesFile = process.env.LEETLLM_IOS_MISSING_IMAGES_FILE
const dryRun = process.argv.includes("--dry-run")

function localPathFor(rel: string): string {
    return join(contentRoot, rel)
}

function sourceUrlFor(rel: string): string {
    return `${sourceBaseUrl}/cdn/content-image/${rel.split("/").map(encodeURIComponent).join("/")}`
}

async function downloadImage(rel: string): Promise<"downloaded" | "skipped" | "failed"> {
    const targetPath = localPathFor(rel)
    if (existsSync(targetPath)) return "skipped"
    if (dryRun) return "downloaded"

    const response = await fetch(sourceUrlFor(rel))
    if (!response.ok) return "failed"

    const bytes = Buffer.from(await response.arrayBuffer())
    mkdirSync(dirname(targetPath), { recursive: true })
    writeFileSync(targetPath, bytes)
    return "downloaded"
}

async function runConcurrent<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
    let index = 0
    async function worker() {
        while (index < items.length) {
            const item = items[index++]
            await fn(item)
        }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
}

async function main() {
    const targets = collectImageTargets(contentRoot)
    let downloaded = 0
    let skipped = 0
    const failed: string[] = []

    console.log(`Hydrating ${targets.length} generated iOS image(s) from ${sourceBaseUrl}`)

    await runConcurrent(targets, 16, async (rel) => {
        const status = await downloadImage(rel)
        if (status === "downloaded") downloaded += 1
        if (status === "skipped") skipped += 1
        if (status === "failed") failed.push(rel)
    })

    if (failed.length > 0) {
        if (missingImagesFile) {
            mkdirSync(dirname(missingImagesFile), { recursive: true })
            writeFileSync(missingImagesFile, `${failed.sort().join("\n")}\n`)
        }
        console.error(`Failed to hydrate ${failed.length} generated image(s):`)
        for (const rel of failed.slice(0, 40)) {
            console.error(`  ${rel}`)
        }
        if (failed.length > 40) {
            console.error(`  ...and ${failed.length - 40} more`)
        }
        process.exit(1)
    }

    console.log(`Hydrated generated images: ${downloaded} downloaded, ${skipped} already present`)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
