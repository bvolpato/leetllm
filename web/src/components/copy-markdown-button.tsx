"use client"

import { useState } from "react"
import { Check, Copy, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { copyMarkdownFromUrl } from "@/lib/copy-text"
import { cn } from "@/lib/utils"

export function CopyMarkdownButton({
    slug,
    className,
    label = "Copy as markdown",
    copiedLabel = "Copied",
    ariaLabel,
}: {
    slug: string
    className?: string
    label?: string
    copiedLabel?: string
    ariaLabel?: string
}) {
    const [status, setStatus] = useState<"idle" | "copying" | "copied">("idle")

    async function handleCopy() {
        setStatus("copying")
        try {
            await copyMarkdownFromUrl(`/api/md/${encodeURIComponent(slug)}`)
            setStatus("copied")
            window.setTimeout(() => setStatus("idle"), 2000)
        } catch {
            setStatus("idle")
        }
    }

    const busy = status === "copying"
    const copied = status === "copied"

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleCopy()}
            disabled={busy}
            className={cn("gap-2", className)}
            data-print-hidden
            aria-label={copied ? copiedLabel : (ariaLabel ?? label)}
            title="Copy as markdown for pasting into an LLM"
        >
            {busy
                ? <LoaderCircle className="h-4 w-4 animate-spin" />
                : copied
                    ? <Check className="h-4 w-4" />
                    : <Copy className="h-4 w-4" />}
            {busy ? "Copying" : copied ? copiedLabel : label}
        </Button>
    )
}
