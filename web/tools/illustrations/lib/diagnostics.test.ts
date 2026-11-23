import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { expect, it } from 'vitest'

const execFileAsync = promisify(execFile)

it('checks numeric Satori labels in both themes without aborting diagnostics', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'leetllm-numeric-label-'))
    try {
        const fixture = join(directory, 'numeric-label.tsx')
        const react = resolve('node_modules/react/index.js')
        const vizmatic = resolve('node_modules/vizmatic/dist/index.cjs')
        await writeFile(
            fixture,
            `import React from ${JSON.stringify(react)}
import { Scene, getThemeColors } from ${JSON.stringify(vizmatic)}
export const width = 400
export const height = 160
export function create(theme = 'light') {
    const c = getThemeColors(theme)
    return Scene({ c, padding: 24, children: React.createElement('div', { style: { display: 'flex', fontSize: 18, color: c.textPrimary } }, 0) })
}
export default create()
`,
        )
        const { stdout } = await execFileAsync(process.execPath, [
            resolve('node_modules/vizmatic/dist/cli.js'),
            'check',
            fixture,
            '--theme',
            'dark,light',
            '--json',
        ]).catch((error) => {
            throw new Error(error.stderr || error.stdout || error.message)
        })
        const result = JSON.parse(stdout)
        expect(result.summary.files).toBe(1)
        expect(result.summary.errors).toBe(0)
        expect(
            result.files[0].themes.map((theme: { theme: string }) => theme.theme).sort(),
        ).toEqual(['dark', 'light'])
    } finally {
        await rm(directory, { recursive: true, force: true })
    }
}, 15000)
