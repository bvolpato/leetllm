// Scene 05: encoder-directions: Separate CLIP/SigLIP, Whisper, CLAP frontends; freeze schedules; output decoder branches.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function encoderDirections(s, c) {
  const showFrontends = s.value(0);
  const showSchedules = s.value(0);
  const showOutputs = s.value(0);

  const bgAura = aura(0, 0, 760, '#14315828', '#2c184626');
  const title = heroTitle(['Choose Feature & Output', 'Interfaces Independently'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.bridge,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const fr = showFrontends.value;
    const sc = showSchedules.value;
    const out = showOutputs.value;

    const nodes = [
      // Column 1: Modality frontends
      txt('1. MODALITY FRONTENDS', -615, -245, 26, ROLE.vision, 'mono', 'center').opacity(alpha),
      chipPill('CLIP / SigLIP (Charts)', -615, -145, {
        w: 440,
        h: 78,
        color: ROLE.vision,
        fill: fr > 0.3 ? '#0e283b' : '#10182d',
        size: 26,
        glow: fr > 0.3 ? 12 : 5,
        opacity: alpha,
      }),
      chipPill('Whisper (log-Mel -> Text)', -615, -35, {
        w: 440,
        h: 78,
        color: ROLE.audio,
        fill: fr > 0.3 ? '#2c1e0e' : '#10182d',
        size: 26,
        glow: fr > 0.3 ? 12 : 5,
        opacity: alpha,
      }),
      chipPill('CLAP (Alarm Retrieval)', -615, 75, {
        w: 440,
        h: 78,
        color: ROLE.bridge,
        fill: fr > 0.3 ? '#211842' : '#10182d',
        size: 26,
        glow: fr > 0.3 ? 12 : 5,
        opacity: alpha,
      }),
      txt(
        'Only transcript -> ordinary text tokens',
        -615,
        165,
        26,
        ROLE.audio,
        'sans',
        'center',
      ).opacity(alpha * (0.55 + 0.45 * fr)),

      // Column 2: Published bridge & freeze schedules
      txt('2. FREEZE / FUSION RECIPES', 10, -245, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      arrow([-380, -145], [-265, -145], { stroke: ROLE.vision, width: 2.8, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * sc),
      ),
      arrow([-380, -35], [-265, -35], { stroke: ROLE.audio, width: 2.8, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * sc),
      ),
      arrow([-380, 75], [-265, 75], { stroke: ROLE.bridge, width: 2.8, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * sc),
      ),

      chipPill('BLIP-2: Frozen V + LLM', 10, -155, {
        w: 500,
        h: 64,
        color: sc > 0.3 ? ROLE.gold : '#384c76',
        size: 26,
        glow: sc > 0.3 ? 10 : 4,
        opacity: alpha * (0.58 + 0.42 * sc),
      }),
      chipPill('PaLI: Frozen -> Vision Tune', 10, -70, {
        w: 500,
        h: 64,
        color: sc > 0.3 ? ROLE.vision : '#384c76',
        size: 26,
        glow: sc > 0.3 ? 10 : 4,
        opacity: alpha * (0.58 + 0.42 * sc),
      }),
      chipPill('Gemini: Multimodal Pretrain', 10, 15, {
        w: 500,
        h: 64,
        color: sc > 0.3 ? ROLE.bridge : '#384c76',
        size: 26,
        glow: sc > 0.3 ? 10 : 4,
        opacity: alpha * (0.58 + 0.42 * sc),
      }),
      chipPill('Llama 4: Early + MoE + MetaCLIP', 10, 100, {
        w: 500,
        h: 64,
        color: sc > 0.3 ? ROLE.ok : '#384c76',
        size: 26,
        glow: sc > 0.3 ? 10 : 4,
        opacity: alpha * (0.58 + 0.42 * sc),
      }),

      // Column 3: Output decoder branches
      txt('3. OUTPUT DECODERS', 610, -245, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      arrow([275, -35], [375, -105], { stroke: ROLE.ok, width: 3, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * out),
      ),
      arrow([275, -35], [375, 25], { stroke: ROLE.bridge, width: 3, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * out),
      ),

      rect(440, 118, {
        fill: out > 0.3 ? '#0f2d24' : '#0f172b',
        stroke: out > 0.3 ? ROLE.ok : '#344c72',
        width: out > 0.3 ? 3 : 2,
        radius: 14,
      })
        .at(610, -110)
        .glow(out > 0.3 ? 12 : 0, ROLE.ok)
        .opacity(alpha * (0.58 + 0.42 * out)),
      txt('Copilot: Cited Text', 610, -130, 28, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('reads chart + audio', 610, -86, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),

      rect(440, 134, {
        fill: out > 0.3 ? '#211842' : '#0f172b',
        stroke: out > 0.3 ? ROLE.bridge : '#344c72',
        width: out > 0.3 ? 3 : 2,
        radius: 14,
      })
        .at(610, 48)
        .glow(out > 0.3 ? 12 : 0, ROLE.bridge)
        .opacity(alpha * (0.58 + 0.42 * out)),
      txt('GPT-4o / Image / Speech', 610, 22, 28, ROLE.bridge, 'mono', 'center').opacity(alpha),
      txt('needs trained output decoder', 610, 70, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),

      // Footer
      txt(
        out > 0.3
          ? 'Evaluate every input encoder and every output modality your product ships'
          : 'Architecture names alone do not specify a freeze schedule',
        0,
        285,
        28,
        out > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'mm-encoder-directions-0', (d) => s.play(showFrontends.to(1, { duration: d })));
  playCue(s, c, 'mm-encoder-directions-1', (d) => s.play(showSchedules.to(1, { duration: d })));
  playCue(s, c, 'mm-encoder-directions-2', (d) => s.play(showOutputs.to(1, { duration: d })));
}
