import fs from "fs"
import path from "path"

export function getImageDimensions(imagePath: string): { width: number; height: number } | null {
    if (!imagePath) return null;

    const prefixes = ["/cdn/content-image/", "/api/content-image/"];
    const prefix = prefixes.find(p => imagePath.startsWith(p));
    if (!prefix) return null;

    const relativePath = imagePath.slice(prefix.length).split("?")[0];
    const fullPath = path.join(process.cwd(), "src", "content", relativePath);
    
    if (!fs.existsSync(fullPath)) return null;
    
    try {
        const fd = fs.openSync(fullPath, "r");
        const buffer = Buffer.alloc(24);
        fs.readSync(fd, buffer, 0, 24, 0);
        fs.closeSync(fd);
        
        // Basic PNG check
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
            return {
                width: buffer.readUInt32BE(16),
                height: buffer.readUInt32BE(20),
            };
        }
    } catch (e) {
        console.error("Failed to read image dimensions", e);
    }
    
    return null;
}
