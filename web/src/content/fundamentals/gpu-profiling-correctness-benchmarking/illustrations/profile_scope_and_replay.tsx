import React from 'react'
import { Card, Flow, Scene, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 850
export const height = 800
export const alt =
    'A request-level Nsight Systems view orders CPU preparation, transfer, a kernel hotspot, and synchronization, with measured stream spans rather than synthetic numbers. In Nsight Compute kernel replay, all GPU memory accessible to the kernel is saved before pass one. That pass runs after a cache flush, then the profiler identifies the memory the kernel wrote. Before each later pass, Nsight Compute restores the original contents of that written subset, flushes GPU caches, and reruns the kernel for more counters. Kernel launches are serialized for isolated collection, while warps and memory-controller queues remain concurrent. A separate normal application workload holds its same-buffer or rotated-buffer cache policy constant. Clean CUDA-event latency and Compute Sanitizer run separately.'

const W = 800

function text(
    c: ReturnType<typeof getThemeColors>,
    color = c.textPrimary,
    size = 30,
): React.CSSProperties {
    return { color, fontFamily: c.fontSans, fontSize: size, lineHeight: 1.15 }
}

function stageTitle(c: ReturnType<typeof getThemeColors>, label: string) {
    return (
        <span
            style={{
                color: c.textPrimary,
                fontFamily: c.fontSans,
                fontSize: 30,
                fontWeight: 800,
                lineHeight: 1.15,
            }}
        >
            {label}
        </span>
    )
}

function stageDetail(c: ReturnType<typeof getThemeColors>, label: string) {
    return (
        <span
            style={{
                color: c.textSecondary,
                fontFamily: c.fontSans,
                fontSize: 28,
                fontWeight: 650,
                lineHeight: 1.15,
            }}
        >
            {label}
        </span>
    )
}

function makeFigure(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const overview = Flow({
        c,
        direction: 'horizontal',
        gap: 10,
        connectorLength: 18,
        connectorTone: 'cyan',
        stages: [
            {
                title: stageTitle(c, 'CPU'),
                subtitle: stageDetail(c, 'prep'),
                tone: 'warm',
                width: 147,
                minHeight: 56,
            },
            {
                title: stageTitle(c, 'Copy'),
                subtitle: stageDetail(c, 'H ↔ D'),
                tone: 'cyan',
                width: 147,
                minHeight: 56,
            },
            {
                title: stageTitle(c, 'Kernel'),
                subtitle: stageDetail(c, 'GPU'),
                tone: 'purple',
                width: 147,
                minHeight: 56,
            },
            {
                title: stageTitle(c, 'Sync'),
                subtitle: stageDetail(c, 'wait'),
                tone: 'green',
                width: 147,
                minHeight: 56,
            },
        ],
    })
    const firstPass = Flow({
        c,
        direction: 'horizontal',
        gap: 8,
        connectorLength: 14,
        connectorTone: 'warm',
        stages: [
            {
                title: stageTitle(c, 'Save all'),
                subtitle: stageDetail(c, 'accessible memory'),
                tone: 'purple',
                width: 232,
                minHeight: 52,
            },
            {
                title: stageTitle(c, 'Flush caches'),
                subtitle: stageDetail(c, 'before each pass'),
                tone: 'warm',
                width: 232,
                minHeight: 52,
            },
            {
                title: stageTitle(c, 'Run pass 1'),
                subtitle: stageDetail(c, 'identify writes after'),
                tone: 'cyan',
                width: 232,
                minHeight: 52,
            },
        ],
    })
    const laterPasses = Flow({
        c,
        direction: 'horizontal',
        gap: 8,
        connectorLength: 14,
        connectorTone: 'warm',
        stages: [
            {
                title: stageTitle(c, 'Restore writes'),
                subtitle: stageDetail(c, 'original bytes'),
                tone: 'purple',
                width: 338,
                minHeight: 52,
            },
            {
                title: stageTitle(c, 'Flush caches'),
                subtitle: stageDetail(c, 'run next pass'),
                tone: 'cyan',
                width: 338,
                minHeight: 52,
            },
        ],
    })

    return Scene({
        c,
        padding: 4,
        gap: 2,
        contentWidth: W,
        align: 'stretch',
        children: (
            <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: W }}>
                    <div style={{ ...text(c, c.textPrimary, 36), fontWeight: 760 }}>
                        Follow a request to its hotspot
                    </div>
                    <div style={{ ...text(c, c.textSecondary, 28), fontWeight: 550 }}>
                        Systems maps a request; Compute inspects one kernel.
                    </div>
                </div>
                <Card c={c} width={780} padding={5} borderColor={c.primary}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 3,
                        }}
                    >
                        <div
                            style={{
                                ...text(c, c.textPrimary, 28),
                                fontFamily: c.fontSans,
                                fontWeight: 800,
                            }}
                        >
                            NSIGHT SYSTEMS · REQUEST ORDER
                        </div>
                        {overview}
                    </div>
                </Card>
                <Card c={c} width={780} padding={5} borderColor={c.warning}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 3,
                            width: '100%',
                        }}
                    >
                        <div style={{ ...text(c, c.textPrimary, 28), fontWeight: 800 }}>
                            NSIGHT COMPUTE · KERNEL REPLAY
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                width: '100%',
                            }}
                        >
                            <div style={{ ...text(c, c.textSecondary, 28), fontWeight: 800 }}>
                                FIRST PASS
                            </div>
                            {firstPass}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                width: '100%',
                            }}
                        >
                            <div style={{ ...text(c, c.textSecondary, 28), fontWeight: 800 }}>
                                BEFORE EACH LATER PASS
                            </div>
                            {laterPasses}
                        </div>
                        <div style={{ ...text(c, c.textPrimary, 28), fontWeight: 750 }}>
                            launches serialized · warps and queues concurrent
                        </div>
                    </div>
                </Card>
                <Card c={c} width={780} padding={5} borderColor={c.info}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 3,
                            width: '100%',
                        }}
                    >
                        <div style={{ ...text(c, c.info, 28), fontWeight: 800 }}>
                            NORMAL APPLICATION · UNPROFILED CACHE POLICY
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 12,
                                width: '100%',
                            }}
                        >
                            <PolicyToken c={c} label="same buffers" tone={c.info} />
                            <span style={{ ...text(c, c.textSecondary, 28), fontWeight: 700 }}>
                                or
                            </span>
                            <PolicyToken c={c} label="rotated set" tone={c.warning} />
                            <span style={{ ...text(c, c.textPrimary, 28), fontWeight: 650 }}>
                                fixed across runs
                            </span>
                        </div>
                    </div>
                </Card>
                <Card c={c} width={780} padding={5} borderColor={c.positive}>
                    <div
                        style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}
                    >
                        <div style={{ ...text(c, c.textPrimary, 28), fontWeight: 800 }}>
                            CLEAN EVENTS · PROFILER OFF · SANITIZER OFF
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 15,
                                width: '100%',
                            }}
                        >
                            <span
                                style={{
                                    ...text(c, c.textPrimary, 28),
                                    fontFamily: c.fontMono,
                                    fontWeight: 750,
                                }}
                            >
                                event start
                            </span>
                            <span style={{ ...text(c, c.textSecondary, 28), fontWeight: 700 }}>
                                →
                            </span>
                            <span
                                style={{
                                    ...text(c, c.textPrimary, 28),
                                    fontFamily: c.fontMono,
                                    fontWeight: 750,
                                }}
                            >
                                kernel
                            </span>
                            <span style={{ ...text(c, c.textSecondary, 28), fontWeight: 700 }}>
                                →
                            </span>
                            <span
                                style={{
                                    ...text(c, c.textPrimary, 28),
                                    fontFamily: c.fontMono,
                                    fontWeight: 750,
                                }}
                            >
                                stop + wait
                            </span>
                        </div>
                    </div>
                </Card>
            </>
        ),
    })
}

function PolicyToken({
    c,
    label,
    tone,
}: {
    c: ReturnType<typeof getThemeColors>
    label: string
    tone: string
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 220,
                height: 42,
                padding: '0 5px',
                boxSizing: 'border-box',
                border: `2px solid ${tone}`,
                borderRadius: 8,
                color: c.textPrimary,
                fontFamily: c.fontSans,
                fontSize: 28,
                fontWeight: 700,
            }}
        >
            {label}
        </div>
    )
}

export function create(theme: ThemeMode = 'dark') {
    return makeFigure(theme)
}

export default create('dark')
