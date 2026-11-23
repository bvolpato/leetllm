import { GraphDiagram, Row, Scene, TextLabel, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 560
export const height = 640
export const alt =
    'Two configuration chains: checkout.toml selects payments-primary, which resolves to retired billing-v1.example; reports.toml selects payments-archive, which resolves to billing-v2.example. Service files contain references rather than endpoint URLs.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    return Scene({
        c,
        padding: 20,
        gap: 20,
        contentWidth: 520,
        children: [
            Row({
                width: 520,
                gap: 40,
                children: [
                    TextLabel({
                        c,
                        text: 'Checkout',
                        width: 240,
                        fontSize: 24,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }),
                    TextLabel({
                        c,
                        text: 'Reports',
                        width: 240,
                        fontSize: 24,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }),
                ],
            }),
            GraphDiagram({
                c,
                width: 520,
                height: 470,
                nodeWidth: 224,
                nodeHeight: 94,
                labelFontSize: 24,
                detailFontSize: 20,
                padding: 6,
                nodes: [
                    {
                        'id': 'c',
                        'label': 'checkout.toml',
                        'detail': 'service config',
                        'x': 0.02,
                        'y': 0.02,
                        'tone': 'blue',
                    },
                    {
                        'id': 'p',
                        'label': 'payments-primary',
                        'detail': 'backends.toml',
                        'x': 0.02,
                        'y': 0.5,
                        'tone': 'purple',
                    },
                    {
                        'id': 'v1',
                        'label': 'billing-v1.example',
                        'detail': 'retired endpoint',
                        'x': 0.02,
                        'y': 0.98,
                        'tone': 'critical',
                    },
                    {
                        'id': 'r',
                        'label': 'reports.toml',
                        'detail': 'service config',
                        'x': 0.98,
                        'y': 0.02,
                        'tone': 'blue',
                    },
                    {
                        'id': 'a',
                        'label': 'payments-archive',
                        'detail': 'backends.toml',
                        'x': 0.98,
                        'y': 0.5,
                        'tone': 'purple',
                    },
                    {
                        'id': 'v2',
                        'label': 'billing-v2.example',
                        'detail': 'other endpoint',
                        'x': 0.98,
                        'y': 0.98,
                        'tone': 'neutral',
                    },
                ],
                edges: [
                    { 'from': 'c', 'to': 'p' },
                    { 'from': 'p', 'to': 'v1', 'tone': 'critical' },
                    { 'from': 'r', 'to': 'a' },
                    { 'from': 'a', 'to': 'v2', 'tone': 'neutral' },
                ],
            }),
        ],
    })
}

export default create('dark')
