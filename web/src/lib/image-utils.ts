import fs from "fs"
import path from "path"

type PrebuiltImageManifestEntry = {
    v: string
    w?: number
    h?: number
}

let prebuiltImagesCache: Record<string, PrebuiltImageManifestEntry> | null = null
const _imageDimensionCache = new Map<string, { width: number; height: number } | null>()

function getPrebuiltImages(): Record<string, PrebuiltImageManifestEntry> {
    if (!prebuiltImagesCache) {
        try {
            const manifestPath = path.join(/* turbopackIgnore: true */ process.cwd(), "src", "generated", "content-image-manifest.json")
            prebuiltImagesCache = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ manifestPath, "utf8")) as Record<string, PrebuiltImageManifestEntry>
        } catch {
            prebuiltImagesCache = {}
        }
    }
    return prebuiltImagesCache
}

export function getImageDimensions(imagePath: string): { width: number; height: number } | null {
    if (!imagePath) return null;

    const prefixes = ["/cdn/content-image/", "/api/content-image/"];
    const prefix = prefixes.find(p => imagePath.startsWith(p));
    if (!prefix) return null;

    const relativePath = imagePath.slice(prefix.length).split("?")[0];
    if (process.env.NODE_ENV === "production") {
        const prebuilt = getPrebuiltImages()[relativePath];
        if (prebuilt?.w && prebuilt?.h) {
            return { width: prebuilt.w, height: prebuilt.h };
        }
    }
    if (process.env.NODE_ENV !== "development" && _imageDimensionCache.has(relativePath)) {
        return _imageDimensionCache.get(relativePath) ?? null;
    }

    const fullPath = path.join(/* turbopackIgnore: true */ process.cwd(), "src", "content", /* turbopackIgnore: true */ relativePath);
    
    if (!fs.existsSync(/* turbopackIgnore: true */ fullPath)) {
        if (process.env.NODE_ENV !== "development") _imageDimensionCache.set(relativePath, null);
        return null;
    }
    
    try {
        const fd = fs.openSync(/* turbopackIgnore: true */ fullPath, "r");
        const buffer = Buffer.alloc(24);
        fs.readSync(fd, buffer, 0, 24, 0);
        fs.closeSync(fd);
        
        // Basic PNG check
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
            const dims = {
                width: buffer.readUInt32BE(16),
                height: buffer.readUInt32BE(20),
            };
            if (process.env.NODE_ENV !== "development") _imageDimensionCache.set(relativePath, dims);
            return dims;
        }
    } catch (e) {
        console.error("Failed to read image dimensions", e);
    }
    
    if (process.env.NODE_ENV !== "development") _imageDimensionCache.set(relativePath, null);
    return null;
}
