import { access, mkdir, realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { formatIllustration } from './format'

export function figureSource(kind: 'layout' | 'plot'): string {
    const imports =
        kind === 'layout'
            ? 'Column, Row, Scene, StackedBar, TextLabel'
            : 'AxisPlot, Column, Row, Scene, TextLabel'
    const picture =
        kind === 'layout'
            ? `
function MemoryBudget({ c }: { c: ThemeColors }) {
    const used = MODEL.weights + MODEL.cache
    return <Column gap={20}>
        <StackedBar c={c} width={600} height={90} showLegend={false} segments={[
            { label: 'weights', value: MODEL.weights, color: 'primary', valueLabel: '' },
            { label: 'cache', value: MODEL.cache, color: 'positive', valueLabel: '' },
            { label: 'free', value: MODEL.capacity - used, color: 'neutral', valueLabel: '' },
        ]} />
        <Row width={600} justify="space-between">
            <TextLabel c={c} text={'weights ' + MODEL.weights + ' GiB'} fontSize={28} />
            <TextLabel c={c} text={'cache ' + MODEL.cache + ' GiB'} fontSize={28} />
            <TextLabel c={c} text={'free ' + (MODEL.capacity - used) + ' GiB'} fontSize={28} />
        </Row>
        <TextLabel c={c} text={used + ' GiB used / ' + MODEL.capacity + ' GiB capacity'} fontSize={28} />
    </Column>
}
`
            : `
function CapacityPlot({ c }: { c: ThemeColors }) {
    const points = [0, 1, 2, 3, 4].map(sessions => ({
        x: sessions,
        y: MODEL.weights + sessions * MODEL.cache,
    }))
    return <Column gap={20}>
        <TextLabel c={c} text="Memory on one 0–10 GiB scale" fontSize={28} />
        <AxisPlot c={c} width={600} height={320}
            xMin={0} xMax={4} yMin={0} yMax={MODEL.capacity}
            paths={[{ points, tone: 'blue' }]} points={points} />
        <Row width={600} justify="space-between">
            <TextLabel c={c} width={280} text={'0 sessions: ' + points[0].y + ' GiB'} fontSize={28} />
            <TextLabel c={c} width={280} align="right" text={'4 sessions: ' + points[4].y + ' GiB'} fontSize={28} />
        </Row>
    </Column>
}
`
    return `import React from 'react'\nimport { ${imports}, defineIllustration, type ThemeColors } from 'vizmatic'

export const width = 660
export const height = ${kind === 'layout' ? 280 : 500}
export const alt = '${kind === 'layout' ? 'Weights occupy 4 GiB and cache occupies 2 GiB of a 10 GiB capacity, leaving 4 GiB free.' : 'Memory grows from 4 to 8 GiB as sessions increase from zero to four, using 1 GiB of cache per session on the same scale.'}'

// Replace the example with computed values from this article's worked case.
export const MODEL = { weights: 4, cache: ${kind === 'layout' ? 2 : 1}, capacity: 10 } as const
${picture}
const illustration = defineIllustration(c => (
    <Scene c={c} padding={20} contentWidth={620}>
        <${kind === 'layout' ? 'MemoryBudget' : 'CapacityPlot'} c={c} />
    </Scene>
))

export const create = illustration.create
export default illustration.default
`
}

export async function createFigure(
    contentRoot: string,
    article: string,
    name: string,
    kind: 'layout' | 'plot',
): Promise<string> {
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(name))
        throw new Error(
            'Use a lowercase figure name with letters, numbers, underscores or hyphens.',
        )
    const root = await realpath(contentRoot)
    const directory = path.resolve(root, article)
    const relative = path.relative(root, directory)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
        throw new Error('Article must be a bundle inside src/content.')
    const articleDirectory = await realpath(directory)
    const realRelative = path.relative(root, articleDirectory)
    if (!realRelative || realRelative.startsWith('..') || path.isAbsolute(realRelative))
        throw new Error('Article must resolve inside src/content.')
    await access(path.join(articleDirectory, 'content.md'))
    const illustrationDirectory = path.join(articleDirectory, 'illustrations')
    await mkdir(illustrationDirectory, { recursive: true })
    const destinationDirectory = await realpath(illustrationDirectory)
    const destinationRelative = path.relative(articleDirectory, destinationDirectory)
    if (
        !destinationRelative ||
        destinationRelative.startsWith('..') ||
        path.isAbsolute(destinationRelative)
    )
        throw new Error('Illustrations must resolve inside their article.')
    const file = path.join(destinationDirectory, `${name}.tsx`)
    const source = await formatIllustration(figureSource(kind), file)
    await writeFile(file, source, { flag: 'wx' })
    return file
}

async function main(): Promise<void> {
    const { values } = parseArgs({
        options: {
            article: { type: 'string' },
            name: { type: 'string' },
            kind: { type: 'string', default: 'layout' },
            help: { type: 'boolean', default: false },
        },
    })
    if (values.help) {
        console.log(
            'pnpm illustrations:new --article section/slug --name figure_name [--kind layout|plot]\nCreates a readable Vizmatic example in an existing article; never overwrites a source. Replace the sample model, labels and alt text before publishing.',
        )
        return
    }
    if (!values.article || !values.name || !['layout', 'plot'].includes(values.kind))
        throw new Error('Supply --article, --name and --kind layout|plot.')
    const content = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/content')
    console.log(
        await createFigure(content, values.article, values.name, values.kind as 'layout' | 'plot'),
    )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
}
