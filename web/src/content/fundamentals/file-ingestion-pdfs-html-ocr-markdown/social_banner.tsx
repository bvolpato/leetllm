import React from 'react'
import {
  Column,
  Panel,
  Row,
  Scene,
  TextLabel,
  getThemeColors,
  renderToPngWithOutput,
  type ThemeMode,
} from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false

export const alt =
  'File Ingestion for AI. inference-spec-v3 branches into an indexed 15-second prefill stall rule with page citation and a suspect 1S-second OCR candidate held for review.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
  const c = getThemeColors(theme)

  return (
    <Scene c={c} density={1.5} background={c.bg} padding={44} gap={18} contentWidth={1112}>
      <Row width="100%" justify="space-between" align="center">
        <TextLabel c={c} fontSize={16} fontWeight={700} color={c.info} text="LEETLLM FUNDAMENTALS" />
        <TextLabel c={c} fontSize={16} fontWeight={600} color={c.textMuted} text="leetllm.com" />
      </Row>

      <Column gap={8} width="100%">
        <TextLabel
          c={c}
          fontSize={46}
          fontWeight={800}
          color={c.textPrimary}
          text="File Ingestion for AI"
        />
        <TextLabel
          c={c}
          fontSize={22}
          color={c.textSecondary}
          text="Keep the serving rule intact and verify ambiguous OCR before indexing."
        />
      </Column>

      <Row width="100%" gap={16} align="stretch">
        <Panel c={c} tone="blue" width="32%" padding={16} gap={8} title="INFERENCE SPEC v3">
          <TextLabel c={c} fontSize={20} text="Prefill stall rule" />
          <TextLabel c={c} fontSize={22} fontWeight={700} color={c.info} text="15 seconds + batch ID" />
          <TextLabel c={c} fontSize={19} color={c.textSecondary} text="PDF text + HTML + Markdown" />
          <TextLabel c={c} fontSize={19} color={c.textSecondary} text="Page 7 vs. scanned page 8" />
        </Panel>

        <Panel c={c} tone="green" width="32%" padding={16} gap={8} title="INDEXED RECORD (READY)">
          <TextLabel c={c} fontSize={22} fontWeight={700} color={c.positive} text="15 seconds verified" />
          <TextLabel c={c} fontSize={19} text="Abort stalled prefill batch" />
          <TextLabel c={c} fontSize={19} color={c.textSecondary} text="inference-spec-v3 · page 7" />
          <TextLabel c={c} fontSize={19} color={c.textSecondary} text="SHA-256 digest stored" />
        </Panel>

        <Panel c={c} tone="warm" width="32%" padding={16} gap={8} title="HOLD FOR REVIEW">
          <TextLabel c={c} fontSize={22} fontWeight={700} color={c.warning} text="1S seconds candidate" />
          <TextLabel c={c} fontSize={19} text="Silent guess 1S -> 15 blocked" />
          <TextLabel c={c} fontSize={19} color={c.textSecondary} text="Interleaved cols + U+FFFD held" />
          <TextLabel c={c} fontSize={19} color={c.textSecondary} text="Flagged OCR stays outside search" />
        </Panel>
      </Row>

      <Row width="100%" justify="space-between" align="center">
        <TextLabel
          c={c}
          fontSize={18}
          color={c.info}
          text="Preserve structure across PDF, HTML, OCR, and Markdown without silent character fixes."
        />
        <TextLabel c={c} fontSize={18} fontWeight={700} color={c.textSecondary} text="LeetLLM" />
      </Row>
    </Scene>
  )
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
  const result = await renderToPngWithOutput(create(theme), {
    width,
    height,
    outputPath,
    scale: 1,
    crop: false,
    watermark: false,
    background: 'theme',
    theme,
  })
  if (result.pixelWidth !== width || result.pixelHeight !== height) {
    throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
  }
  return result
}

export default create('dark')
