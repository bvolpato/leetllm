"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export function NavLink({ href, className, ...props }: ComponentProps<typeof Link> & { href: string }) {
    const pathname = usePathname()
    const isActive = pathname === href || pathname?.startsWith(`${href}/`)

    return (
        <Link
            {...props}
            href={href}
            aria-current={isActive ? pathname === href ? "page" : "true" : undefined}
            className={cn(className, isActive && "bg-accent text-accent-foreground")}
        />
    )
}
