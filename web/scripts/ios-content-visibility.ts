import { join, relative } from "path"
import { loadContentBundle } from "../src/lib/content-bundle"
import { isVisibleToAudience } from "../src/lib/content-audience"

export function createPublicContentBundleFilter(contentRoot: string, publicBlogSlugs: ReadonlySet<string>) {
    const visibleByDirectory = new Map<string, boolean>()
    return (path: string): boolean => {
        const [section, directory] = relative(contentRoot, path).split("/")
        if (section === "blog") return publicBlogSlugs.has(directory)
        if (!directory) return true
        const articleDir = join(contentRoot, section, directory)
        const cached = visibleByDirectory.get(articleDir)
        if (cached !== undefined) return cached
        const bundle = loadContentBundle(articleDir, "website")
        const visible = bundle === null || isVisibleToAudience(bundle.metadata, "website")
        visibleByDirectory.set(articleDir, visible)
        return visible
    }
}
