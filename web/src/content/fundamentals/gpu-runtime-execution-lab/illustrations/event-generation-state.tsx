import React from 'react'
import { Scene, defineIllustration } from 'vizmatic'
import {
    arrow,
    boundedMonoLabel,
    label,
    readableTone,
    roundedPanel,
    svgLayer,
    themeText,
    type FigureBounds,
} from './lab-figure-utils'

export const width = 1120
export const height = 900
export const alt =
    'Two stream sequences show event state at each wait call. Recording ready after copy gives the compute wait a dependency on event state E1. A wait before the first record sees empty state E0; the later E1 record does not attach to that earlier call, so affine work may overlap the copy.'

const illustration = defineIllustration((c) => {
    const text = themeText(c)
    const copyTone = readableTone('blue', c)
    const eventTone = readableTone('green', c)
    const waitTone = readableTone('purple', c)
    const apiTone = readableTone('warm', c)
    const panels: FigureBounds[] = [
        { x: 36, y: 118, width: 508, height: 730 },
        { x: 576, y: 118, width: 508, height: 730 },
    ]
    const leftRecord = { x: 74, y: 232, width: 164, height: 62 }
    const leftWaitApi = { x: 342, y: 232, width: 164, height: 62 }
    const rightWaitApi = { x: 614, y: 232, width: 164, height: 62 }
    const rightRecord = { x: 882, y: 232, width: 164, height: 62 }
    const leftEvent = { x: 74, y: 422, width: 230, height: 66 }
    const leftCopy = { x: 334, y: 422, width: 172, height: 66 }
    const rightEvent = { x: 614, y: 422, width: 230, height: 66 }
    const rightCopy = { x: 874, y: 422, width: 162, height: 66 }
    const leftWait = { x: 74, y: 590, width: 230, height: 66 }
    const leftAffine = { x: 334, y: 590, width: 172, height: 66 }
    const rightWait = { x: 614, y: 590, width: 230, height: 66 }
    const rightAffine = { x: 874, y: 590, width: 162, height: 66 }

    const shapes = [
        ...panels.map((bounds, index) =>
            roundedPanel(c, 'event-order-case-' + index, bounds, c.bgSubtle, c.borderSubtle, 24),
        ),
        roundedPanel(c, 'left-record-api', leftRecord, apiTone, apiTone, 12),
        roundedPanel(c, 'left-wait-api', leftWaitApi, waitTone, waitTone, 12),
        roundedPanel(c, 'right-wait-api', rightWaitApi, waitTone, waitTone, 12),
        roundedPanel(c, 'right-record-api', rightRecord, apiTone, apiTone, 12),
        roundedPanel(c, 'left-event-state', leftEvent, eventTone, eventTone, 18),
        roundedPanel(c, 'left-copy-operation', leftCopy, copyTone, copyTone, 14),
        roundedPanel(c, 'right-event-state', rightEvent, eventTone, eventTone, 18),
        roundedPanel(c, 'right-copy-operation', rightCopy, copyTone, copyTone, 14),
        roundedPanel(c, 'left-consumer-wait', leftWait, waitTone, waitTone, 14),
        roundedPanel(c, 'left-affine-operation', leftAffine, eventTone, eventTone, 14),
        roundedPanel(c, 'right-empty-wait', rightWait, c.bg, c.borderLight, 14),
        roundedPanel(c, 'right-affine-operation', rightAffine, eventTone, eventTone, 14),
        arrow('left-api-order', leftRecord.x + leftRecord.width, 263, leftWaitApi.x, 263, text, 4),
        arrow(
            'right-api-order',
            rightWaitApi.x + rightWaitApi.width,
            263,
            rightRecord.x,
            263,
            text,
            4,
        ),
        arrow(
            'copy-to-recorded-event',
            leftCopy.x,
            455,
            leftEvent.x + leftEvent.width,
            455,
            eventTone,
            4,
        ),
        arrow(
            'recorded-event-to-wait',
            leftEvent.x + leftEvent.width / 2,
            leftEvent.y + leftEvent.height,
            leftWait.x + leftWait.width / 2,
            leftWait.y,
            eventTone,
            4,
        ),
        arrow('wait-to-affine', leftWait.x + leftWait.width, 623, leftAffine.x, 623, text, 4),
        arrow(
            'copy-to-later-event',
            rightCopy.x,
            455,
            rightEvent.x + rightEvent.width,
            455,
            eventTone,
            4,
        ),
        arrow(
            'empty-wait-to-affine',
            rightWait.x + rightWait.width,
            623,
            rightAffine.x,
            623,
            text,
            4,
        ),
    ]

    const labels = [
        label(
            'title',
            'An event wait uses the state visible at that call',
            560,
            54,
            text,
            36,
            'middle',
            c.fontSans,
        ),
        label('left-title', 'RECORD → WAIT', 290, 158, text, 40, 'middle', c.fontMono),
        label('right-title', 'WAIT → RECORD', 830, 158, text, 40, 'middle', c.fontMono),
        label('api-left', 'API ORDER', 290, 202, text, 36, 'middle', c.fontMono),
        label('api-right', 'API ORDER', 830, 202, text, 36, 'middle', c.fontMono),
        boundedMonoLabel('left-record-label', 'record', leftRecord, c, 36),
        boundedMonoLabel('left-wait-api-label', 'wait', leftWaitApi, c, 36),
        boundedMonoLabel('right-wait-api-label', 'wait', rightWaitApi, c, 36),
        boundedMonoLabel('right-record-label', 'record', rightRecord, c, 36),
        label('left-copy-heading', 'COPY STREAM', 290, 382, text, 36, 'middle', c.fontMono),
        label('right-copy-heading', 'COPY STREAM', 830, 382, text, 36, 'middle', c.fontMono),
        boundedMonoLabel('ready-event-label', 'ready E1', leftEvent, c, 36),
        boundedMonoLabel('left-copy-label', 'copy', leftCopy, c, 36),
        boundedMonoLabel('later-event-label', 'later E1', rightEvent, c, 36),
        boundedMonoLabel('right-copy-label', 'copy', rightCopy, c, 36),
        label('left-compute-heading', 'COMPUTE', 430, 548, text, 36, 'middle', c.fontMono),
        label('right-compute-heading', 'COMPUTE', 970, 548, text, 36, 'middle', c.fontMono),
        boundedMonoLabel('wait-e1-label', 'wait E1', leftWait, c, 36),
        boundedMonoLabel('affine-left-label', 'affine', leftAffine, c, 36),
        boundedMonoLabel('empty-wait-label', 'empty E0', rightWait, c, 36, text),
        boundedMonoLabel('affine-right-label', 'affine', rightAffine, c, 36),
        label('left-note', 'copy gates affine', 290, 752, text, 36, 'middle', c.fontSans),
        label('right-note-one', 'wait sees empty E0', 830, 742, text, 36, 'middle', c.fontSans),
        label('right-note-two', 'later E1 is separate', 830, 786, text, 36, 'middle', c.fontSans),
    ]

    return (
        <Scene c={c} padding={0} gap={0}>
            {svgLayer('event-generation-state', width, height, shapes, labels)}
        </Scene>
    )
})

export const create = illustration.create
export default illustration
