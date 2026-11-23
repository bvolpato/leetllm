import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'
export const width = 560
export const height = 608
export const alt =
    'A three-role by four-document grant matrix within one tenant. The highlighted operations row can read the tenant-wide incident SOP and ops escalation rules. Security can read the incident SOP and key rotation. Executives can read the incident SOP and acquisition plan. All remaining intersections are blocked. Public here means authenticated employees in the same tenant.'
export const numericFixture = {
    documents: [
        'incident-checklist',
        'ops-runbook-faq',
        'key-rotation-runbook',
        'acquisition-plan',
    ],
    roles: [
        { label: 'ops', grants: ['ops-team'], allowed: [true, true, false, false] },
        { label: 'security', grants: ['security-team'], allowed: [true, false, true, false] },
        { label: 'exec', grants: ['executives'], allowed: [true, false, false, true] },
    ],
}
function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size = 22,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
        }),
    })
}
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const pass = getReadableToneColor('green', c),
        deny = getReadableToneColor('critical', c),
        selected = getReadableToneColor('blue', c)
    const centers = [156, 268, 380, 492],
        rows = [256, 346, 436]
    const mark = (x: number, y: number, allowed: boolean) =>
        allowed
            ? createElement('path', {
                  d: `M ${x - 13} ${y} L ${x - 3} ${y + 10} L ${x + 16} ${y - 13}`,
                  fill: 'none',
                  stroke: pass,
                  strokeWidth: 4,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
              })
            : createElement(
                  'g',
                  null,
                  createElement('rect', {
                      x: x - 12,
                      y: y - 1,
                      width: 24,
                      height: 22,
                      rx: 4,
                      fill: 'none',
                      stroke: deny,
                      strokeWidth: 2.6,
                  }),
                  createElement('path', {
                      d: `M ${x - 8} ${y - 1} V ${y - 9} C ${x - 8} ${y - 21}, ${x + 8} ${y - 21}, ${x + 8} ${y - 9} V ${y - 1}`,
                      fill: 'none',
                      stroke: deny,
                      strokeWidth: 2.6,
                  }),
              )
    const geometry = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        SvgFrame({
            c,
            x: 14,
            y: 214,
            width: 532,
            height: 82,
            rx: 10,
            fill: c.bgSubtle,
            stroke: selected,
            strokeWidth: 2,
        }),
        ...numericFixture.roles.flatMap((role, i) =>
            role.allowed.flatMap((allowed, j) => [
                SvgFrame({
                    c,
                    x: centers[j] - 32,
                    y: rows[i] - 32,
                    width: 64,
                    height: 64,
                    rx: 9,
                    fill: c.bgSubtle,
                    stroke: allowed ? pass : deny,
                    strokeWidth: 1.5,
                }),
                mark(centers[j], rows[i], allowed),
            ]),
        ),
        mark(108, 518, true),
        mark(330, 518, false),
    )
    const labels = [
        label(c, 'Tenant A · operations row highlighted', 18, 54, 524, 30, 20, selected, 'center'),
        ...[
            ['Incident', 'SOP'],
            ['Ops', 'rules'],
            ['Key', 'rotation'],
            ['Acquisition', 'plan'],
        ].flatMap((words, i) => [
            label(c, words[0], centers[i] - 55, 130, 110, 28, 20, c.textPrimary, 'center'),
            label(c, words[1], centers[i] - 55, 164, 110, 28, 22, c.textPrimary, 'center'),
        ]),
        ...numericFixture.roles.map((role, i) =>
            label(
                c,
                role.label,
                16,
                rows[i] - 14,
                82,
                30,
                20,
                i === 0 ? selected : c.textPrimary,
                'center',
            ),
        ),
        label(c, 'grant', 140, 506, 126, 30, 22, pass),
        label(c, 'blocked', 362, 506, 164, 30, 22, deny),
        label(
            c,
            'Tenant-wide: authenticated staff in this tenant',
            20,
            564,
            520,
            30,
            20,
            c.textSecondary,
            'center',
        ),
    ]
    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [CanvasItem({ x: 0, y: 0, width, height, children: geometry }), ...labels],
        }),
    })
}
export default create('dark')
