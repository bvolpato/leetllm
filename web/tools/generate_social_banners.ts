import { readdirSync, writeFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { loadContentBundle } from '../src/lib/content-bundle'
import { isVisibleToAudience } from '../src/lib/content-audience'

const CONTENT_DIR = join(process.cwd(), 'src', 'content')
const CONTENT_SECTION_FOLDERS = [
    'fundamentals',
    'agents',
    'retrieval',
    'llmops',
    'training',
    'system-design',
]

function getFolders(): string[] {
    const folders: string[] = []

    // Blog
    const blogDir = join(CONTENT_DIR, 'blog')
    if (existsSync(blogDir)) {
        const articleDirs = readdirSync(blogDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)
        for (const slug of articleDirs) {
            folders.push(join(blogDir, slug))
        }
    }

    // Questions
    for (const folderName of CONTENT_SECTION_FOLDERS) {
        const sectionDir = join(CONTENT_DIR, folderName)
        if (!existsSync(sectionDir)) continue

        const articleDirs = readdirSync(sectionDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)

        for (const slug of articleDirs) {
            folders.push(join(sectionDir, slug))
        }
    }

    return folders
}

export function processFolder(folder: string) {
    const bundle = loadContentBundle(folder, "website")
    if (!bundle || !isVisibleToAudience(bundle.metadata, "website")) return null

    let summaryText = "";
    // Get the first 500 characters
    summaryText = bundle.body.substring(0, 500).replace(/\n/g, ' ')

    const metadata = bundle.metadata
    const title = metadata.title
    if (typeof title !== "string") throw new Error(`${bundle.contentPath}: missing title for social banner`)
    const shortDesc = metadata.shortDescription || metadata.excerpt || ""

    const prompt = `A modern, engaging social media illustration for a software engineering technical article. The image MUST contain prominent, stylish, readable text displaying the following phrase: "${title.replace(/"/g, '\\"')} ". It must also contain the text "LeetLLM" clearly visible in one of the corners. It should visually represent the concept. Context: ${shortDesc} ${summaryText}. Use a deep, tech-focused color palette, such as dark blue, purple, or neon accents.`
    return { folder, title, slug: metadata.slug, prompt: prompt.replace(/"/g, '\\"') };
}

async function main() {
    const folders = getFolders()
    const needsImage = []
    for (const folder of folders) {
        if (!existsSync(join(folder, "social_banner.png"))) {
            const data = processFolder(folder)
            if (data) needsImage.push(data)
        }
    }
    writeFileSync('tools/social_banner_prompts.json', JSON.stringify(needsImage, null, 2))
    console.log(`Saved prompts for ${needsImage.length} folders to tools/social_banner_prompts.json`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    void main()
}
