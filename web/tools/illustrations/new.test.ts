import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createFigure } from './new'

describe('illustration scaffolding', () => {
    it('creates a formatted figure in an existing article and refuses overwrite or escape', async () => {
        const root = await mkdtemp(path.join(tmpdir(), 'leetllm-figure-'))
        try {
            await mkdir(path.join(root, 'section/topic'), { recursive: true })
            await writeFile(path.join(root, 'section/topic/content.md'), '# Topic\n')
            const file = await createFigure(root, 'section/topic', 'budget', 'layout')
            const before = await readFile(file, 'utf8')
            await expect(
                createFigure(root, 'section/topic', 'budget', 'plot'),
            ).rejects.toMatchObject({ code: 'EEXIST' })
            expect(await readFile(file, 'utf8')).toBe(before)
            await expect(createFigure(root, '../outside', 'budget', 'layout')).rejects.toThrow(
                'inside src/content',
            )
            await expect(
                createFigure(root, 'section/topic', '../outside', 'layout'),
            ).rejects.toThrow('lowercase')
        } finally {
            await rm(root, { recursive: true, force: true })
        }
    })
    it('refuses article and illustration-directory symlinks that leave the bundle', async () => {
        const base = await mkdtemp(path.join(tmpdir(), 'leetllm-confined-'))
        const content = path.join(base, 'content'),
            outside = path.join(base, 'outside')
        try {
            await mkdir(path.join(content, 'real'), { recursive: true })
            await mkdir(outside)
            await writeFile(path.join(outside, 'content.md'), '# Outside\n')
            await writeFile(path.join(content, 'real/content.md'), '# Real\n')
            await symlink(outside, path.join(content, 'linked'), 'dir')
            await expect(createFigure(content, 'linked', 'example', 'layout')).rejects.toThrow(
                'resolve inside',
            )
            await symlink(outside, path.join(content, 'real/illustrations'), 'dir')
            await expect(createFigure(content, 'real', 'example', 'plot')).rejects.toThrow(
                'inside their article',
            )
            expect(await readdir(outside)).toEqual(['content.md'])
        } finally {
            await rm(base, { recursive: true, force: true })
        }
    })
})
