import { NextRequest } from "next/server"
import { searchGlossary } from "@/lib/glossary-server"
import { compressedResponse } from "@/lib/response-compression"

export function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? ""
    if (!query || query.length > 200) {
        return Response.json({ error: "Search must contain 1 to 200 characters." }, { status: 400 })
    }
    return compressedResponse(request, JSON.stringify(searchGlossary(query)), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=600",
        },
    })
}
