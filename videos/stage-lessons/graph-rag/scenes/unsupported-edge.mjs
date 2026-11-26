// Scene 5: Two claims cite the same sentence (Strict prediction withholding: wrote vs owns citing "Lena wrote River Walk.")
import {
  COSMOS,
  EDGES,
  RECORDS,
  aura,
  entails,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function unsupportedEdge(s, c) {
  const phase = s.value(0);
  const showCand = s.value(0);
  const showKeep = s.value(0);
  const showWithhold = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Two Claims Cite', 'the Same Sentence'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'EDGE ENTAILMENT · CITATION HASH != SEMANTIC SUPPORT',
  });

  const wroteOk = entails(EDGES[0]);
  const ownsOk = entails({ ...EDGES[0], relation: 'owns' });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sc = showCand.value;
    const sk = showKeep.value;
    const sw = showWithhold.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Top: Source record A shared by both proposed edges
      glassCell(0, -148, 1660, 120, COSMOS.cyan, { fill: '#10203a', glow: 6 }),
      txt(
        'SHARED SOURCE RECORD A (v1 · HASH VERIFIED)',
        -800,
        -176,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(`"${RECORDS.author.text}"`, -800, -126, 32, COSMOS.ink, 'sans', 'left'),

      // Left candidate: Lena --wrote--> River Walk (strictly withheld verdict until unsupported-edge-authorship!)
      glassCell(-445, 76, 800, 224, sk > 0.4 ? COSMOS.emerald : COSMOS.gold, {
        fill: sk > 0.4 ? '#0e2824' : '#181e34',
        glow: sk > 0.4 ? 10 * pulse : 3,
      }),
      txt('CANDIDATE 1: Lena --[ wrote ]--> River Walk', -815, 8, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Endpoints match: YES   |   Cites A v1: YES', -815, 58, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        sk > 0.4
          ? `VERDICT: KEEP (entails = ${String(wroteOk)})`
          : 'VERDICT: ?  (Keep or Withhold?)',
        -815,
        112,
        28,
        sk > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt('Record A states authorship directly', -815, 154, 26, COSMOS.muted, 'sans', 'left'),

      // Right candidate: Lena --owns--> River Walk (strictly withheld verdict until unsupported-edge-ownership!)
      glassCell(465, 76, 790, 224, sw > 0.4 ? COSMOS.rose : sc > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: sw > 0.4 ? '#28111a' : '#181e34',
        glow: sw > 0.4 ? 10 * pulse : 3,
      }),
      txt('CANDIDATE 2: Lena --[ owns ]--> River Walk', 100, 8, 26, COSMOS.amber, 'mono', 'left'),
      txt('Endpoints match: YES   |   Cites A v1: YES', 100, 58, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        sw > 0.4
          ? `VERDICT: WITHHOLD (entails = ${String(ownsOk)})`
          : 'VERDICT: ?  (Keep or Withhold?)',
        100,
        112,
        28,
        sw > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Author could have sold rights; find owner source',
        100,
        154,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: sw > 0.4 ? COSMOS.rose : COSMOS.gold }),
      txt(
        'A matching hash proves which version you read, NOT that the text entails the extracted verb',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('unsupported-edge-source', () => s.play(showCand.to(0.4, { duration: 0.3 })));
  c.on('unsupported-edge-candidate', () => s.play(showCand.to(0.8, { duration: 0.3 })));
  c.on('unsupported-edge-decide', () => s.play(showCand.to(1, { duration: 0.3 })));
  c.after('unsupported-edge-authorship', () => s.play(showKeep.to(1, { duration: 0.4 })));
  c.after('unsupported-edge-ownership', () =>
    s.play(showWithhold.to(1, { duration: remainDuration(c, 'unsupported-edge-ownership', 0.45) })),
  );
}
