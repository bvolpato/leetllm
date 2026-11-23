import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 640
export const height = 670
export const alt =
    'Extracted candidate facts require both an allowlisted schema field and source-text entailment: preference from t3 passes, unverified bug tag from t2 requires review, and deploy-now from t4 is blocked because t4 requires CI first.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    const extractionRow = (
        label: string,
        tone: ToneName,
        source: string,
        candidate: string,
        verdict: string,
    ) =>
        Panel({
            c,
            title: label,
            tone,
            width: 608,
            padding: 12,
            titleFontSize: 20,
            children: Column({
                gap: 6,
                children: [
                    TextLabel({ c, text: source, fontSize: 19 }),
                    Row({
                        gap: 8,
                        justify: 'center',
                        align: 'center',
                        children: [
                            FlowArrow({ c, direction: 'right', length: 20, tone }),
                            TextLabel({ c, text: candidate, fontSize: 19, mono: true }),
                        ],
                    }),
                    BadgePill({
                        c,
                        text: verdict,
                        tone,
                        fontSize: 19,
                    }),
                ],
            }),
        })

    return Scene({
        c,
        title: 'Entity Extraction: Source Links and Field Allowlists',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            extractionRow(
                'Turn t2 · Inferred Identifier',
                'warm',
                'Source: "Softmax produced NaN in flash kernel"',
                '{bug_id: "KERN-104", conf: 0.90}',
                'Hold: turn t2 exists, but KERN-104 is invented',
            ),
            extractionRow(
                'Turn t3 · Supported Preference',
                'green',
                'Source: "Run pytest -q tests/attn.py"',
                '{test_cmd: "pytest -q tests/attn.py"}',
                'Saved: schema allowlisted and matches t3',
            ),
            extractionRow(
                'Turn t4 · Dropped Condition',
                'red',
                'Source: "Deploy after CI passes"',
                '{bypass_ci: true}',
                'Rejected: field disallowed and contradicts t4',
            ),
        ],
    })
}

export default create('dark')
