import React from 'react'
import { Board, CanvasItem, GraphDiagram, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 680
export const height = 640
export const alt =
    'Two computation graphs contrast a forest with boosting. In the forest, training data branches into separately fitted trees, and their scores converge on an average. In boosting, current predictions produce residuals, a tree fits those residuals, and its scaled correction is added to form the next predictions.'
export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const title = (text: string, y: number) => (
        <CanvasItem x={10} y={y} width={660} height={45}>
            <TextLabel c={c} text={text} fontSize={29} color={c.textPrimary} align="center" />
        </CanvasItem>
    )
    return (
        <Board c={c} width={width} height={height}>
            {title('Forest: learn separately, then average', 12)}
            <CanvasItem x={10} y={70} width={660} height={275}>
                <GraphDiagram
                    c={c}
                    width={660}
                    height={275}
                    layout="manual"
                    padding={10}
                    nodeWidth={140}
                    nodeHeight={68}
                    labelFontSize={24}
                    detailFontSize={22}
                    arrowSize={5}
                    nodes={[
                        {
                            id: 'data',
                            label: 'Data',
                            x: 0.08,
                            y: 0.5,
                            tone: 'blue',
                        },
                        {
                            id: 'a',
                            label: 'Tree 1',
                            x: 0.5,
                            y: 0.05,
                            tone: 'purple',
                        },
                        {
                            id: 'b',
                            label: 'Tree 2',
                            x: 0.5,
                            y: 0.5,
                            tone: 'purple',
                        },
                        {
                            id: 'c',
                            label: 'Tree 3',
                            x: 0.5,
                            y: 0.95,
                            tone: 'purple',
                        },
                        {
                            id: 'mean',
                            label: 'Average',
                            x: 0.92,
                            y: 0.5,
                            tone: 'green',
                        },
                    ]}
                    edges={['a', 'b', 'c'].flatMap((id) => [
                        {
                            from: 'data',
                            to: id,
                            fromSide: 'right' as const,
                            toSide: 'left' as const,
                            tone: 'blue' as const,
                        },
                        {
                            from: id,
                            to: 'mean',
                            fromSide: 'right' as const,
                            toSide: 'left' as const,
                            tone: 'purple' as const,
                        },
                    ])}
                />
            </CanvasItem>
            {title('Boosting: learn the next correction', 370)}
            <CanvasItem x={10} y={438} width={660} height={178}>
                <GraphDiagram
                    c={c}
                    width={660}
                    height={178}
                    layout="manual"
                    padding={4}
                    nodeWidth={135}
                    nodeHeight={92}
                    labelFontSize={24}
                    detailFontSize={23}
                    arrowSize={5}
                    nodes={[
                        {
                            id: 'f',
                            label: 'Current',
                            detail: 'F',
                            x: 0.02,
                            y: 0.45,
                            tone: 'blue',
                        },
                        {
                            id: 'r',
                            label: 'Residuals',
                            detail: 'y − F',
                            x: 0.34,
                            y: 0.45,
                            tone: 'warm',
                        },
                        {
                            id: 'h',
                            label: 'Fit tree',
                            detail: 'h',
                            x: 0.66,
                            y: 0.45,
                            tone: 'purple',
                        },
                        {
                            id: 'next',
                            label: 'Update',
                            detail: 'F + ηh',
                            x: 0.98,
                            y: 0.45,
                            tone: 'green',
                        },
                    ]}
                    edges={[
                        { from: 'f', to: 'r', tone: 'blue' },
                        { from: 'r', to: 'h', tone: 'warm' },
                        { from: 'h', to: 'next', tone: 'purple' },
                    ]}
                />
            </CanvasItem>
        </Board>
    )
}
export default create()
