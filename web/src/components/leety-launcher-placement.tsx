"use client"

import { useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"

const LEETY_LAUNCHER_HOST_ID = "leety-launcher-host"
const subscribeToLauncherHost = () => () => {}
const getLauncherHost = () => typeof document === "undefined"
    ? null
    : document.getElementById(LEETY_LAUNCHER_HOST_ID)
const getServerLauncherHost = () => null

export function LeetyLauncherPlacement({
    children,
    fallback,
}: {
    children: ReactNode
    fallback: ReactNode
}) {
    const host = useSyncExternalStore(subscribeToLauncherHost, getLauncherHost, getServerLauncherHost)

    return host ? createPortal(children, host) : fallback
}
