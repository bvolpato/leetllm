import fs from "fs"
import path from "path"
import { parseContentImageUrl } from "./content-assets"
import { getContentImageManifestEntry } from "./content-utils"

const _imageDimensionCache = new Map<string, { width: number; height: number } | null>()

export function getImageDimensions(imagePath: string): { width: number; height: number } | null {
    if (!imagePath) return null

    const parsed = parseContentImageUrl(imagePath)
    if (!parsed) return null

    const relativePath = parsed.relativePath
    const prebuilt = getContentImageManifestEntry(relativePath)
    if (prebuilt?.w && prebuilt?.h) {
        return { width: prebuilt.w, height: prebuilt.h }
    }

    if (process.env.NODE_ENV !== "development" && _imageDimensionCache.has(relativePath)) {
        return _imageDimensionCache.get(relativePath) ?? null
    }

    const fullPath = path.join(/* turbopackIgnore: true */ process.cwd(), "src", "content", /* turbopackIgnore: true */ relativePath)

    if (!fs.existsSync(/* turbopackIgnore: true */ fullPath)) {
        if (process.env.NODE_ENV !== "development") _imageDimensionCache.set(relativePath, null)
        return null
    }

    try {
        const fd = fs.openSync(/* turbopackIgnore: true */ fullPath, "r")
        const buffer = Buffer.alloc(24)
        fs.readSync(fd, buffer, 0, 24, 0)
        fs.closeSync(fd)

        // Basic PNG check
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
            const dims = {
                width: buffer.readUInt32BE(16),
                height: buffer.readUInt32BE(20),
            }
            if (process.env.NODE_ENV !== "development") _imageDimensionCache.set(relativePath, dims)
            return dims
        }
    } catch (e) {
        console.error("Failed to read image dimensions", e)
    }

    if (process.env.NODE_ENV !== "development") _imageDimensionCache.set(relativePath, null)
    return null
}
