import { NextResponse } from "next/server"

export async function GET() {
    return NextResponse.json(
        { valid: false, error: "LeetLLM does not use promo codes." },
        { status: 410 }
    )
}
