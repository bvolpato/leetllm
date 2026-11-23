import "server-only"
import manifest from "@/generated/lesson-videos.json"
import withheldRecordings from "./withheld-lesson-videos.json"

export interface LessonVideo {
    lessonId: string
    title: string
    url: string
    durationSeconds: number
    poster?: string
    captions?: string
    sha256: string
}

if (manifest.schemaVersion !== 1) {
    throw new Error("Unsupported lesson video manifest schema")
}

const videos: Readonly<Record<string, LessonVideo>> = manifest.videos
const withheld: Readonly<Record<string, { sha256: string; reason: string }>> = withheldRecordings

export function getLessonVideo(canonicalArticleSlug: string): LessonVideo | undefined {
    if (!Object.hasOwn(videos, canonicalArticleSlug)) return undefined
    const video = videos[canonicalArticleSlug]
    return withheld[canonicalArticleSlug]?.sha256 === video.sha256 ? undefined : video
}
