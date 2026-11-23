import { describe, expect, it } from "vitest"
import { generateMetadata } from "./page"

describe("practice problem metadata", () => {
    it("lets the root title template add the site name once", async () => {
        const metadata = await generateMetadata({
            params: Promise.resolve({ slug: "same-host-crawler" }),
        })

        expect(metadata.title).toBe("Same-host Crawler | Practice")
    })
})
