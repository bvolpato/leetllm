"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTheme } from "next-themes"
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { MAX_CONTENT_IMAGE_HEIGHT_PX } from "@/lib/content-media"
import { IllustrationViewer } from "./illustration-viewer"

interface SceneMeta {
    index: number
    duration: number
    transition: string
    transitionDuration: number
    label?: string
}

interface SceneIllustrationData {
    kind?: "scenes"
    alt: string
    width: number
    height: number
    darkScenes: string[]
    lightScenes: string[]
    scenes: SceneMeta[]
}

interface TimelineIllustrationData {
    kind: "timeline"
    alt: string
    width: number
    height: number
    duration: number
    fps: number
    darkGif: string
    lightGif: string
    darkFallback: string
    lightFallback: string
}

interface FilmIllustrationData {
    kind: "film"
    alt: string
    width: number
    height: number
    duration: number
    darkVideo: string
    lightVideo: string
    darkCaptions: string
    lightCaptions: string
    darkFallback: string
    lightFallback: string
}

type AnimatedIllustrationData = SceneIllustrationData | TimelineIllustrationData | FilmIllustrationData

/**
 * Interactive viewer for films, GIF timelines, and legacy scene steppers.
 * Films wait for Play and keep themed static figures for reading and print.
 */
export function AnimatedIllustration({ data }: { data: string }) {
    const parsed = JSON.parse(data) as AnimatedIllustrationData
    if (parsed.kind === "film") return <FilmIllustration parsed={parsed} />
    return parsed.kind === "timeline"
        ? <TimelineIllustration parsed={parsed} />
        : <SceneIllustration parsed={parsed} />
}

function FilmIllustration({ parsed }: { parsed: FilmIllustrationData }) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [started, setStarted] = useState(false)
    const [failed, setFailed] = useState(false)
    const [playing, setPlaying] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const playbackTime = useRef(0)
    const isLight = mounted && resolvedTheme === "light"
    const poster = isLight ? parsed.lightFallback : parsed.darkFallback
    const source = isLight ? parsed.lightVideo : parsed.darkVideo
    const captions = isLight ? parsed.lightCaptions : parsed.darkCaptions

    useEffect(() => {
        queueMicrotask(() => setMounted(true))
        const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
        const stopForReducedMotion = () => {
            if (preference.matches) {
                videoRef.current?.pause()
                setStarted(false)
            }
        }
        preference.addEventListener("change", stopForReducedMotion)
        return () => preference.removeEventListener("change", stopForReducedMotion)
    }, [])

    useEffect(() => {
        const video = videoRef.current
        if (!video || typeof IntersectionObserver === "undefined") return
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) video.pause()
        })
        observer.observe(video)
        return () => observer.disconnect()
    }, [started, source])

    return (
        <>
            <div className="w-full print:hidden">
                {started ? (
                    <div
                        className={`relative overflow-hidden rounded-lg border [border-color:var(--reading-border)]/60 ${isLight ? "bg-[#f7f3ea]" : "bg-[#0b0c10]"}`}
                        style={{ paddingBottom: `calc(${100 * parsed.height / parsed.width}% + 3rem)` }}
                    >
                        <video
                            key={source}
                            ref={videoRef}
                            src={source}
                            poster={poster}
                            aria-label={parsed.alt}
                            width={parsed.width}
                            height={parsed.height}
                            className="absolute inset-0 h-full w-full object-contain object-top"
                            controls
                            playsInline
                            muted
                            autoPlay={playing}
                            preload="metadata"
                            onPlay={() => setPlaying(true)}
                            onPause={() => setPlaying(false)}
                            onEnded={() => setPlaying(false)}
                            onTimeUpdate={(event) => { playbackTime.current = event.currentTarget.currentTime }}
                            onLoadedMetadata={(event) => {
                                event.currentTarget.currentTime = Math.min(playbackTime.current, event.currentTarget.duration)
                            }}
                            onError={() => { setStarted(false); setFailed(true) }}
                        >
                            <track kind="captions" src={captions} srcLang="en" label="English" />
                        </video>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="group relative mx-auto block w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        aria-label={`Play animation: ${parsed.alt}`}
                        onClick={() => { setFailed(false); setStarted(true); setPlaying(true) }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={poster} alt={parsed.alt} className="mx-auto w-full max-h-[800px] object-contain" loading="lazy" />
                        <span className="mt-2.5 flex justify-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full border [border-color:var(--reading-border)] [background:var(--reading-panel)] px-3.5 py-1.5 text-xs font-medium [color:var(--reading-ink)] backdrop-blur-sm shadow-sm transition-colors group-hover:border-primary/40 group-hover:text-primary">
                                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                                Play animation
                                <span className="font-normal [color:var(--reading-muted)]">{Math.round(parsed.duration / 1000)}s</span>
                            </span>
                        </span>
                    </button>
                )}
                {failed && <p role="status" className="mt-2 text-center text-sm text-muted-foreground">The animation could not load. The figure remains available; select Play to try again.</p>}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={parsed.lightFallback} alt={parsed.alt} className="hidden w-full print:block" />
        </>
    )
}

