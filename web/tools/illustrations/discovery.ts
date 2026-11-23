import { readdir } from 'node:fs/promises'
import path from 'node:path'

/** _parts holds imported helpers. It is never a standalone render entry. */
export function isIllustrationEntry(file: string): boolean {
    const parts = file.split(/[\\/]/)
    const illustrationDirectory = parts.indexOf('illustrations')
    return (
        illustrationDirectory >= 0 &&
        file.endsWith('.tsx') &&
        !parts
            .slice(illustrationDirectory + 1)
            .some((part) => ['_generated', '_parts', 'node_modules'].includes(part))
    )
}

/** Discover figure entries while retaining ordinary nested illustration folders. */
export async function findIllustrationEntries(directory: string): Promise<string[]> {
    const files: string[] = []
    async function walk(current: string): Promise<void> {
        for (const entry of await readdir(current, { withFileTypes: true })) {
            const file = path.join(current, entry.name)
            if (entry.isDirectory()) {
                if (!['_generated', '_parts', 'node_modules'].includes(entry.name)) await walk(file)
            } else if (entry.isFile() && isIllustrationEntry(file)) {
                files.push(file)
            }
        }
    }
    await walk(directory)
    return files.sort()
}
