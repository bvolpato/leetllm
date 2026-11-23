"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { FileText, LoaderCircle, ShieldCheck, Sparkles, Trash2, WandSparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    DEFAULT_PERSONALIZATION_PROFILE,
    PERSONALIZATION_LIMITS,
    type PersonalizationProfile,
} from "@/lib/personalization-profile"

type ProfileResponse = { profile?: PersonalizationProfile; error?: string }

const fieldClassName = "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function PersonalizationSettings() {
    const [profile, setProfile] = useState(DEFAULT_PERSONALIZATION_PROFILE)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [saved, setSaved] = useState(false)
    const [resume, setResume] = useState<File | null>(null)
    const [clearResumeContext, setClearResumeContext] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetch("/api/personalization/profile", { cache: "no-store" })
            .then(async (response) => {
                const body = await response.json() as ProfileResponse
                if (!response.ok || !body.profile) throw new Error(body.error ?? "Could not load personalization settings")
                setProfile(body.profile)
            })
            .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Could not load personalization settings"))
            .finally(() => setLoading(false))
    }, [])

    async function saveProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError("")
        setSaved(false)

        const body = new FormData()
        body.set("tone", profile.tone)
        body.set("explanationLevel", profile.explanationLevel)
        body.set("customInstructions", profile.customInstructions)
        body.set("learnerContext", profile.learnerContext)
        body.set("clearResumeContext", String(clearResumeContext))
        if (resume) body.set("resume", resume)

        try {
            const response = await fetch("/api/personalization/profile", { method: "PUT", body })
            const result = await response.json() as ProfileResponse
            if (!response.ok || !result.profile) throw new Error(result.error ?? "Could not save personalization settings")
            setProfile(result.profile)
            setResume(null)
            setClearResumeContext(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
            setSaved(true)
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Could not save personalization settings")
        } finally {
            setSaving(false)
        }
    }

    const visibleResumeContext = clearResumeContext ? "" : profile.resumeContext

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                    <WandSparkles className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Lesson personalization</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Teach it your way</h1>
                <p className="max-w-2xl text-muted-foreground">
                    Set your background and preferred teaching style. Lesson wand will adapt explanations while preserving technical facts, code, citations, and visuals.
                </p>
            </div>

            <form onSubmit={saveProfile} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Teaching style</CardTitle>
                        <CardDescription>Choose voice and depth independently. You can change either before regenerating a lesson.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 sm:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium">
                            Tone
                            <select
                                className={fieldClassName}
                                value={profile.tone}
                                onChange={(event) => setProfile({ ...profile, tone: event.target.value as PersonalizationProfile["tone"] })}
                            >
                                <option value="clear">Clear and direct</option>
                                <option value="friendly">Friendly coach</option>
                                <option value="professional">Professional</option>
                                <option value="cowboy">Cowboy</option>
                            </select>
                            <span className="block text-xs font-normal text-muted-foreground">Cowboy: “Let’s wrangle this gradient before it runs wild.”</span>
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                            Explanation level
                            <select
                                className={fieldClassName}
                                value={profile.explanationLevel}
                                onChange={(event) => setProfile({ ...profile, explanationLevel: event.target.value as PersonalizationProfile["explanationLevel"] })}
                            >
                                <option value="eli5">Explain like I’m 5</option>
                                <option value="beginner">Beginner</option>
                                <option value="balanced">Balanced</option>
                                <option value="advanced">Advanced</option>
                            </select>
                            <span className="block text-xs font-normal text-muted-foreground">ELI5: starts with concrete intuition, then introduces exact terms.</span>
                        </label>
                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setProfile({ ...profile, tone: "cowboy" })}>
                                Try Cowboy
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setProfile({ ...profile, explanationLevel: "eli5" })}>
                                Try ELI5
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>What you already know</CardTitle>
                        <CardDescription>Helps lessons skip familiar basics and connect new concepts to your experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <label className="block space-y-2 text-sm font-medium">
                            Learner context
                            <textarea
                                className={`${fieldClassName} min-h-28 resize-y`}
                                maxLength={PERSONALIZATION_LIMITS.learnerContext}
                                placeholder="Example: Python backend engineer. Comfortable with SQL and APIs; new to linear algebra and model training."
                                value={profile.learnerContext}
                                onChange={(event) => setProfile({ ...profile, learnerContext: event.target.value })}
                            />
                            <span className="block text-right text-xs font-normal text-muted-foreground">{profile.learnerContext.length}/{PERSONALIZATION_LIMITS.learnerContext}</span>
                        </label>

                        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                            <div className="flex items-start gap-3">
                                <FileText className="mt-0.5 h-5 w-5 text-primary" />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold">Learn from your resume</p>
                                    <p className="text-xs text-muted-foreground">PDF, TXT, or MD. Maximum 5 MiB.</p>
                                </div>
                            </div>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                                onChange={(event) => {
                                    setResume(event.target.files?.[0] ?? null)
                                    if (event.target.files?.[0]) setClearResumeContext(false)
                                }}
                            />
                            <div className="flex gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                                <p>Resume is sent once to Gemini for analysis. Original file bytes are never stored. LeetLLM stores only filename and derived learning context. Remove secrets before uploading.</p>
                            </div>
                        </div>

                        {(visibleResumeContext || profile.resumeFileName) && (
                            <div className="space-y-3 rounded-lg border p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold">Resume-derived context</p>
                                        {profile.resumeFileName && <p className="text-xs text-muted-foreground">From {profile.resumeFileName}</p>}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setClearResumeContext(true)
                                            setResume(null)
                                            if (fileInputRef.current) fileInputRef.current.value = ""
                                        }}
                                    >
                                        <Trash2 /> Clear
                                    </Button>
                                </div>
                                {visibleResumeContext && <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{visibleResumeContext}</p>}
                                {clearResumeContext && <p className="text-sm text-destructive">Context will be removed when you save.</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Extra instructions</CardTitle>
                        <CardDescription>Add stable preferences not covered above.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <label className="block space-y-2 text-sm font-medium">
                            Custom instructions
                            <textarea
                                className={`${fieldClassName} min-h-24 resize-y`}
                                maxLength={PERSONALIZATION_LIMITS.customInstructions}
                                placeholder="Example: Prefer runnable Python examples. Compare new systems concepts to distributed tracing."
                                value={profile.customInstructions}
                                onChange={(event) => setProfile({ ...profile, customInstructions: event.target.value })}
                            />
                            <span className="block text-right text-xs font-normal text-muted-foreground">{profile.customInstructions.length}/{PERSONALIZATION_LIMITS.customInstructions}</span>
                        </label>
                    </CardContent>
                </Card>

                {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
                {saved && <p role="status" className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-primary"><Sparkles className="h-4 w-4" /> Settings saved. Lesson wand can use them now.</p>}

                <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">{profile.updatedAt ? `Last saved ${new Date(profile.updatedAt).toLocaleString()}` : "Not saved yet"}</p>
                    <Button type="submit" disabled={loading || saving}>
                        {saving ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                        {saving ? (resume ? "Analyzing resume…" : "Saving…") : "Save personalization"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
