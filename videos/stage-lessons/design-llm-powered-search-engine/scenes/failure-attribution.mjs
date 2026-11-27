// Scene 28: failure-attribution - Repair the layer that lost the evidence
// 4-layer diagnostic pipeline tracing Policy & Exception through Retrieval -> Packing -> Synthesis -> Access
// across 4 failure modes, plus Beat 2 RAGAS judge + human labels + operational telemetry.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function failureAttribution(s, c) {
  const startOn = s.value(0);
  const stepRetr = s.value(0);
  const stepPack = s.value(0);
  const stepSynth = s.value(0);
  const stepAccess = s.value(0);
  const beat2On = s.value(0);

  const header = cinemaHeader(
    'FAILURE ATTRIBUTION',
    'Repair the exact layer',
    'that lost evidence',
    {
      accent: ROLE.focus,
      size: 46,
    },
  );

  const stageAura = aura(0, 40, 700, '#ffd16618', '#ff6b8b1a');

  const scenarios = [
    {
      title: 'FAILURE 1: CURRENT POLICY ABSENT',
      faultIdx: 0,
      cause: 'INGESTION / RETRIEVAL',
      states: ['Policy MISSING', 'Exception only', 'Incomplete', 'Authorized'],
    },
    {
      title: 'FAILURE 2: RETRIEVED EXCEPTION DROPPED',
      faultIdx: 1,
      cause: 'CONTEXT PACKING',
      states: ['Policy + Exc OK', 'Exc DROPPED', 'Rule missing', 'Authorized'],
    },
    {
      title: 'FAILURE 3: APPROVAL CONDITION OMITTED',
      faultIdx: 2,
      cause: 'GENERATION / CLAIM CHECK',
      states: ['Policy + Exc OK', 'Both packed OK', 'Condition LOST', 'Authorized'],
    },
    {
      title: 'FAILURE 4: UNAUTHORIZED CITATION EXPORTED',
      faultIdx: 3,
      cause: 'ACCESS PATH (TRACK SEPARATELY)',
      states: ['Policy + Exc OK', 'Both packed OK', 'Fluent reply', 'ACL VIOLATION'],
    },
  ];

  const layerNames = ['1. RETRIEVAL', '2. PACKING', '3. SYNTHESIS', '4. ACCESS GATE'];

  const view = guardedDynamic(
    () => 1,
    () => {
      const b2 = beat2On.value > 0.5;
      const idx =
        stepAccess.value > 0.5 ? 3 : stepSynth.value > 0.5 ? 2 : stepPack.value > 0.5 ? 1 : 0;
      const sc = scenarios[idx];
      const nodes = [];

      nodes.push(
        txt(
          stepRetr.value > 0.5 ? sc.title : 'TRACE HELD-OUT QUESTIONS FROM RETRIEVAL TO ANSWER',
          -855,
          -235,
          28,
          stepRetr.value > 0.5 ? ROLE.deny : ROLE.query,
          'mono',
          'left',
        ).opacity(0.65 + 0.35 * startOn.value),
      );

      // 4 horizontal pipeline stations connected by luminous photon beams
      const xs = [-645, -215, 215, 645];
      for (let i = 0; i < 3; i++) {
        const beamCol = i < sc.faultIdx ? ROLE.ok : ROLE.deny;
        nodes.push(
          beamWithPhotons(
            quadArcPts([xs[i] + 175, -25], [xs[i + 1] - 175, -25], 0, 12),
            beamCol,
            0,
            {
              width: 3.4,
              glow: 7,
            },
          ),
        );
      }

      layerNames.forEach((name, i) => {
        const isFault = i === sc.faultIdx;
        const passed = i < sc.faultIdx;
        const col = isFault ? ROLE.deny : passed ? ROLE.ok : COSMOS.dim;
        nodes.push(
          rect(350, 210, { fill: '#0d1527', stroke: col, width: isFault ? 3.5 : 2.2, radius: 14 })
            .at(xs[i], -25)
            .glow(isFault ? 11 : passed ? 5 : 0, col),
          txt(name, xs[i], -84, 26, col, 'mono', 'center'),
          txt(sc.states[i], xs[i], -12, 28, isFault ? ROLE.deny : COSMOS.ink, 'mono', 'center'),
          txt(
            isFault ? 'ROOT CAUSE' : passed ? 'PASSED' : 'DOWNSTREAM',
            xs[i],
            48,
            26,
            col,
            'mono',
            'center',
          ),
        );
      });

      // Root-cause intervention readout
      nodes.push(
        rect(1680, 114, { fill: '#121526', stroke: ROLE.focus, width: 2.8, radius: 14 })
          .at(0, 200)
          .glow(8, ROLE.focus),
        txt(`INTERVENTION LAYER:  ${sc.cause}`, 0, 200, 34, ROLE.focus, 'mono', 'center'),
      );

      // Bottom Beat 2 summary: RAGAS + human labels + telemetry
      nodes.push(
        txt(
          b2
            ? 'RAGAS judges flag claims to inspect; track access failures separately from relevance, latency, cost & abstentions.'
            : 'Include deleted docs, conflicts, prompt injections, missing exceptions & stream revocations in evals.',
          -845,
          365,
          27,
          b2 ? ROLE.ok : COSMOS.muted,
          'sans',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  c.on('se-failure-attribution-0', () => {
    s.play(startOn.to(1, { duration: clampDur(c, c.cue('se-failure-attribution-0').start, 0.35) }));
  });
  c.on('se-failure-attribution-1', () => {
    s.play(stepRetr.to(1, { duration: clampDur(c, c.cue('se-failure-attribution-1').start, 0.3) }));
  });
  c.on('se-failure-attribution-pack', () => {
    s.play(
      stepPack.to(1, { duration: clampDur(c, c.cue('se-failure-attribution-pack').start, 0.3) }),
    );
  });
  c.on('se-failure-attribution-support', () => {
    s.play(
      stepSynth.to(1, {
        duration: clampDur(c, c.cue('se-failure-attribution-support').start, 0.3),
      }),
    );
  });
  c.on('se-failure-attribution-security', () => {
    s.play(
      stepAccess.to(1, {
        duration: clampDur(c, c.cue('se-failure-attribution-security').start, 0.3),
      }),
    );
  });
  c.on('se-failure-attribution-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-failure-attribution-2').start, 0.35) }));
  });
}
