import {
    GraphDiagram,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    renderToPngWithOutput,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'MCP and Tool Protocol Standards. A model proposal passes through a host policy gate and MCP client to a capability server that authorizes and executes. The diagram separates host policy from the shared protocol interface.'

export function create(theme: ThemeMode = 'dark') {
    const palette = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = {
        ...palette,
        textMuted: theme === 'light' ? palette.textSecondary : palette.textMuted,
    }
    return Scene({
        c,
        padding: 42,
        gap: 16,
        contentWidth: 1116,
        background: c.bg,
        children: [
            TextLabel({
                c,
                text: 'MCP & Tool Protocol Standards',
                fontSize: 54,
                fontWeight: 800,
                color: c.textPrimary,
            }),
            TextLabel({
                c,
                text: 'A shared wire protocol. Separate permission checks.',
                fontSize: 27,
                color: c.textSecondary,
            }),
            GraphDiagram({
                c,
                width: 1116,
                height: 345,
                direction: 'LR',
                rankGap: 26,
                nodeWidth: 225,
                nodeHeight: 128,
                labelFontSize: 25,
                detailFontSize: 19,
                groups: [{ id: 'host', label: 'AI HOST', tone: 'blue' }],
                nodes: [
                    {
                        id: 'model',
                        label: 'Model proposal',
                        detail: 'get_release_status',
                        group: 'host',
                        tone: 'purple',
                    },
                    {
                        id: 'policy',
                        label: 'Host policy',
                        detail: 'Allow this read?',
                        group: 'host',
                        tone: 'warm',
                    },
                    {
                        id: 'client',
                        label: 'MCP client',
                        detail: 'tools/call + metadata',
                        group: 'host',
                        tone: 'cyan',
                    },
                    {
                        id: 'server',
                        label: 'MCP server',
                        detail: 'Authorize -> execute',
                        width: 206,
                        tone: 'green',
                    },
                ],
                edges: [
                    { from: 'model', to: 'policy', tone: 'purple' },
                    { from: 'policy', to: 'client', tone: 'warm' },
                    { from: 'client', to: 'server', tone: 'cyan' },
                ],
            }),
            Row({
                width: 1116,
                justify: 'space-between',
                children: [
                    TextLabel({
                        c,
                        text: 'DISCOVER  /  LIST  /  CALL',
                        fontSize: 20,
                        color: c.textSecondary,
                    }),
                    TextLabel({
                        c,
                        text: 'LeetLLM',
                        fontSize: 28,
                        fontWeight: 800,
                        color: c.textPrimary,
                    }),
                ],
            }),
        ],
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(
            `Expected ${width}x${height}; got ${result.pixelWidth}x${result.pixelHeight}`,
        )
    }
    return result
}

export default create()
