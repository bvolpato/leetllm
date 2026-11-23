import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import ts from 'typescript'
import { afterEach, describe, expect, it } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const webDirectory = resolve(testDirectory, '../../..')
const cacheSourcePath = join(testDirectory, 'cache.ts')
const temporaryDirectories: string[] = []
const execFileAsync = promisify(execFile)

async function createCacheFixture() {
    // macOS links /var to /private/var. Module resolution returns the real path, so the fixture root must match it.
    const temporaryDirectory = await mkdtemp(
        join(await realpath(tmpdir()), 'leetllm-illustration-cache-'),
    )
    temporaryDirectories.push(temporaryDirectory)

    const webRoot = join(temporaryDirectory, 'web')
    const libraryDirectory = join(webRoot, 'tools/illustrations/lib')
    const illustrationsDirectory = join(
        webRoot,
        'src/content/foundations/cache-fixture/illustrations',
    )
    const articleDirectory = dirname(illustrationsDirectory)
    await mkdir(libraryDirectory, { recursive: true })
    await mkdir(illustrationsDirectory, { recursive: true })
    await mkdir(join(webRoot, 'tools/illustrations'), { recursive: true })
    await symlink(join(webDirectory, 'node_modules'), join(webRoot, 'node_modules'), 'dir')

    const source = await readFile(cacheSourcePath, 'utf-8')
    await writeFile(join(libraryDirectory, 'cache.ts'), source)
    const runtime = ts.transpileModule(source, {
        fileName: 'cache.ts',
        compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            esModuleInterop: true,
        },
    }).outputText
    const runtimePath = join(libraryDirectory, 'cache.mjs')
    await writeFile(runtimePath, runtime)
    await writeFile(join(webRoot, 'pnpm-lock.yaml'), 'fixture lockfile\n')
    await writeFile(
        join(webRoot, 'tsconfig.json'),
        JSON.stringify({
            compilerOptions: {
                module: 'esnext',
                moduleResolution: 'bundler',
                target: 'es2022',
                jsx: 'react-jsx',
                paths: { '@/*': ['src/*'] },
            },
        }),
    )
    await writeFile(join(webRoot, 'tools/illustrations/build.ts'), 'export {}\n')
    await writeFile(join(webRoot, 'tools/illustrations/discovery.ts'), 'export {}\n')
    await writeFile(join(webRoot, 'tools/illustrations/embedded.ts'), 'export {}\n')

    const wrapperPaths = [
        join(illustrationsDirectory, 'relative_wrapper.tsx'),
        join(illustrationsDirectory, 'alias_wrapper.tsx'),
    ]
    const helperPath = join(articleDirectory, 'shared_figure.tsx')
    const cyclePath = join(articleDirectory, 'cycle.tsx')
    await writeFile(
        wrapperPaths[0],
        "import { sharedValue } from '../shared_figure'\nexport const value = sharedValue\n",
    )
    await writeFile(
        wrapperPaths[1],
        "import { sharedValue } from '@/content/foundations/cache-fixture/shared_figure'\nexport const value = sharedValue\n",
    )
    await writeFile(
        helperPath,
        "import { cycleValue } from './cycle'\nexport const sharedValue = 'figure' + cycleValue\n",
    )
    await writeFile(
        cyclePath,
        "import { sharedValue } from './shared_figure'\nexport const cycleValue = String(sharedValue.length)\n",
    )

    const outputDirectory = join(illustrationsDirectory, '_generated')
    await mkdir(outputDirectory, { recursive: true })
    for (const wrapperPath of wrapperPaths) {
        const baseName = basename(wrapperPath, '.tsx')
        await writeFile(join(outputDirectory, `${baseName}_dark.png`), 'fixture output')
        await writeFile(join(outputDirectory, `${baseName}_light.png`), 'fixture output')
    }

    return {
        runtimePath,
        wrapperPaths,
        helperPath,
        articleDirectory,
        illustrationsDirectory,
        webRoot,
    }
}

async function runCacheCheck(
    runtimePath: string,
    filePaths: string[],
    partialRun = false,
    successfulFiles?: string[],
): Promise<string[]> {
    const runtimeUrl = pathToFileURL(runtimePath).href
    const script = `
const { checkCache } = await import(${JSON.stringify(runtimeUrl)})
const result = await checkCache(${JSON.stringify(filePaths)}, { partialRun: ${partialRun} })
for (const file of ${successfulFiles ? JSON.stringify(successfulFiles) : 'result.filesToBuild'})
    result.updater.markBuilt(file)
await result.updater.save()
console.log(JSON.stringify(result.filesToBuild))
`
    const { stdout } = await execFileAsync(process.execPath, ['--input-type=module', '-e', script])
    return JSON.parse(stdout) as string[]
}

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map((directory) => rm(directory, { recursive: true, force: true })),
    )
})

