// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const disk = vi.hoisted(() => ({
  manifest: null as string | null,
  renderer: 'renderer-v1',
  katex: '0.16.28',
  outputs: new Set<string>(),
}))

vi.mock('fs/promises', () => ({
  readdir: vi.fn(async () => ['render.ts']),
  readFile: vi.fn(async (path: string) => {
    if (path.endsWith('diagrams.json')) {
      if (disk.manifest === null) throw new Error('ENOENT')
      return disk.manifest
    }
    if (path.endsWith('package.json')) {
      return JSON.stringify({ dependencies: { mermaid: '11.16.1', katex: disk.katex } })
    }
    if (path.endsWith('render.ts')) return disk.renderer
    throw new Error(`Unexpected read: ${path}`)
  }),
  mkdir: vi.fn(async () => undefined),
  writeFile: vi.fn(async (_path: string, content: string) => {
    disk.manifest = content
  }),
}))

vi.mock('fs', () => ({
  existsSync: vi.fn((path: string) => disk.outputs.has(path)),
}))

import { checkDiagramCache, type DiagramEntry } from '../../tools/diagrams/lib/cache'

function entry(key: string, content = 'graph LR\n A --> B'): DiagramEntry {
  const articleDir = `/articles/${key}`
  for (const theme of ['dark', 'light']) {
    disk.outputs.add(`${articleDir}/diagrams/_generated/content_diagram_0_${theme}.png`)
  }
  return { key, content, articleDir, index: 0, sourceFile: `${articleDir}/content.md` }
}

beforeEach(() => {
  disk.manifest = null
  disk.renderer = 'renderer-v1'
  disk.katex = '0.16.28'
  disk.outputs.clear()
  vi.clearAllMocks()
})

describe('diagram cache partial builds', () => {
  it.each(['renderer', 'dependency'] as const)(
    'rebuilds untouched diagrams after a %s change and a partial build',
    async (change) => {
      const a = entry('A')
      const b = entry('B')
      const initial = await checkDiagramCache([a, b])
      await initial.updater.save()

      if (change === 'renderer') disk.renderer = 'renderer-v2'
      else disk.katex = '0.18.2'

      const partial = await checkDiagramCache([a], { partialRun: true })
      expect(partial.frameworkChanged).toBe(true)
      expect(partial.toRender).toEqual([a])
      await partial.updater.save()

      const full = await checkDiagramCache([a, b])
      expect(full.frameworkChanged).toBe(false)
      expect(full.cached).toEqual([a])
      expect(full.toRender).toEqual([b])
    },
  )

  it('preserves untouched diagrams when only one diagram changes', async () => {
    const a = entry('A')
    const b = entry('B')
    const initial = await checkDiagramCache([a, b])
    await initial.updater.save()

    const changedA = entry('A', 'graph LR\n A --> C')
    const partial = await checkDiagramCache([changedA], { partialRun: true })
    expect(partial.frameworkChanged).toBe(false)
    expect(partial.toRender).toEqual([changedA])
    await partial.updater.save()

    const full = await checkDiagramCache([changedA, b])
    expect(full.toRender).toEqual([])
    expect(full.cached).toEqual([changedA, b])
  })
})
