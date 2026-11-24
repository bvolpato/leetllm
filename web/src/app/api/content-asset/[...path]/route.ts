import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import { basename, extname, join } from "path"
import { compressedResponse } from "@/lib/response-compression"

const CONTENT_DIR = join(process.cwd(), "src", "content")

function contentTypeForExtension(extension: string): string {
    switch (extension.toLowerCase()) {
        case ".txt":
            return "text/plain; charset=utf-8"
        case ".md":
            return "text/markdown; charset=utf-8"
        case ".json":
            return "application/json; charset=utf-8"
        case ".csv":
            return "text/csv; charset=utf-8"
        case ".tsv":
            return "text/tab-separated-values; charset=utf-8"
        case ".pdf":
            return "application/pdf"
        case ".zip":
            return "application/zip"
        case ".png":
            return "image/png"
        case ".jpg":
        case ".jpeg":
            return "image/jpeg"
        case ".webp":
            return "image/webp"
        case ".gif":
            return "image/gif"
        case ".svg":
            return "image/svg+xml"
        default:
            return "application/octet-stream"
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const pathSegments = (await params).path

    if (!pathSegments.includes("assets")) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }

    if (pathSegments.some(segment => segment === ".." || segment.startsWith("."))) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }

    const filePath = join(/* turbopackIgnore: true */ CONTENT_DIR, ...pathSegments)
    if (!filePath.startsWith(CONTENT_DIR)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }

    if (!existsSync(/* turbopackIgnore: true */ filePath)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    try {
        const buffer = await readFile(/* turbopackIgnore: true */ filePath)
        return compressedResponse(request, new Uint8Array(buffer), {
            status: 200,
            headers: {
                "Content-Type": contentTypeForExtension(extname(filePath)),
                "Content-Length": buffer.length.toString(),
                "Content-Disposition": `attachment; filename="${basename(filePath)}"`,
                "Cache-Control": "public, max-age=3600",
            },
        })
    } catch {
        return NextResponse.json({ error: "Read error" }, { status: 500 })
    }
}
