// Scene 19: What belongs in position six? (PREDICTION SCENE: Draft 8 words, first mismatch pos 6 sea vs lake; commit 5+lake, 5 ready KV, slot 6 KV empty until next forward!)
import {
  COSMOS,
  ROLE,
  SPEC_DRAFT,
  SPEC_TARGET,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function speculate(s, c) {
  // step:
  // 0 = Draft proposes 8 words (The birds sing near the sea at dawn)
  // 1 = Target agrees on first 5 words (The birds sing near the)
  // 2 = Target chooses "lake" at position 6 (draft had "sea")
  // 3 = PREDICT HOLD (Which word goes in output slot 6? Is its KV ready?)
  // 4 = Output commits 5 matching + "lake" (6 outputs); Ready KV has ONLY 5 (slot 6 EMPTY!)
  // 5 = Discard draft suffix: sea, at, dawn
  // 6 = Feed "lake" back into target forward pass
  // 7 = After forward finishes, slot 6 KV is now READY (6/6)
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61a', '#ffd16618');
  const title = heroTitle(['What Belongs in', 'Position Six?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'SPECULATIVE VERIFICATION · OUTPUT VS READY KV',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const agreedShown = st >= 1;
    const mismatchShown = st >= 2;
    const committed = st >= 4;
    const discarded = st >= 5;
    const feeding = st === 6;
    const kvFilled6 = st >= 7;

    const nodes = [];
    const x0 = -520;
    const pitch = 178;

    // Position index header
    nodes.push(txt('POS', -770, -210, 26, COSMOS.muted, 'mono', 'left'));
    for (let i = 0; i < 8; i++) {
      const cx = x0 + i * pitch;
      nodes.push(txt(String(i + 1), cx, -210, 26, i === 5 ? COSMOS.gold : COSMOS.muted, 'mono'));
    }

    // Row 1: Draft rail
    nodes.push(txt('Draft', -770, -135, 28, COSMOS.ink, 'mono', 'left'));
    SPEC_DRAFT.forEach((word, i) => {
      const cx = x0 + i * pitch;
      const dropped = discarded && i >= 5;
      const isBad = mismatchShown && i === 5 && !dropped;
      const col = dropped ? COSMOS.dim : isBad ? ROLE.fail : ROLE.radix;
      nodes.push(
        glassCell(cx, -135, 160, 74, col, {
          fill: dropped ? '#0a0f1c' : isBad ? '#2c1120' : '#0f2034',
          glow: isBad ? 10 : dropped ? 1 : 5,
        }),
        txt(dropped ? 'drop' : word, cx, -135, 28, dropped ? COSMOS.dim : COSMOS.ink, 'mono'),
      );
    });

    // Row 2: Target rail
    nodes.push(txt('Target', -770, -35, 28, COSMOS.ink, 'mono', 'left'));
    for (let i = 0; i < 8; i++) {
      const cx = x0 + i * pitch;
      const show = (agreedShown && i < 5) || (mismatchShown && i === 5);
      const isRepl = mismatchShown && i === 5;
      const col = isRepl ? COSMOS.gold : show ? ROLE.prefill : COSMOS.dim;
      nodes.push(
        glassCell(cx, -35, 160, 74, col, {
          fill: isRepl ? '#221c10' : show ? '#10213d' : '#0a0f1c',
          glow: isRepl ? 11 : show ? 6 : 1,
        }),
        txt(show ? SPEC_TARGET[i] : '', cx, -35, 28, isRepl ? COSMOS.gold : COSMOS.ink, 'mono'),
      );
    }

    // Separator line
    nodes.push(line([-770, 26], [790, 26], { color: '#334155', width: 2.5 }));

    // Row 3: Committed Output rail (STRICTLY WITHHELD until st >= 4!)
    nodes.push(txt('Output', -770, 92, 28, ROLE.decode, 'mono', 'left'));
    for (let i = 0; i < 8; i++) {
      const cx = x0 + i * pitch;
      const hasOut = committed && i < 6;
      const askSix = !committed && st === 3 && i === 5;
      const col = hasOut ? ROLE.decode : askSix ? COSMOS.gold : COSMOS.dim;
      nodes.push(
        glassCell(cx, 92, 160, 74, col, {
          fill: hasOut ? '#0d2922' : askSix ? '#221c10' : '#0a0f1c',
          glow: hasOut ? 8 : askSix ? 10 : 1,
        }),
        txt(
          hasOut ? SPEC_TARGET[i] : askSix ? '?' : '',
          cx,
          92,
          28,
          askSix ? COSMOS.gold : COSMOS.ink,
          'mono',
        ),
      );
    }

    // Row 4: Ready KV rail (slot 6 stays EMPTY until st >= 7!)
    nodes.push(txt('Ready KV', -770, 198, 28, ROLE.radix, 'mono', 'left'));
    for (let i = 0; i < 8; i++) {
      const cx = x0 + i * pitch;
      const hasKv = (committed && i < 5) || (kvFilled6 && i === 5);
      const pendingSix = committed && !kvFilled6 && i === 5;
      const askSix = !committed && st === 3 && i === 5;
      const col = hasKv ? ROLE.radix : pendingSix ? ROLE.fail : askSix ? COSMOS.gold : COSMOS.dim;
      nodes.push(
        glassCell(cx, 198, 160, 74, col, {
          fill: hasKv ? '#0e2436' : pendingSix ? '#2a1220' : askSix ? '#221c10' : '#0a0f1c',
          glow: hasKv ? 8 : pendingSix || askSix ? 10 : 1,
        }),
        txt(
          hasKv ? SPEC_TARGET[i] : pendingSix ? (feeding ? 'fwd...' : 'empty') : askSix ? '?' : '',
          cx,
          198,
          26,
          pendingSix ? ROLE.fail : askSix ? COSMOS.gold : COSMOS.ink,
          'mono',
        ),
      );
    }

    const caption = kvFilled6
      ? 'After feeding "lake" into the target forward pass, all 6 committed positions have ready KV.'
      : feeding
        ? 'Feed "lake" back into the target model so its own KV can be computed.'
        : discarded
          ? 'Discarded draft "sea, at, dawn": keeping sea KV would corrupt history.'
          : committed
            ? 'Committed 6 outputs ("lake" at pos 6), but only 5 KV slots are ready (pos 6 input was "sea").'
            : st === 3
              ? 'Predict: Which word goes in output slot 6, and is its KV entry ready?'
              : mismatchShown
                ? 'Pos 6 mismatch: sea vs lake.'
                : 'Draft proposes 8 tokens; target verifies all positions in one parallel forward pass.';

    nodes.push(txt(caption, 0, 355, 28, st === 3 ? COSMOS.gold : COSMOS.ink, 'sans'));
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['draft-words', 0],
    ['speculate-agreed-prefix', 1],
    ['speculate-beat-2-focus-1', 2],
    ['draft-ask', 3],
    ['speculate-commit-prefix', 4, true],
    ['speculate-beat-3-focus-1', 5, true],
    ['replacement-feed', 6],
    ['replacement-forward', 7, true],
  ]);
}
