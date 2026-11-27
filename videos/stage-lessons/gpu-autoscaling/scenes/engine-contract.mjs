// Scene 11: engine-contract - Compare one request trace under an installed engine contract
// Five serving engines radiating from one pinned incident trace + vLLM configuration telemetry
// (ctx 8,192 · batch 16,384 · TP = 1 · chunked prefill + prefix reuse).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  glowDot,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function engineContract(s, c) {
  const step = s.value(0); // 1=fixed trace + 3 engines, 2=TRT-LLM PyTorch + TGI maintenance, 3=vLLM config

  const header = cinemaHeader(
    'SERVING ENGINE CONTRACT',
    'One trace, five engines,',
    'pinned release',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(240, 20, 650, '#5ce1e61e', '#60a5fa1a');

  const engines = [
    {
      name: 'vLLM',
      role: 'Continuous batch + paged KV + prefix reuse',
      col: ROLE.active,
      y: -230,
      group: 0,
    },
    {
      name: 'SGLang',
      role: 'RadixAttention prefix tree + scheduler',
      col: ROLE.warm,
      y: -115,
      group: 0,
    },
    {
      name: 'llama.cpp',
      role: 'GGUF layout + multi-hardware paths',
      col: ROLE.cold,
      y: 0,
      group: 0,
    },
    {
      name: 'TensorRT-LLM',
      role: 'PyTorch sole backend (legacy TRT removed)',
      col: ROLE.focus,
      y: 115,
      group: 1,
    },
    { name: 'TGI', role: 'Hugging Face maintenance mode', col: ROLE.warmup, y: 230, group: 1 },
  ];

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const nodes = [];

      // Left anchor: Shared frozen incident trace hub
      nodes.push(
        rect(390, 170, { fill: '#101d35', stroke: ROLE.focus, width: 2.8, radius: 16 })
          .at(-655, 0)
          .glow(8, ROLE.focus),
        txt('FIXED TRACE', -655, -42, 28, ROLE.focus, 'mono'),
        txt('Same shape & HW', -655, 6, 26, COSMOS.ink, 'sans'),
        txt('Same correctness', -655, 48, 26, COSMOS.muted, 'sans'),
      );

      // Five radiating luminous engine lanes
      for (const eng of engines) {
        const active = eng.group === 0 || st >= 1.5;
        const op = active ? 1 : 0.3;
        nodes.push(
          beamWithPhotons(
            [
              [-455, 0],
              [-190, eng.y],
            ],
            eng.col,
            0,
            { width: 3.0, glow: active ? 7 : 0, photonCount: 1, alpha: op },
          ),
          glowDot(-180, eng.y, { radius: 9, color: eng.col, glow: 11, opacity: op }),
          txt(eng.name, -150, eng.y, 30, eng.col, 'mono', 'left')
            .glow(active ? 5 : 0, eng.col)
            .opacity(op),
          txt(eng.role, 125, eng.y, 26, COSMOS.ink, 'sans', 'left').opacity(op),
        );
      }

      // Beat 2: vLLM example configuration strip along bottom
      if (st >= 2.5) {
        const chips = [
          { label: 'TP = 1 GPU', col: ROLE.focus, x: -620 },
          { label: 'Max len: 8,192 tok', col: ROLE.active, x: -210 },
          { label: 'Max batch: 16,384 tok', col: ROLE.warm, x: 250 },
          { label: 'Chunked + Prefix ON', col: ROLE.decode, x: 690 },
        ];
        for (const ch of chips) {
          nodes.push(
            rect(340, 62, { fill: '#101b30', stroke: ch.col, width: 2.4, radius: 12 })
              .at(ch.x, 382)
              .glow(6, ch.col),
            txt(ch.label, ch.x, 382, 26, ch.col, 'mono'),
          );
        }
      } else {
        nodes.push(
          txt(
            st >= 1.5
              ? 'Pin the installed release instead of mixing current names with legacy docs'
              : 'Hold workload, precision, hardware and schema checks constant',
            0,
            395,
            28,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);

  tweenOn(s, c, 'ga-engine-contract-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-engine-contract-b1', step, 2, 0.35);
  tweenOn(s, c, 'ga-engine-contract-b2', step, 3, 0.35);
}
