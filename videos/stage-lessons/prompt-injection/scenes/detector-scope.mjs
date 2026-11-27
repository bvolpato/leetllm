// Scene 19: detector-scope - A classifier answers a narrower question than permission
// Top: Prompt Guard 2 (22M / 86M, 512-token window, benign|malicious) slicing a long
// input right across a boundary-spanning relationship. Bottom: Llama Guard 4 (12B
// text+image safety taxonomy) and PyRIT/garak probes contrasted against deterministic
// host ownership and approval services.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  energyRail,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function detectorScope(s, c) {
  const pulse = s.value(0);
  const pg2Hi = s.value(0);
  const lg4Hi = s.value(0);

  const header = cinemaHeader(
    'CLASSIFIER SCOPE & BOUNDARIES',
    'A classifier answers a narrower',
    'question than permission',
    { accent: ROLE.untrusted, size: 48 },
  );

  const stageAura = aura(100, 30, 620, '#fb923c1a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const p2 = pg2Hi.value;
      const l4 = lg4Hi.value;
      const nodes = [];

      // Top Section: Prompt Guard 2 512-token segmented windows
      const winY = -95;
      const w1Cx = -435;
      const w2Cx = 205;
      const winW = 560;
      const cutX = -115;

      nodes.push(
        txt(
          'META PROMPT GUARD 2 (22M / 86M · 512-TOKEN WINDOW · BENIGN / MALICIOUS)',
          -855,
          -235,
          26,
          p2 > 0.3 ? ROLE.focus : ROLE.host,
          'mono',
          'left',
        ),
        rect(winW, 124, { fill: '#0e1529', stroke: ROLE.source, width: 2.6, radius: 10 }).at(
          w1Cx,
          winY,
        ),
        txt('WINDOW 1 · TOKENS 0..511', w1Cx, winY - 30, 26, ROLE.source, 'mono', 'center'),
        txt(
          'Setup context + benign phrasing...',
          w1Cx,
          winY + 22,
          26,
          COSMOS.ink,
          'sans',
          'center',
        ),

        rect(winW, 124, { fill: '#0e1529', stroke: ROLE.untrusted, width: 2.6, radius: 10 }).at(
          w2Cx,
          winY,
        ),
        txt('WINDOW 2 · TOKENS 512..1023', w2Cx, winY - 30, 26, ROLE.untrusted, 'mono', 'center'),
        txt(
          '...completes action override target',
          w2Cx,
          winY + 22,
          26,
          COSMOS.ink,
          'sans',
          'center',
        ),

        line([cutX, winY - 72], [cutX, winY + 72], {
          stroke: ROLE.attack,
          width: 3.4,
          dash: [8, 6],
        }).glow(8, ROLE.attack),
        txt('512-TOKEN CUT', cutX, winY - 104, 26, ROLE.attack, 'mono', 'center'),
      );

      // Cross-boundary arc sliced by the 512-token cut
      const spanArc = quadArcPts([w1Cx + 150, winY + 62], [w2Cx - 150, winY + 62], 54, 22);
      nodes.push(
        beamWithPhotons(spanArc, ROLE.attack, p * 1.1, { width: 3.2 }),
        txt(
          'Cross-segment relationship lost across window split',
          cutX,
          winY + 124,
          26,
          ROLE.attack,
          'mono',
          'center',
        ),
      );

      // Right top note on adaptive attacks & distribution shift
      nodes.push(
        energyRail(535, -172, -18, ROLE.untrusted, { width: 5 }),
        txt('MODEL CARD LIMITS', 562, -152, 26, ROLE.untrusted, 'mono', 'left'),
        txt('No separate injection label', 562, -100, 26, COSMOS.ink, 'sans', 'left'),
        txt('Adaptive attacks &', 562, -54, 26, COSMOS.muted, 'sans', 'left'),
        txt('app-specific shifts', 562, -16, 26, COSMOS.muted, 'sans', 'left'),
      );

      // Divider
      nodes.push(line([-855, 68], [845, 68], { stroke: '#25355a', width: 2 }));

      // Bottom Section: Llama Guard 4 + PyRIT/garak vs Host Permission Gate
      const bAlpha = 0.45 + l4 * 0.55;
      const bY0 = 104;
      const bY1 = 368;

      nodes.push(
        energyRail(-855, bY0, bY1, ROLE.approval, { width: 5, opacity: bAlpha }),
        txt('LLAMA GUARD 4 (12B)', -828, bY0 + 22, 26, ROLE.approval, 'mono', 'left').opacity(
          bAlpha,
        ),
        txt('Text + image safety', -828, bY0 + 78, 26, COSMOS.ink, 'sans', 'left').opacity(bAlpha),
        txt('hazard taxonomy.', -828, bY0 + 118, 26, COSMOS.muted, 'sans', 'left').opacity(bAlpha),
        txt('Not an approval store.', -828, bY0 + 174, 26, ROLE.denied, 'mono', 'left').opacity(
          bAlpha,
        ),

        energyRail(-330, bY0, bY1, ROLE.source, { width: 5, opacity: bAlpha }),
        txt('PYRIT & GARAK', -302, bY0 + 22, 26, ROLE.source, 'mono', 'left').opacity(bAlpha),
        txt('Generate & score', -302, bY0 + 78, 26, COSMOS.ink, 'sans', 'left').opacity(bAlpha),
        txt('automated probes.', -302, bY0 + 118, 26, COSMOS.muted, 'sans', 'left').opacity(bAlpha),
        txt('Product fixtures define', -302, bY0 + 174, 26, ROLE.host, 'mono', 'left').opacity(
          bAlpha,
        ),
        txt('forbidden outcomes.', -302, bY0 + 216, 26, ROLE.host, 'mono', 'left').opacity(bAlpha),
      );

      // Bottom Right: Host Ownership & Approval Gate
      const gateX = 515;
      const gateY = 232;
      const toGate = quadArcPts([155, 232], [gateX - 125, gateY], 0, 18);
      nodes.push(
        beamWithPhotons(toGate, ROLE.host, p * 1.0, { width: 3.2, alpha: bAlpha }),
        hexGate(gateX, gateY, 68, l4 > 0.3 ? ROLE.host : '#3a4e7c', {
          label: 'HOST AUTHZ',
          sub: 'CLEAN LABEL ≠ PERMISSION',
          opacity: bAlpha,
          glow: l4 > 0.3 ? 11 : 4,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('pi-detector-scope-0', () => {
    s.play(pg2Hi.to(1, { duration: clampDur(c, c.cue('pi-detector-scope-0').start, 0.45) }));
  });
  c.on('pi-detector-scope-1', () => {
    s.play(lg4Hi.to(1, { duration: clampDur(c, c.cue('pi-detector-scope-1').start, 0.45) }));
  });
}
