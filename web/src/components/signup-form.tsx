"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { trackFunnel } from "@/lib/analytics"

export function SignupForm({
    nextUrl,
}: {
    nextUrl?: string
}) {
    return (
        <form
            action="/api/auth/signup"
            method="POST"
            onSubmit={() => trackFunnel({ step: "signup_start", method: "email" })}
        >
            {nextUrl && <input type="hidden" name="next" value={nextUrl} />}
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
                    placeholder="Create a password"
                    type="password"
                    required
                    minLength={6}
                    className="h-11 bg-background/50 border-border/50"
                />
                <Button type="submit" className="h-11 mt-1">
                    Create Account
                </Button>
            </div>
        </form>
    )
}
