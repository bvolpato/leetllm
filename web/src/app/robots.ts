import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: ["/", "/cdn/content-image/", "/api/content-image/"],
            disallow: ["/api/", "/dashboard/", "/auth/"],
        },
        sitemap: "https://leetllm.com/sitemap.xml",
    }
}
