import type { Metadata } from "next"
import { PersonalizationSettings } from "./personalization-settings"

export const metadata: Metadata = {
    title: "Personalization settings",
    robots: { index: false, follow: false },
}

export default function PersonalizationSettingsPage() {
    return <PersonalizationSettings />
}
