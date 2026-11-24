import { type NextRequest, NextResponse } from "next/server"
import { searchCurriculum } from "@/lib/learn-search"

const DEFAULT_LIMIT = 8
const MAX_LIMIT = 12

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q") ?? ""
    const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? DEFAULT_LIMIT)
    const limit = Number.isFinite(rawLimit)
        ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(rawLimit)))
        : DEFAULT_LIMIT

    const payload = searchCurriculum(query, limit)

    return NextResponse.json(payload, {
        headers: {
            "Cache-Control": "public, max-age=60, s-maxage=3600, stale-while-revalidate=600",
        },
    })
}
