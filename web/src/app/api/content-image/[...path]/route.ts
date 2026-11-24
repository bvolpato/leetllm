import { NextRequest } from "next/server"
import { serveContentImage } from "@/lib/content-image-response"

/**
 * Legacy image route. New content uses /cdn/content-image/, but cached HTML and
 * older social cards can still point here. Serve bytes directly instead of
 * redirecting so Next's image optimizer can read legacy URLs.
 */
export async function GET(
    request: NextRequest,
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
