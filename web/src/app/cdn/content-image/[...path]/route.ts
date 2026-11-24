import { serveContentImage } from "@/lib/content-image-response"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return serveContentImage(
        (await params).path,
        new URL(request.url),
        undefined,
        request.headers.get("range"),
        request.headers.get("if-none-match"),
    )
}
