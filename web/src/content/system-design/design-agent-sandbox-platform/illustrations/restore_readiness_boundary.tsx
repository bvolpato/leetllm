import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'A clean template is built before tenant work: boot the pinned guest and runtime, observe the supervisor ready, pause and snapshot, then seal consistent memory, versioned state, and disk artifacts. A new generation loads those verified artifacts paused with private mappings. The snapshot API response marks state loaded. The supervisor then resumes only for readiness while user work remains withheld. Generation-bound control, clock, kernel RNG, application state, network, host limits, and ownership checks form an admission gate. Missing or failed checks hold resources and keep admission closed. Successful required checks admit the first user instruction. The 15 ms p99 is a declared design target from gateway acceptance through placement, queueing, restore, and readiness, not measured stage timings.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const templateTone = getReadableToneColor('blue', c, c.bg)
    const restoreTone = getReadableToneColor('purple', c, c.bg)
    const checkTone = getReadableToneColor('warm', c, c.bg)
    const okTone = getReadableToneColor('green', c, c.bg)
    const failTone = getReadableToneColor('critical', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 18,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={Math.ceil(fontSize * 1.35)}>
            <TextLabel
                c={c}
                text={text}
                fontSize={fontSize}
                color={color}
                width="100%"
                align={align}
                fontWeight={weight}
            />
        </CanvasItem>
    )

    const checks = [
        'Clock / PTP sync',
        'Kernel RNG reseed',
        'App state tokens',
        'Netns & TAP routing',
        'Generation ID match',
        'cgroup & PID limits',
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Col 1: Template Sealing */}
                    <rect
                        x={24}
                        y={60}
                        width={240}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={110}
                        width={216}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={templateTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={225}
                        width={216}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={templateTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={340}
                        width={216}
                        height={120}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Col 2: Fast Paused Restore */}
                    <rect
                        x={288}
                        y={60}
                        width={240}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={300}
                        y={110}
                        width={216}
                        height={160}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={restoreTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={300}
                        y={285}
                        width={216}
                        height={175}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={restoreTone}
                        strokeWidth={1.5}
                    />

                    {/* Col 3: Readiness Gate */}
                    <rect
                        x={552}
                        y={60}
                        width={284}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    {/* Checks Grid */}
                    {checks.map((_, i) => {
                        const cy = 110 + i * 40
                        return (
                            <rect
                                key={i}
                                x={564}
                                y={cy}
                                width={260}
                                height={34}
                                rx={4}
                                fill={c.bgCardAlt}
                                stroke={checkTone}
                                strokeWidth={1}
                            />
                        )
                    })}
                    {/* Outcome boxes */}
                    <rect
                        x={564}
                        y={360}
                        width={124}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={failTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={700}
                        y={360}
                        width={124}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={okTone}
                        strokeWidth={1.5}
                    />

                    {/* Connectors */}
                    <line x1={252} y1={275} x2={300} y2={275} stroke={stroke} strokeWidth={1.5} />
                    <line x1={516} y1={275} x2={564} y2={275} stroke={stroke} strokeWidth={1.5} />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Sandbox Template Sealing, Restore & Readiness Admission Gate',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Col 1 */}
            {label(36, 75, 216, '1. Template Sealing (Offline)', 16, templateTone, 'left', 700)}
            {label(48, 120, 192, 'Boot & Pre-warm', 14, templateTone, 'left', 650)}
            {label(48, 142, 192, '• Boot pinned Linux kernel', 12, c.textMuted)}
            {label(48, 160, 192, '• Pre-warm Python/Node runtime', 12, c.textMuted)}
            {label(48, 178, 192, '• Supervisor ready signal', 12, c.textMuted)}

            {label(48, 235, 192, 'Pause & Snapshot', 14, templateTone, 'left', 650)}
            {label(48, 257, 192, '• Firecracker pause API', 12, c.textMuted)}
            {label(48, 275, 192, '• Dump guest memory dump', 12, c.textMuted)}
            {label(48, 293, 192, '• Save vCPU register state', 12, c.textMuted)}

            {label(48, 350, 192, 'Immutable Artifacts', 14, c.textPrimary, 'left', 650)}
            {label(48, 372, 192, '• base.mem (sealed RO)', 12, c.textMuted)}
            {label(48, 390, 192, '• vmstate.json (pinned)', 12, c.textMuted)}
            {label(48, 408, 192, '• rootfs.ext4 (golden base)', 12, c.textMuted)}
            {label(48, 432, 192, 'Built before any tenant data', 11, templateTone, 'left', 600)}

            {/* Col 2 */}
            {label(300, 75, 216, '2. Paused Restore (<5ms)', 16, restoreTone, 'left', 700)}
            {label(312, 120, 192, 'Fast Memory Mapping', 14, restoreTone, 'left', 650)}
            {label(312, 142, 192, '• mmap(MAP_PRIVATE, base.mem)', 12, c.textMuted)}
            {label(312, 162, 192, '• COW: zero page copying', 12, c.textMuted)}
            {label(312, 182, 192, '• Restore vCPU state struct', 12, c.textMuted)}
            {label(312, 202, 192, '• Attach private scratch disk', 12, c.textMuted)}
            {label(312, 230, 192, 'Guest restored in PAUSED state', 12, restoreTone, 'left', 600)}

            {label(312, 295, 192, 'Supervisor Resume', 14, restoreTone, 'left', 650)}
            {label(312, 320, 192, '• Hypervisor resumes vCPU', 12, c.textMuted)}
            {label(312, 342, 192, '• Internal agent runs checks', 12, c.textMuted)}
            {label(312, 364, 192, '• User requests WITHHELD', 13, failTone, 'left', 600)}
            {label(
                312,
                390,
                192,
                'Target: ≤ 15 ms p99 from gateway to first instruction',
                11,
                c.textPrimary,
                'left',
                600,
            )}

            {/* Col 3 */}
            {label(564, 75, 260, '3. Readiness Admission Gate', 16, checkTone, 'left', 700)}
            {checks.map((chk, i) => (
                <React.Fragment key={chk}>
                    {label(576, 118 + i * 40, 240, `✓ ${chk}`, 13, c.textPrimary, 'left', 600)}
                </React.Fragment>
            ))}

            {/* Fail outcome */}
            {label(572, 370, 108, 'Any Check Fails', 12, failTone, 'center', 700)}
            {label(572, 395, 108, 'Hold user work', 11, c.textMuted, 'center')}
            {label(572, 415, 108, 'Admission closed', 11, c.textMuted, 'center')}
            {label(572, 435, 108, 'Recycle VM', 11, failTone, 'center', 600)}

            {/* Pass outcome */}
            {label(708, 370, 108, 'All Checks Pass', 12, okTone, 'center', 700)}
            {label(708, 395, 108, 'Arm ingress gate', 11, c.textMuted, 'center')}
            {label(708, 415, 108, 'Admit first task', 11, c.textMuted, 'center')}
            {label(708, 435, 108, 'Execution begins', 11, okTone, 'center', 600)}
        </Board>
    )
}

export default create('dark')
