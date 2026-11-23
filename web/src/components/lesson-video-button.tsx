"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog } from "radix-ui"
import { Video, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LessonVideo } from "@/lib/lesson-videos"

function LessonVideoPlayer({ video }: { video: LessonVideo }) {
    const playerRef = useRef<HTMLVideoElement>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        const player = playerRef.current
        if (!player) return
        player.src = video.url
        return () => {
            player.pause()
            player.removeAttribute("src")
            player.load()
        }
    }, [video.url])

    return (
        <div className="min-h-0 overflow-auto">
            <video
                ref={playerRef}
                poster={video.poster}
                controls
                playsInline
                preload="metadata"
                crossOrigin={video.captions ? "anonymous" : undefined}
                aria-label={video.title}
                className="block aspect-video max-h-[calc(100dvh-10rem)] w-full bg-black object-contain"
                onError={() => setFailed(true)}
            >
                {video.captions && (
                    <track kind="captions" src={video.captions} srcLang="en" label="English" />
                )}
            </video>
            {failed && (
                <p role="alert" className="px-4 py-3 text-sm text-muted-foreground">
                    The video could not load.{" "}
                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                        Open the recording directly
                    </a>.
                </p>
            )}
        </div>
    )
}

export function LessonVideoButton({ video, iconOnly = false }: { video: LessonVideo; iconOnly?: boolean }) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size={iconOnly ? "icon-sm" : "sm"}
                    data-print-hidden
                    aria-label={`Watch video: ${video.title}`}
                    title="Watch lesson video"
                >
                    <Video className="h-4 w-4" aria-hidden="true" />
                    <span className={iconOnly ? "sr-only" : "sr-only sm:not-sr-only"}>Watch video</span>
                </Button>
            </Dialog.Trigger>
            {open && (
                <Dialog.Portal>
                    <Dialog.Overlay data-print-hidden className="fixed inset-0 z-[100] bg-black/80" />
                    <Dialog.Content
                        data-print-hidden
                        className="fixed left-1/2 top-1/2 z-[101] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-2xl outline-none"
                    >
                        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
                            <div className="min-w-0">
                                <Dialog.Title className="text-base font-semibold leading-snug">{video.title}</Dialog.Title>
                                <Dialog.Description className="sr-only">Lesson recording with native playback controls.</Dialog.Description>
                            </div>
                            <Dialog.Close asChild>
                                <Button type="button" variant="ghost" size="icon" aria-label="Close lesson video" className="shrink-0">
                                    <X className="h-4 w-4" aria-hidden="true" />
                                </Button>
                            </Dialog.Close>
                        </header>
                        <LessonVideoPlayer video={video} />
                    </Dialog.Content>
                </Dialog.Portal>
            )}
        </Dialog.Root>
    )
}
