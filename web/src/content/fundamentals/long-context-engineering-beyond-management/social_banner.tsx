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
  'Social banner for Context Engineering Beyond Window Management showing PR-418 token triage from 12,436 raw tokens down to 3,346 curated tokens.'

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
          fontSize={44}
          fontWeight={800}
          color={c.textPrimary}
          text="Context Engineering Beyond Management"
        />
        <TextLabel
          c={c}
          fontSize={22}
          color={c.textSecondary}
          text="Select, Write, Compress, and Isolate so the next PR-418 step sees clean mask evidence."
        />
      </Column>

      <Row width="100%" gap={16} align="stretch">
        <Panel c={c} tone="cyan" width="32%" padding={16} gap={8} title="NEXT CALL (3,346)">
          <TextLabel c={c} fontSize={19} text="PR-418 report + mask trace" />
          <TextLabel c={c} fontSize={19} text="Attention API spec + active tools" />
          <TextLabel c={c} fontSize={19} color={c.positive} text="+ kv_mask_shape (90)" />
          <TextLabel c={c} fontSize={19} color={c.positive} text="+ bpe_ruled_out (96)" />
        </Panel>

        <Panel c={c} tone="red" width="32%" padding={16} gap={8} title="OMITTED (-9,090)">
          <TextLabel c={c} fontSize={19} text="old_pytest_dump (-8,200)" />
          <TextLabel c={c} fontSize={19} text="dataset_shuffler (-360)" />
          <TextLabel c={c} fontSize={19} text="vocab_rebuild (-410)" />
          <TextLabel c={c} fontSize={19} text="disproven BPE claim (-120)" />
        </Panel>

        <Panel c={c} tone="green" width="32%" padding={16} gap={8} title="RESULT (-73.1%)">
          <TextLabel c={c} fontSize={19} text="Mid-window valley cleared" />
          <TextLabel c={c} fontSize={19} text="Zero stale BPE bias" />
          <TextLabel c={c} fontSize={19} text="Mask slice bug isolated" />
          <TextLabel c={c} fontSize={19} text="PR-418 patch plan ready" />
        </Panel>
      </Row>

      <Row width="100%" justify="space-between" align="center">
        <TextLabel
          c={c}
          fontSize={18}
          color={c.info}
          text="Write verified findings outside the window and reload only what the next decision needs."
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
