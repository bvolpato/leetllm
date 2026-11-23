import { NextRequest } from "next/server"
import { getGlossaryEntry } from "@/lib/glossary-server"
import { compressedResponse } from "@/lib/response-compression"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const entry = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ? getGlossaryEntry(id) : undefined
    return compressedResponse(request, JSON.stringify(entry ?? { error: "Definition not found." }), {
        status: entry ? 200 : 404,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": entry ? "public, max-age=300, s-maxage=3600, stale-while-revalidate=600" : "no-store",
        },
    })
}
