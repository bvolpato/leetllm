import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 462
export const alt =
    'Request trace-05 is span 0, deploy-answer.request. Three sibling spans have parent_id 0: span 1 retrieval deploy-policy with evidence version deploy-policy@v17; span 2 chat deploy-assistant-prod with the claim-generation failure; and span 3 serving_gate with unsafe_claim_served=true and escape_stage=serving_gate. The spans show logical parentage; duration and cause require separate evidence.'

const LH = 20

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)

    s.dot(16, 20, 7, k.state)
    s.text(32, 12, 'deploy-answer.request', { mono: true, weight: 700, color: k.state })
    s.text(32, 32, 'span_id=0 · platform.request.id=trace-05', { mono: true, color: k.mid })

    const spans: Array<{ title: string; color: string; lines: Array<[string, boolean?]> }> = [
        {
            title: 'retrieval deploy-policy',
            color: k.prefill,
            lines: [
                ['span_id=1 · parent_id=0'],
                ['gen_ai.operation.name=retrieval'],
                ['gen_ai.data_source.id=deploy-policy'],
                ['platform.evidence.version=deploy-policy@v17'],
            ],
        },
        {
            title: 'chat deploy-assistant-prod',
            color: k.decode,
            lines: [
                ['span_id=2 · parent_id=0'],
                ['gen_ai.operation.name=chat'],
                ['gen_ai.provider.name=platform.internal'],
                ['gen_ai.request.model=deploy-assistant-prod'],
                ['gen_ai.usage.input_tokens=198'],
                ['gen_ai.usage.output_tokens=29'],
                ['platform.failure.stage=claim_generation', true],
            ],
        },
        {
            title: 'serving_gate',
            color: k.fail,
            lines: [
                ['span_id=3 · parent_id=0'],
                ['platform.answer.route=serve'],
                ['platform.answer.unsafe_claim_served=true', true],
                ['platform.failure.escape_stage=serving_gate', true],
            ],
        },
    ]

    let y = 62
    let lastY = y
    spans.forEach((span) => {
        lastY = y + 10
        s.path(`M16 ${y + 10} H36`, k.mid)
        s.dot(44, y + 10, 6, span.color)
        s.text(58, y + 10, span.title, { mono: true, weight: 700, color: span.color })
        span.lines.forEach(([line, hot], i) => {
            s.text(58, y + 10 + (i + 1) * LH, line, {
                mono: true,
                color: hot ? k.fail : k.mid,
                weight: hot ? 700 : 500,
            })
        })
        y += (span.lines.length + 1) * LH + 14
    })
    s.line(16, 28, 16, lastY, k.mid)
    return s.render()
}
