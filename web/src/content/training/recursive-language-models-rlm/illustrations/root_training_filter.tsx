import { BarChart, MetricCard, Row, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 760
export const height = 680
export const alt =
    'A bar chart shows the LongBenchPro filtering funnel from 750 English tasks to 2,250 candidate trajectories and 1,072 retained trajectories after removing zero-score and single-turn runs. Metric cards show 300 SFT steps, 48 H100-hours, and a 28.3% relative median gain on Qwen3-8B.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.3)
    return Scene({
        c,
        title: 'Root Controller SFT Trajectory Filtering',
        subtitle: 'LongBenchPro data funnel and RLM-Qwen3-8B fine-tuning summary',
        contentWidth: 720,
        gap: 16,
        padding: 16,
        children: [
            BarChart({
                c,
                width: 720,
                height: 280,
                title: 'Trajectory Filtering Pipeline (Zhang et al., Appendix A)',
                format: 'integer',
                showValues: true,
                showGrid: false,
                max: 2700,
                data: [
                    { label: 'Tasks', value: 750, color: 'purple' },
                    { label: 'Candidates', value: 2250, color: 'blue' },
                    { label: 'Retained', value: 1072, color: 'green' },
                    { label: 'Main text', value: 1000, color: '#d97706' },
                ],
            }),
            Row({
                gap: 14,
                align: 'stretch',
                children: [
                    MetricCard({
                        c,
                        label: 'SFT Schedule',
                        value: '300',
                        detail: 'Steps at batch size 64',
                        tone: 'blue',
                        width: 230,
                    }),
                    MetricCard({
                        c,
                        label: 'Compute Cost',
                        value: '48 hr',
                        detail: 'H100-hrs (trimmed turns)',
                        tone: 'purple',
                        width: 230,
                    }),
                    MetricCard({
                        c,
                        label: 'Qwen3-8B Delta',
                        value: '+28.3%',
                        detail: 'Median across 4 tasks',
                        tone: 'green',
                        width: 230,
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
