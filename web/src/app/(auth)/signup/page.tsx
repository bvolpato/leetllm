import Link from "next/link"
import { BrainCircuit } from "lucide-react"
import { SocialLoginButtons } from "@/components/social-login-buttons"
import { SignupForm } from "@/components/signup-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Account",
  robots: { index: false, follow: false },
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const params = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center">
        <Link href="/" className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
          <BrainCircuit className="h-7 w-7 text-primary" />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Start your AI learning journey
        </p>
      </div>

      {params.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 text-center">
          {params.error}
        </div>
      )}

      <div className="grid gap-5">
        <SocialLoginButtons intent="signup" />
        <SignupForm nextUrl={params.next} />
      </div>
      <p className="px-4 text-center text-xs text-muted-foreground/60 leading-relaxed">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
        .
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/login${params.next ? `?next=${encodeURIComponent(params.next)}` : ""}`} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
