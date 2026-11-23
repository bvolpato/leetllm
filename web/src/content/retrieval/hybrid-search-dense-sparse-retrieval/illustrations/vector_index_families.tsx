import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { INNER, S, at, figure, kit, label, marks, plane, row, tint } from './_kit'

export const width = 640
export const height = 620
export const alt =
    'Two panels. In the IVF panel, a query sits in one of six clusters, close to the border with the next one. Scanning one list misses the true neighbor just across the border, and scanning two lists finds it. In the HNSW panel, a walk starts at the top of three layers of nodes, hops toward the query, drops a layer, hops again, and drops to the bottom layer, where it keeps five candidates around the query.'

const CELL_W = INNER / 3
const CELL_H = 112
const MAP_H = CELL_H * 2

// Stored vectors, hand-placed so that the nearest one to the query falls across a cell border.
const POINTS = [
    [34, 30],
    [70, 88],
    [128, 26],
    [160, 84],
    [42, 62],
    [160, 40],
    [232, 28],
    [268, 70],
    [312, 20],
    [362, 88],
    [244, 46],
    [382, 102],
    [446, 22],
    [500, 22],
    [590, 30],
    [590, 74],
    [470, 44],
    [556, 42],
    [30, 146],
    [84, 196],
    [150, 138],
    [176, 204],
    [52, 206],
    [128, 202],
    [226, 146],
    [270, 206],
    [338, 138],
    [384, 196],
    [240, 186],
    [350, 176],
    [430, 142],
    [478, 204],
    [560, 144],
    [596, 200],
    [452, 180],
    [530, 192],
] as const
const CENTERS = [
    [102, 56],
    [308, 56],
    [513, 56],
    [102, 168],
    [308, 168],
    [513, 168],
] as const
const QUERY = { x: 394, y: 56 }
const NEAREST = { x: 424, y: 52 }

