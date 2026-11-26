// Scene 18: code-whitespace: 16 spaces -> 4 four-space tokens (-75%) + camelCase "tokenCount" (5 vs 2 tokens).
import {
  CAMEL,
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function codeWhitespace(s, c) {
  const showFour = s.value(0);
  const showSave = s.value(0);
  const showCamel = s.value(0);
  const showTwo = s.value(0);

  const bgAura = aura(0, 0, 740, '#123a4f26', '#2c1e5218');
  const title = heroTitle(['Code spends tokens', 'on layout and casing'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.ok,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const f4 = showFour.value;
    const sv = showSave.value;
    const cm = showCamel.value;
    const tw = showTwo.value;
    const nodes = [];

    // Top: 16 leading spaces in Python indentation (16 tokens vs 4 tokens = 75% reduction)
    nodes.push(
      txt(
        'PYTHON INDENTATION: 16 LEADING SPACES',
        -855,
        -225,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt('Single-space tokens', -855, -145, 30, ROLE.warn, 'mono', 'left').opacity(alpha),
      lumBar(-430, -145, 760, 34, ROLE.warn, { opacity: alpha, maxTrackW: 760 }),
      txt('16 tokens', 370, -145, 32, ROLE.warn, 'mono', 'left').opacity(alpha),
    );

    const aF4 = (0.45 + 0.55 * f4) * alpha;
    nodes.push(
      txt('4-space piece', -855, -55, 30, ROLE.ok, 'mono', 'left').opacity(aF4),
      lumBar(-430, -55, 760 * (4 / 16), 34, ROLE.ok, { opacity: aF4, maxTrackW: 760 }),
      txt(sv > 0.4 ? '4 tokens (−75%)' : '4 tokens', 370, -55, 32, ROLE.ok, 'mono', 'left')
        .glow(sv > 0.4 ? 8 : 0, ROLE.ok)
        .opacity(aF4),
    );

    // Bottom: camelCase "tokenCount" fragmentation (quiet from t=0, illuminates on cue)
    const aC = (0.45 + 0.55 * cm) * alpha;
    nodes.push(
      txt('CAMELCASE IDENTIFIER:  "tokenCount"', -855, 85, 26, ROLE.merge, 'mono', 'left').opacity(
        aC,
      ),
      txt('Small vocab (5 tokens):', -855, 170, 28, ROLE.warn, 'mono', 'left').opacity(aC),
    );
    let cx = -420;
    CAMEL.forEach((piece) => {
      const w = Math.max(76, piece.length * 36 + 38);
      nodes.push(
        tokenPill(piece, cx + w * 0.5, 170, {
          w,
          h: 66,
          color: ROLE.warn,
          size: 32,
          opacity: aC,
        }),
      );
      cx += w + 18;
    });

    const a2 = (0.45 + 0.55 * tw) * aC;
    nodes.push(
      txt('Code-aware (2 tokens):', -855, 280, 28, ROLE.ok, 'mono', 'left').opacity(a2),
      tokenPill('token', -330, 280, { w: 185, h: 66, color: ROLE.ok, size: 32, opacity: a2 }),
      tokenPill('Count', -120, 280, { w: 185, h: 66, color: ROLE.ok, size: 32, opacity: a2 }),
      txt(
        'Always measure code with the exact tokenizer you plan to serve',
        -855,
        385,
        28,
        ROLE.piece,
        'sans',
        'left',
      ).opacity(a2),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'four', (d) => s.play(showFour.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'save', (d) => s.play(showSave.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'camel', (d) => s.play(showCamel.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'yours', (d) => s.play(showTwo.to(1, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, s.value(0), ['indent', 'sixteen', 'pieces']);
}
