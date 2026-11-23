"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function PublicError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("[PublicLayout] Error:", error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 mb-6">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground max-w-md mb-6">
                We hit an unexpected error loading this page. This is usually
                temporary.
            </p>
            <div className="flex items-center gap-3">
                <Button onClick={reset} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </Button>
                <Link href="/">
                    <Button variant="outline" className="gap-2">
                        <Home className="h-4 w-4" />
                        Go Home
                    </Button>
                </Link>
            </div>
        </div>
    )
}
