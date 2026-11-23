import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findIllustrationEntries, isIllustrationEntry } from './discovery'

describe('illustration entry discovery', () => {
    it('keeps nested figures and excludes imported parts and generated output', async () => {
        const root = await mkdtemp(path.join(tmpdir(), 'leetllm-entries-'))
        try {
            const files = [
                'illustrations/main.tsx',
                'illustrations/nested/other.tsx',
                'illustrations/_parts/labels.tsx',
                'illustrations/nested/_parts/grid.tsx',
                'illustrations/_generated/old.tsx',
                'other/component.tsx',
            ]
            for (const file of files) {
                await mkdir(path.dirname(path.join(root, file)), { recursive: true })
                await writeFile(path.join(root, file), 'export default null\n')
            }
            expect(await findIllustrationEntries(root)).toEqual([
                path.join(root, 'illustrations/main.tsx'),
                path.join(root, 'illustrations/nested/other.tsx'),
            ])
        } finally {
            await rm(root, { recursive: true, force: true })
        }
    })

    it('uses the same entry contract for explicit files and Windows paths', () => {
        expect(
            isIllustrationEntry('src/content/topic/illustrations/_parts/illustrations/helper.tsx'),
        ).toBe(false)
        expect(
            isIllustrationEntry('src/content/topic/illustrations/_generated/illustrations/old.tsx'),
        ).toBe(false)
        expect(isIllustrationEntry('src/content/topic/illustrations/_parts/labels.tsx')).toBe(false)
        expect(isIllustrationEntry('src\\content\\topic\\illustrations\\_parts\\labels.tsx')).toBe(
            false,
        )
        expect(isIllustrationEntry('src/content/topic/illustrations/main.tsx')).toBe(true)
        expect(isIllustrationEntry('src/content/topic/component.tsx')).toBe(false)
    })
})
