import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { BrainCircuit } from "lucide-react"
import { SocialLoginButtons } from "@/components/social-login-buttons"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>
}) {
  const params = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center">
        <Link href="/" className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
          <BrainCircuit className="h-7 w-7 text-primary" />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your LeetLLM account
        </p>
      </div>

      {params.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 text-center">
          {params.error}
        </div>
      )}

      {params.message && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400 text-center">
          {params.message}
        </div>
      )}

      <div className="grid gap-5">
        <SocialLoginButtons />
        <form action="/api/auth/login" method="POST">
          {params.next && <input type="hidden" name="next" value={params.next} />}
          <div className="grid gap-3">
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              required
              className="h-11 bg-background/50 border-border/50"
            />
            <Input
              id="password"
              name="password"
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 bg-background/50 border-border/50"
            />
            <Button type="submit" className="h-11 mt-1">
              Sign In
            </Button>
          </div>
        </form>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={`/signup${params.next ? `?next=${encodeURIComponent(params.next)}` : ""}`} className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