function TimelineIllustration({ parsed }: { parsed: TimelineIllustrationData }) {
    const {
        alt,
        width,
        height,
        duration,
        darkGif,
        lightGif,
        darkFallback,
        lightFallback,
    } = parsed
    const maxDisplayWidth = Math.min(width, Math.round((MAX_CONTENT_IMAGE_HEIGHT_PX * width) / height))
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [restartToken, setRestartToken] = useState(0)
    const [currentFrameSrc, setCurrentFrameSrc] = useState<string | null>(null)
    const imageRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)")
        const syncPreference = () => setIsPlaying(!motionPreference.matches)

        queueMicrotask(() => {
            setMounted(true)
            syncPreference()
        })
        motionPreference.addEventListener("change", syncPreference)
        return () => motionPreference.removeEventListener("change", syncPreference)
    }, [])

    const isDark = mounted ? resolvedTheme !== "light" : true
    const animatedSrc = isDark ? darkGif : lightGif
    const fallbackSrc = isDark ? darkFallback : lightFallback
    const imageSrc = mounted && isPlaying ? animatedSrc : fallbackSrc

    const openAtCurrentFrame = useCallback(() => {
        const currentImage = imageRef.current
        let frameSource: string | null = null
        if (isPlaying && currentImage && currentImage.naturalWidth > 0 && currentImage.naturalHeight > 0) {
            try {
                const canvas = document.createElement("canvas")
                canvas.width = currentImage.naturalWidth
                canvas.height = currentImage.naturalHeight
                const context = canvas.getContext("2d")
                if (context) {
                    context.drawImage(currentImage, 0, 0)
                    frameSource = canvas.toDataURL("image/png")
                }
            } catch {
                // Cross-origin images may block canvas export. Fall back to the authored poster.
            }
        }
        setCurrentFrameSrc(frameSource)
        setIsPlaying(false)
    }, [isPlaying])

    const restart = useCallback(() => {
        setRestartToken((value) => value + 1)
        setIsPlaying(true)
    }, [])

    return (
        <>
            <div
                className="relative group rounded-xl overflow-hidden border border-border/40 bg-card/30 w-full mx-auto"
                style={{ maxWidth: maxDisplayWidth }}
            >
                <div style={{ aspectRatio: `${width} / ${height}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        ref={imageRef}
                        key={`${isDark ? "dark" : "light"}-${isPlaying}-${restartToken}`}
                        src={imageSrc}
                        alt={alt}
                        className="w-full h-full object-contain"
                        width={width}
                        height={height}
                        loading="lazy"
                    />
                </div>

                <div className="flex items-center justify-between gap-3 px-3 py-2 bg-card/80 backdrop-blur-sm border-t border-border/30">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setIsPlaying((value) => !value)}
                            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                            aria-label={isPlaying ? "Pause animation and show final frame" : "Play animation"}
                        >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={restart}
                            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                            aria-label="Restart animation"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <span className="text-xs text-muted-foreground/70" aria-live="polite">
                        {isPlaying ? "Playing" : "Final frame"}
                    </span>
                    <span className="text-xs text-muted-foreground/50 tabular-nums">
                        {(duration / 1000).toFixed(1)}s loop
                    </span>
                </div>
            </div>
            <IllustrationViewer
                src={currentFrameSrc ?? imageSrc}
                alt={alt}
                displayWidth={width}
                displayHeight={height}
                onOpen={openAtCurrentFrame}
                onClose={() => setCurrentFrameSrc(null)}
            />
        </>
    )
}

function SceneIllustration({ parsed }: { parsed: SceneIllustrationData }) {
    const { darkScenes, lightScenes, scenes, alt, width, height } = parsed
    const maxDisplayWidth = Math.min(width, Math.round((MAX_CONTENT_IMAGE_HEIGHT_PX * width) / height))

    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [currentScene, setCurrentScene] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingSceneRef = useRef<number | null>(null)

    useEffect(() => { queueMicrotask(() => setMounted(true)) }, [])

    const isDark = mounted ? resolvedTheme !== "light" : true
    const sceneSrcs = isDark ? darkScenes : lightScenes

    // Preload all scene images
    useEffect(() => {
        sceneSrcs.forEach((src) => {
            const img = new Image()
            img.src = src
        })
    }, [sceneSrcs])

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const clearTransitionTimer = useCallback(() => {
        if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current)
            transitionTimerRef.current = null
        }
    }, [])

    const transitionTo = useCallback((index: number) => {
        clearTransitionTimer()
        pendingSceneRef.current = index
        setIsTransitioning(true)
        transitionTimerRef.current = setTimeout(() => {
            transitionTimerRef.current = null
            pendingSceneRef.current = null
            setCurrentScene(index)
            setIsTransitioning(false)
        }, 50)
    }, [clearTransitionTimer])

    const finishPendingTransition = useCallback(() => {
        const pendingScene = pendingSceneRef.current
        clearTransitionTimer()
        pendingSceneRef.current = null
        if (pendingScene !== null) {
            setCurrentScene(pendingScene)
            setIsTransitioning(false)
        }
    }, [clearTransitionTimer])

    useEffect(() => () => clearTransitionTimer(), [clearTransitionTimer])

    // Auto-play timer
    useEffect(() => {
        if (!isPlaying) return
        clearTimer()

        const scene = scenes[currentScene]
        timerRef.current = setTimeout(() => {
            // Let CSS transition play, then advance or loop back to the start.
            transitionTo(currentScene < scenes.length - 1 ? currentScene + 1 : 0)
        }, scene.duration)

        return clearTimer
    }, [currentScene, isPlaying, scenes, clearTimer, transitionTo])

    const goTo = useCallback((index: number) => {
        clearTimer()
        setIsPlaying(false)
        transitionTo(index)
    }, [clearTimer, transitionTo])

    const goNext = useCallback(() => {
        goTo(currentScene < scenes.length - 1 ? currentScene + 1 : 0)
    }, [currentScene, scenes.length, goTo])

    const goPrev = useCallback(() => {
        goTo(currentScene > 0 ? currentScene - 1 : scenes.length - 1)
    }, [currentScene, scenes.length, goTo])

    const togglePlay = useCallback(() => {
        setIsPlaying((prev) => !prev)
    }, [])

    const restart = useCallback(() => {
        clearTimer()
        clearTransitionTimer()
        pendingSceneRef.current = null
        setIsTransitioning(false)
        setCurrentScene(0)
        setIsPlaying(true)
    }, [clearTimer, clearTransitionTimer])

    const scene = scenes[currentScene]
    const transitionStyle = scene.transition === "fade"
        ? `opacity ${scene.transitionDuration}ms ease-in-out`
        : "opacity 200ms ease"

    return (
        <>
            <div
                className="relative group rounded-xl overflow-hidden border border-border/40 bg-card/30 w-full mx-auto"
                style={{ maxWidth: maxDisplayWidth }}
            >
                {/* Scene image */}
                <div
                    className="relative overflow-hidden"
                    style={{ aspectRatio: `${width} / ${height}` }}
                >
                    {sceneSrcs.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={src}
                            src={src}
                            alt={i === currentScene ? `${alt}, step ${i + 1}${scene.label ? `: ${scene.label}` : ""}` : ""}
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                                opacity: i === currentScene && !isTransitioning ? 1 : 0,
                                transition: transitionStyle,
                            }}
                            loading={i === 0 ? "eager" : "lazy"}
                        />
                    ))}
                </div>

                {/* Controls overlay */}
                <div className="flex items-center justify-between px-3 py-2 bg-card/80 backdrop-blur-sm border-t border-border/30">
                    {/* Left: playback controls */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goPrev}
                            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                            aria-label="Previous step"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={goNext}
                            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                            aria-label="Next step"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={restart}
                            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground ml-1"
                            aria-label="Restart"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Center: step dots + label */}
                    <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
                        <div className="flex items-center gap-1.5">
                            {scenes.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => goTo(i)}
                                    className={`rounded-full transition-all duration-200 ${i === currentScene
                                        ? "w-6 h-2 bg-primary"
                                        : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                        }`}
                                    aria-label={`Step ${i + 1}${s.label ? `: ${s.label}` : ""}`}
                                />
                            ))}
                        </div>
                        {scene.label && (
                            <span className="text-xs text-muted-foreground/70 truncate hidden sm:block">
                                {scene.label}
                            </span>
                        )}
                    </div>

                    {/* Right: step counter */}
                    <span className="text-xs text-muted-foreground/50 tabular-nums flex-shrink-0">
                        {currentScene + 1}/{scenes.length}
                    </span>
                </div>
            </div>
            <IllustrationViewer
                src={sceneSrcs[currentScene]}
                alt={`${alt}, step ${currentScene + 1}${scene.label ? `: ${scene.label}` : ""}`}
                displayWidth={width}
                displayHeight={height}
                caption={scene.label}
                onOpen={() => {
                    clearTimer()
                    finishPendingTransition()
                    setIsPlaying(false)
                }}
            />
        </>
    )
}
