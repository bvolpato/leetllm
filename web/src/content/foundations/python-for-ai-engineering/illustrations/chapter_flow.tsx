import { Column, GraphDiagram, Scene, TextLabel, defineIllustration } from 'vizmatic'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const alt =
    'Four-stage Python data preparation flow from a frozen dataclass RunConfig to a lazy JSONL yield generator, into a seeded batcher and padder emitting B by L grids, and finally into a contiguous array of C floats shared with NumPy.'

export const width = 660
export const height = 600
export const preset = 'engineering'

const illustration = defineIllustration((c) => {
    const diagram = preparePrintTypography(
        GraphDiagram({
            c,
            width: 620,
            height: 460,
            direction: 'TB',
            routing: 'orthogonal',
            arrowSize: 6,
            nodeWidth: 290,
            nodeHeight: 74,
            nodeGap: 28,
            rankGap: 40,
            labelFontSize: 21,
            detailFontSize: 19,
            nodes: [
                {
                    id: 'config',
                    label: '1. Frozen RunConfig',
                    detail: '@dataclass · seed=42',
                    icon: 'file',
                    tone: 'neutral',
                },
                {
                    id: 'stream',
                    label: '2. JSONL Stream',
                    detail: 'yield 1 record · O(1) RAM',
                    icon: 'stream',
                    tone: 'blue',
                },
                {
                    id: 'batch',
                    label: '3. Seeded Batcher',
                    detail: 'shuffle + pad -> [B x L]',
                    icon: 'layers',
                    tone: 'purple',
                },
                {
                    id: 'buffer',
                    label: '4. Contiguous Buffer',
                    detail: "array('f') -> np.frombuffer",
                    icon: 'bucket',
                    tone: 'green',
                },
            ],
            edges: [
                {
                    from: 'config',
                    to: 'stream',
                    label: 'max_len, seed',
                    kind: 'data',
                    tone: 'neutral',
                },
                {
                    from: 'stream',
                    to: 'batch',
                    label: 'stream records',
                    dashed: true,
                    kind: 'data',
                    tone: 'blue',
                },
                {
                    from: 'batch',
                    to: 'buffer',
                    label: 'packed float32',
                    kind: 'data',
                    tone: 'green',
                },
            ],
        }),
        19,
    )

    return Scene({
        c,
        padding: 18,
        gap: 10,
        contentWidth: 624,
        align: 'center',
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Python Data Preparation for ML',
                    fontSize: 26,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Typed config, constant-memory streaming, and contiguous handoff',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                diagram,
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