const LAYER_X = 118
const LAYERS = [
    { name: 'Layer 2', note: 'long hops', y: 26, xs: [148, 388, 576] },
    { name: 'Layer 1', note: '', y: 104, xs: [148, 256, 388, 478, 576] },
    {
        name: 'Layer 0',
        note: 'every vector',
        y: 182,
        xs: [148, 200, 256, 310, 350, 388, 418, 448, 478, 518, 576, 606],
    },
] as const
const WALK_Q = 440
const KEPT = [388, 418, 448, 478, 518]

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const head = (title: string, knob: string) =>
        row(
            <>
                {label(k, title, { weight: 600 })}
                {label(k, knob, { size: S, color: k.mid, mono: true, align: 'right' })}
            </>,
            { justifyContent: 'space-between', width: INNER },
        )
    return figure(
        k,
        <>
            {head('IVF: scan only the nearest lists', 'knob: probes')}
            {plane(
                INNER,
                MAP_H,
                <>
                    {at(CELL_W, 0, null, {
                        width: CELL_W,
                        height: CELL_H,
                        backgroundColor: tint(k.data, 0.26),
                    })}
                    {at(CELL_W * 2, 0, null, {
                        width: CELL_W,
                        height: CELL_H,
                        backgroundColor: tint(k.data, 0.1),
                    })}
                    {marks(
                        INNER,
                        MAP_H,
                        <>
                            <rect
                                x={0.5}
                                y={0.5}
                                width={INNER - 1}
                                height={MAP_H - 1}
                                fill="none"
                                stroke={k.line}
                                strokeWidth={1}
                            />
                            <path
                                d={`M${CELL_W} 0 V${MAP_H} M${CELL_W * 2} 0 V${MAP_H} M0 ${CELL_H} H${INNER}`}
                                stroke={k.line}
                                strokeWidth={1.25}
                            />
                            {POINTS.map(([x, y], i) => (
                                <circle key={i} cx={x} cy={y} r={3.5} fill={k.mid} />
                            ))}
                            {CENTERS.map(([x, y], i) => (
                                <rect
                                    key={i}
                                    x={x - 6}
                                    y={y - 6}
                                    width={12}
                                    height={12}
                                    fill={k.data}
                                    transform={`rotate(45 ${x} ${y})`}
                                />
                            ))}
                            <circle cx={NEAREST.x} cy={NEAREST.y} r={6} fill={k.go} />
                            <circle cx={QUERY.x} cy={QUERY.y} r={7} fill={k.model} />
                        </>,
                    )}
                    {at(
                        QUERY.x - 58,
                        QUERY.y - 34,
                        label(k, 'query', {
                            size: S,
                            weight: 600,
                            color: k.model,
                            width: 52,
                            align: 'right',
                        }),
                    )}
                    {at(
                        NEAREST.x - 6,
                        NEAREST.y + 9,
                        label(k, 'true neighbor', {
                            size: S,
                            weight: 600,
                            color: k.go,
                            width: 126,
                        }),
                    )}
                    {at(
                        CELL_W + 8,
                        CELL_H - 27,
                        label(k, 'probes = 1', { size: S, weight: 600, color: k.data, width: 120 }),
                    )}
                    {at(
                        CELL_W * 2 + 8,
                        CELL_H - 27,
                        label(k, 'probes = 2 adds this', {
                            size: S,
                            weight: 600,
                            color: k.data,
                            width: 190,
                        }),
                    )}
                    {at(
                        CENTERS[3][0] + 12,
                        CENTERS[3][1] - 12,
                        label(k, 'center', { size: S, color: k.data, width: 60 }),
                    )}
                </>,
            )}
            <div style={{ display: 'flex', height: 8 }} />
            {head('HNSW: walk from coarse to fine', 'knob: ef_search')}
            {plane(
                INNER,
                256,
                <>
                    {marks(
                        INNER,
                        256,
                        <>
                            <path
                                d={`M${WALK_Q} 30 V206`}
                                stroke={k.model}
                                strokeWidth={1}
                                strokeDasharray="3 4"
                                opacity={0.7}
                            />
                            {LAYERS.map((layer) => (
                                <path
                                    key={layer.name}
                                    d={`M${layer.xs[0]} ${layer.y} H${layer.xs[layer.xs.length - 1]}`}
                                    stroke={k.line}
                                    strokeWidth={1.5}
                                />
                            ))}
                            {LAYERS.flatMap((layer) =>
                                layer.xs.map((x) => (
                                    <circle
                                        key={`${layer.name}${x}`}
                                        cx={x}
                                        cy={layer.y}
                                        r={5.5}
                                        fill={k.mid}
                                    />
                                )),
                            )}
                            <path d={`M148 ${LAYERS[0].y} H380`} stroke={k.model} strokeWidth={3} />
                            <path
                                d={`M388 ${LAYERS[0].y} V${LAYERS[1].y - 8}`}
                                stroke={k.model}
                                strokeWidth={2}
                                strokeDasharray="5 4"
                            />
                            <path d={`M388 ${LAYERS[1].y} H470`} stroke={k.model} strokeWidth={3} />
                            <path
                                d={`M478 ${LAYERS[1].y} V${LAYERS[2].y - 12}`}
                                stroke={k.model}
                                strokeWidth={2}
                                strokeDasharray="5 4"
                            />
                            <circle cx={148} cy={LAYERS[0].y} r={7} fill={k.model} />
                            <circle cx={388} cy={LAYERS[0].y} r={7} fill={k.model} />
                            <circle cx={388} cy={LAYERS[1].y} r={7} fill={k.model} />
                            <circle cx={478} cy={LAYERS[1].y} r={7} fill={k.model} />
                            {KEPT.map((x) => (
                                <circle
                                    key={x}
                                    cx={x}
                                    cy={LAYERS[2].y}
                                    r={9.5}
                                    fill="none"
                                    stroke={k.data}
                                    strokeWidth={2}
                                />
                            ))}
                            <circle cx={448} cy={LAYERS[2].y} r={6.5} fill={k.go} />
                            <path
                                d={`M${KEPT[0] - 11} 204 V212 H${KEPT[4] + 11} V204`}
                                stroke={k.data}
                                strokeWidth={1.5}
                                fill="none"
                            />
                        </>,
                    )}
                    {LAYERS.map((layer) =>
                        at(
                            0,
                            layer.y - 12,
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {label(k, layer.name, { size: S, weight: 600, width: 116 })}
                                {layer.note
                                    ? label(k, layer.note, { size: S, color: k.mid, width: 116 })
                                    : null}
                            </div>,
                        ),
                    )}
                    {at(
                        148 - 8,
                        LAYERS[0].y + 12,
                        label(k, 'enter here', {
                            size: S,
                            color: k.model,
                            weight: 600,
                            width: 100,
                        }),
                    )}
                    {at(
                        WALK_Q - 26,
                        LAYERS[0].y - 26,
                        label(k, 'query', {
                            size: S,
                            color: k.model,
                            weight: 600,
                            width: 56,
                            align: 'center',
                        }),
                    )}
                    {at(
                        WALK_Q + 44,
                        LAYERS[1].y + 14,
                        label(k, 'drop a layer', { size: S, color: k.model, width: 120 }),
                    )}
                    {at(
                        KEPT[0] - 60,
                        218,
                        label(k, 'ef_search = 5 keeps these', {
                            size: S,
                            color: k.data,
                            weight: 600,
                            width: 250,
                            align: 'center',
                        }),
                    )}
                    {at(148, 225, null, {
                        width: 11,
                        height: 11,
                        borderRadius: 6,
                        backgroundColor: k.go,
                    })}
                    {at(
                        164,
                        218,
                        label(k, 'true neighbor', {
                            size: S,
                            color: k.go,
                            weight: 600,
                            width: 126,
                        }),
                    )}
                </>,
            )}
        </>,
        8,
    )
}
export default create('dark')