describe('illustration build cache', () => {
    it('retries a failed film rebuild despite old outputs and caches successful siblings', async () => {
        const fixture = await createCacheFixture()
        const [failed, succeeded] = fixture.wrapperPaths
        const filmSource = 'export function createFilm() {}\nexport function create() {}\n'
        await writeFile(failed, filmSource)
        const output = join(fixture.illustrationsDirectory, '_generated')
        const base = basename(failed, '.tsx')
        await writeFile(join(output, `${base}_film.json`), '{}')
        for (const theme of ['dark', 'light']) {
            await writeFile(join(output, `${base}_${theme}.mp4`), 'previous movie')
            await writeFile(join(output, `${base}_${theme}.vtt`), 'WEBVTT\n')
        }
        await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths)
        await writeFile(failed, `${filmSource}export const revision = 2\n`)
        await writeFile(succeeded, 'export const revision = 2\n')

        expect(
            await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths, false, [succeeded]),
        ).toEqual(fixture.wrapperPaths)
        expect(await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths)).toEqual([failed])
        expect(await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths)).toEqual([])
    })

    it('keeps a changed framework invalidated after a failed full rebuild', async () => {
        const fixture = await createCacheFixture()
        await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths)
        await writeFile(join(fixture.webRoot, 'pnpm-lock.yaml'), 'changed framework\n')

        expect(
            await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths, false, [
                fixture.wrapperPaths[0],
            ]),
        ).toEqual(fixture.wrapperPaths)
        expect(await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths)).toEqual(
            fixture.wrapperPaths,
        )
        expect(await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths)).toEqual([])
    })

    it('keeps a changed framework invalidated after a successful partial rebuild', async () => {
        const fixture = await createCacheFixture()
        await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths)
        await writeFile(join(fixture.webRoot, 'pnpm-lock.yaml'), 'changed framework\n')

        await runCacheCheck(fixture.runtimePath, [fixture.wrapperPaths[0]], true)
        expect(await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths)).toEqual(
            fixture.wrapperPaths,
        )
    })

    it('rebuilds a film when either themed movie is missing', async () => {
        const fixture = await createCacheFixture()
        const wrapper = fixture.wrapperPaths[0]
        await writeFile(wrapper, 'export function createFilm() {}\nexport function create() {}\n')
        const output = join(fixture.illustrationsDirectory, '_generated')
        const base = basename(wrapper, '.tsx')
        await writeFile(join(output, `${base}_film.json`), '{}')
        for (const theme of ['dark', 'light'])
            await writeFile(join(output, `${base}_${theme}.mp4`), theme)
        for (const theme of ['dark', 'light'])
            await writeFile(join(output, `${base}_${theme}.vtt`), 'WEBVTT\n')
        await runCacheCheck(fixture.runtimePath, [wrapper])
        expect(await runCacheCheck(fixture.runtimePath, [wrapper])).toEqual([])
        await rm(join(output, `${base}_light.mp4`))
        expect(await runCacheCheck(fixture.runtimePath, [wrapper])).toEqual([wrapper])
    })

    it('rebuilds every wrapper that imports a changed local helper, including aliases and cycles', async () => {
        const fixture = await createCacheFixture()
        const initial = await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths)
        expect(initial).toEqual(fixture.wrapperPaths)

        const unchanged = await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths)
        expect(unchanged).toEqual([])

        await writeFile(
            fixture.helperPath,
            "import { cycleValue } from './cycle'\nexport const sharedValue = 'changed' + cycleValue\n",
        )
        const helperChanged = await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths, true)
        expect(helperChanged).toEqual(fixture.wrapperPaths)

        await writeFile(
            fixture.wrapperPaths[0],
            "import { sharedValue } from '../shared_figure'\nexport const value = sharedValue + ' wrapper edit'\n",
        )
        const wrapperChanged = await runCacheCheck(fixture.runtimePath, fixture.wrapperPaths, true)
        expect(wrapperChanged).toEqual([fixture.wrapperPaths[0]])
    })

    it('fails with the importer path when a local dependency is missing', async () => {
        const fixture = await createCacheFixture()
        const missingWrapper = join(fixture.illustrationsDirectory, 'missing_dependency.tsx')
        await writeFile(
            missingWrapper,
            "import { missing } from './missing_figure'\nexport const value = missing\n",
        )

        await expect(
            runCacheCheck(fixture.runtimePath, [missingWrapper], true),
        ).rejects.toMatchObject({
            stderr: expect.stringContaining(
                'Could not resolve local illustration dependency "./missing_figure" imported from src/content/foundations/cache-fixture/illustrations/missing_dependency.tsx',
            ),
        })
    })

    it('rejects non-literal dynamic imports that cannot be tracked', async () => {
        const fixture = await createCacheFixture()
        const computedWrapper = join(fixture.illustrationsDirectory, 'computed_import.tsx')
        await writeFile(computedWrapper, "const helper = './shared_figure'\nvoid import(helper)\n")

        await expect(
            runCacheCheck(fixture.runtimePath, [computedWrapper], true),
        ).rejects.toMatchObject({
            stderr: expect.stringContaining('Illustration cache requires a literal dynamic import'),
        })
    })
})
