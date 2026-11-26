// Scene 22: safety-boundary: Untrusted dashboard pixels ("Acknowledge alert") vs read-only scope & revoked cache access.
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

export default function safetyBoundary(s, c) {
  const showPixels = s.value(0);
  const showGate = s.value(0);
  const showRevoke = s.value(0);

  const bgAura = aura(0, 0, 760, '#2e13262c', '#142d5428');
  const title = heroTitle(['Who Authorized', 'the Action?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.warn,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const px = showPixels.value;
    const gt = showGate.value;
    const rv = showRevoke.value;

    const nodes = [
      // Left: Two inputs with distinct provenance
      txt('1. PROVENANCE SEPARATION', -595, -245, 26, ROLE.vision, 'mono', 'center').opacity(alpha),
      rect(520, 158, {
        fill: '#10182d',
        stroke: px > 0.3 ? ROLE.warn : '#384c76',
        width: px > 0.3 ? 3 : 2,
        radius: 12,
      })
        .at(-595, -125)
        .glow(px > 0.3 ? 10 : 0, ROLE.warn)
        .opacity(alpha),
      txt('UNTRUSTED PIXELS (I17)', -595, -168, 26, ROLE.warn, 'mono', 'center').opacity(alpha),
      chipPill('[ Acknowledge alert ]', -595, -96, {
        w: 390,
        h: 58,
        color: ROLE.warn,
        fill: '#2c1422',
        size: 26,
        opacity: alpha,
      }),

      rect(520, 148, {
        fill: '#10182d',
        stroke: ROLE.text,
        width: 2.6,
        radius: 12,
      })
        .at(-595, 65)
        .opacity(alpha),
      txt('AUTHENTICATED QUESTION', -595, 25, 26, ROLE.text, 'mono', 'center').opacity(alpha),
      txt('"When did latency rise?"', -595, 85, 28, COSMOS.ink, 'sans', 'center').opacity(alpha),

      // Center: Serving-Layer Policy Gate (outside the model!)
      txt('2. SERVING POLICY GATE', 45, -245, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      arrow([-320, -125], [-195, -80], { stroke: ROLE.warn, width: 3, head: 11 }).opacity(alpha),
      arrow([-320, 65], [-195, 20], { stroke: ROLE.text, width: 3, head: 11 }).opacity(alpha),

      rect(440, 325, {
        fill: gt > 0.3 ? '#1c1836' : '#0f172b',
        stroke: gt > 0.3 ? ROLE.gold : '#364d78',
        width: gt > 0.3 ? 3.2 : 2,
        radius: 14,
      })
        .at(45, -35)
        .glow(gt > 0.3 ? 12 : 0, ROLE.gold)
        .opacity(alpha),
      txt('Enforced OUTSIDE', 45, -135, 28, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('the LLM', 45, -92, 28, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('File + pixel bounds', 45, -25, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Safe fetch destinations', 45, 25, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Read-only case tools', 45, 75, 26, ROLE.ok, 'sans', 'center').opacity(alpha),

      // Right: Tool scope + Warm Cache Revocation
      txt('3. ACTION & CACHE AUTH', 605, -245, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      arrow([280, -105], [375, -135], { stroke: ROLE.ok, width: 3, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * gt),
      ),
      arrow([280, -35], [375, -35], { stroke: ROLE.warn, width: 3, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * gt),
      ),
      arrow([280, 45], [375, 75], { stroke: ROLE.warn, width: 3, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * rv),
      ),

      chipPill('Read Case -> ALLOW', 605, -140, {
        w: 440,
        h: 68,
        color: gt > 0.3 ? ROLE.ok : '#384c76',
        fill: gt > 0.3 ? '#0f2d24' : '#10182d',
        size: 26,
        glow: gt > 0.3 ? 12 : 4,
        opacity: alpha,
      }),
      chipPill('Ack Alert -> DENY', 605, -35, {
        w: 440,
        h: 68,
        color: gt > 0.3 ? ROLE.warn : '#384c76',
        fill: gt > 0.3 ? '#2c1422' : '#10182d',
        size: 26,
        glow: gt > 0.3 ? 12 : 4,
        opacity: alpha,
      }),
      chipPill('Revoked + Warm KV -> DENY', 605, 80, {
        w: 440,
        h: 74,
        color: rv > 0.3 ? ROLE.warn : '#384c76',
        fill: rv > 0.3 ? '#2c1422' : '#10182d',
        size: 26,
        glow: rv > 0.3 ? 14 : 4,
        opacity: alpha * (0.55 + 0.45 * rv),
      }),

      // Footer
      txt(
        rv > 0.3
          ? 'An existing hash, warm prefix-KV hit, or valid coordinate NEVER overrides revoked access'
          : 'Delimiters label provenance; the serving layer enforces authority outside the model',
        0,
        285,
        26,
        rv > 0.3 ? ROLE.warn : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'mm-safety-boundary-0', (d) => s.play(showPixels.to(1, { duration: d })));
  playCue(s, c, 'mm-safety-boundary-1', (d) => s.play(showGate.to(1, { duration: d })));
  playCue(s, c, 'mm-safety-boundary-2', (d) => s.play(showRevoke.to(1, { duration: d })));
}
