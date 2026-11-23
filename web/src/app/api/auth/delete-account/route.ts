import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const adminClient = createAdminClient()
        const { error } = await adminClient.auth.admin.deleteUser(user.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Also sign out locally (clears cookies)
        await supabase.auth.signOut()

        return NextResponse.json({ ok: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred"
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
