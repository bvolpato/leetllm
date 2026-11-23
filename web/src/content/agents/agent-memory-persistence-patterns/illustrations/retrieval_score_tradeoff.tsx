import React from 'react'
import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneColor,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 640
export const height = 670
export const alt =
    'Weighted memory retrieval combines 0.50 similarity, 0.30 recency, and 0.20 importance. Record A totals 0.8817 and outranks older record B at 0.6100 even though B has higher semantic similarity.'

interface ScoreSpec {
    title: string
    tone: 'green' | 'warm'
    total: string
    sim: number
    rec: number
    imp: number
    meta: string
}

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    const simFill = getToneColor('blue', c)
    const recFill = getToneColor('green', c)
    const impFill = getToneColor('purple', c)
    const simInk = getReadableToneColor('blue', c)
    const recInk = getReadableToneColor('green', c)
    const impInk = getReadableToneColor('purple', c)

    const renderCandidate = (spec: ScoreSpec) => {
        const wSim = Math.round(spec.sim * 0.5 * 540)
        const wRec = Math.round(spec.rec * 0.3 * 540)
        const wImp = Math.round(spec.imp * 0.2 * 540)
        return Panel({
            c,
            title: `${spec.title} · Score ${spec.total}`,
            tone: spec.tone,
            width: 608,
            padding: 12,
            titleFontSize: 20,
            children: Column({
                gap: 8,
                children: [
                    TextLabel({ c, text: spec.meta, fontSize: 19, color: c.textMuted }),
                    <div
                        style={{
                            display: 'flex',
                            width: 540,
                            height: 24,
                            borderRadius: 6,
                            overflow: 'hidden',
                            backgroundColor: c.border,
                        }}
                    >
                        <div style={{ width: wSim, height: 24, backgroundColor: simFill }} />
                        <div style={{ width: wRec, height: 24, backgroundColor: recFill }} />
                        <div style={{ width: wImp, height: 24, backgroundColor: impFill }} />
                    </div>,
                    Row({
                        gap: 14,
                        children: [
                            TextLabel({
                                c,
                                text: `Sim ${(spec.sim * 0.5).toFixed(3)}`,
                                fontSize: 19,
                                color: simInk,
                            }),
                            TextLabel({
                                c,
                                text: `Rec ${(spec.rec * 0.3).toFixed(3)}`,
                                fontSize: 19,
                                color: recInk,
                            }),
                            TextLabel({
                                c,
                                text: `Imp ${(spec.imp * 0.2).toFixed(3)}`,
                                fontSize: 19,
                                color: impInk,
                            }),
                        ],
                    }),
                ],
            }),
        })
    }

    return Scene({
        c,
        title: 'Tri-Factor Retrieval Score (0.50 Sim + 0.30 Rec + 0.20 Imp)',
        padding: 16,
        gap: 10,
        contentWidth: 608,
        children: [
            Row({
                gap: 10,
                justify: 'center',
                align: 'center',
                children: [
                    BadgePill({
                        c,
                        text: 'ACL & TTL Eligible Pool',
                        tone: 'blue',
                        fontSize: 19,
                    }),
                    FlowArrow({ c, direction: 'right', length: 24, tone: 'blue' }),
                    BadgePill({
                        c,
                        text: 'Rank by Weighted Sum',
                        tone: 'green',
                        fontSize: 19,
                    }),
                ],
            }),
            renderCandidate({
                title: 'Record A (Recent trace)',
                tone: 'green',
                total: '0.8817',
                sim: 0.9,
                rec: 0.9057,
                imp: 0.8,
                meta: 'Sim 0.90 · Rec 0.906 (recent) · Imp 0.80',
            }),
            renderCandidate({
                title: 'Record B (Older trace)',
                tone: 'warm',
                total: '0.6100',
                sim: 0.95,
                rec: 0.25,
                imp: 0.3,
                meta: 'Sim 0.95 · Rec 0.250 (2 half-lives) · Imp 0.30',
            }),
            Row({
                gap: 10,
                justify: 'center',
                align: 'center',
                children: [
                    BadgePill({
                        c,
                        text: 'Rule',
                        tone: 'neutral',
                        fontSize: 19,
                    }),
                    TextLabel({
                        c,
                        text: 'Eligibility filters always run before ranking weights',
                        fontSize: 19,
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
