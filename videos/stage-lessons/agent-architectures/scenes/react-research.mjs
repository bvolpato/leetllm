// Scene 5: react-research - What did the Act control see?
// Orbital Thought -> Action -> Observation triad on left feeding live ALFWorld (71% / 57% / 45% / 37%)
// and WebShop (40% / 29.1% / 28.7%) glowing comparative bars on right.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  glowMeter,
  guardedDynamic,
  orbNode,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function reactResearch(s, c) {
  const pulse = s.value(0);
  const barsMode = s.value(0);
  const bBest = s.value(0);
  const bAvg = s.value(0);
  const bAct = s.value(0);
  const bBut = s.value(0);
  const bWeb = s.value(0);
  const bIm = s.value(0);
  const bRl = s.value(0);

  const header = cinemaHeader(
    'REACT BENCHMARK EVIDENCE',
    'What did the Act',
    'control actually see?',
    {
      accent: ROLE.policy,
      size: 48,
    },
  );

  const stageAura = aura(240, 40, 620, '#a78bfa1e', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const bm = barsMode.value;
      const nodes = [];

      // Left: Orbital Thought -> Action -> Observation triad
      const tPt = [-540, -110];
      const aPt = [-340, 140];
      const oPt = [-740, 140];

      const [ta0, ta1] = trimSeg(tPt, aPt, 94, 84);
      const [ao0, ao1] = trimSeg(aPt, oPt, 84, 58);
      const [ot0, ot1] = trimSeg(oPt, tPt, 58, 94);

      nodes.push(
        beamWithPhotons([ta0, ta1], ROLE.policy, p * 1.0, { width: 3.2 }),
        beamWithPhotons([ao0, ao1], ROLE.action, p * 1.0 + 0.33, { width: 3.2 }),
        beamWithPhotons([ot0, ot1], ROLE.ok, p * 1.0 + 0.66, { width: 3.2 }),
        orbNode(tPt[0], tPt[1], 'THINK', ROLE.policy, { radius: 56 }),
        orbNode(aPt[0], aPt[1], 'ACT', ROLE.action, { radius: 56 }),
        orbNode(oPt[0], oPt[1], 'OBS', ROLE.ok, { radius: 56 }),
        txt('Act control: drops Thought, keeps Obs', -540, 275, 26, ROLE.focus, 'mono', 'center'),
      );

      // Right: ALFWorld & WebShop glowing benchmark meters
      const rx = -40;
      const barW = 720;
      const alfRows = [
        {
          label: 'ReAct best (6 prompts)  71%',
          val: 0.71,
          col: ROLE.ok,
          v: Math.max(0.25, bBest.value),
        },
        {
          label: 'ReAct average           57%',
          val: 0.57,
          col: ROLE.action,
          v: Math.max(0.2, bAvg.value),
        },
        {
          label: 'Act control (no thought) 45%',
          val: 0.45,
          col: ROLE.focus,
          v: Math.max(0.2, bAct.value),
        },
        {
          label: 'BUTLER                  37%',
          val: 0.37,
          col: COSMOS.muted,
          v: Math.max(0.2, bBut.value),
        },
      ];
      const webRows = [
        {
          label: 'ReAct                   40.0%',
          val: 0.4,
          col: ROLE.ok,
          v: Math.max(0.2, bWeb.value),
        },
        {
          label: 'Imitation learning      29.1%',
          val: 0.291,
          col: ROLE.policy,
          v: Math.max(0.2, bIm.value),
        },
        {
          label: 'Imitation + RL          28.7%',
          val: 0.287,
          col: COSMOS.muted,
          v: Math.max(0.2, bRl.value),
        },
      ];

      nodes.push(
        txt('ALFWORLD SUCCESS RATE', rx, -295, 26, ROLE.action, 'mono', 'left').opacity(
          0.45 + bm * 0.55,
        ),
      );
      alfRows.forEach((row, i) => {
        const y = -238 + i * 78;
        nodes.push(
          txt(row.label, rx, y, 26, row.col, 'mono', 'left').opacity(row.v),
          glowMeter(rx, y + 38, barW, 20, row.val * row.v, { fill: row.col, opacity: row.v }),
        );
      });

      nodes.push(
        txt('WEBSHOP SUCCESS RATE', rx, 102, 26, ROLE.policy, 'mono', 'left').opacity(
          0.35 + bm * 0.65,
        ),
      );
      webRows.forEach((row, i) => {
        const y = 160 + i * 78;
        nodes.push(
          txt(row.label, rx, y, 26, row.col, 'mono', 'left').opacity(row.v),
          glowMeter(rx, y + 38, barW, 20, row.val * row.v, { fill: row.col, opacity: row.v }),
        );
      });

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-react-research-0', () => {
    s.play(pulse.to(0.35, { duration: clampDur(c, c.cue('aa-react-research-0').start, 0.25) }));
  });
  c.on('aa-react-research-1', () => {
    s.play(barsMode.to(1, { duration: clampDur(c, c.cue('aa-react-research-1').start, 0.35) }));
  });
  c.on('research-best', () => {
    s.play(bBest.to(1, { duration: clampDur(c, c.cue('research-best').start, 0.35) }));
  });
  c.on('research-average', () => {
    s.play(bAvg.to(1, { duration: clampDur(c, c.cue('research-average').start, 0.35) }));
  });
  c.on('research-act-control', () => {
    s.play(bAct.to(0.6, { duration: clampDur(c, c.cue('research-act-control').start, 0.25) }));
  });
  c.on('research-act', () => {
    s.play(bAct.to(1, { duration: clampDur(c, c.cue('research-act').start, 0.35) }));
  });
  c.on('research-butler', () => {
    s.play(bBut.to(1, { duration: clampDur(c, c.cue('research-butler').start, 0.35) }));
  });
  c.on('research-webshop', () => {
    s.play(bWeb.to(1, { duration: clampDur(c, c.cue('research-webshop').start, 0.35) }));
  });
  c.on('research-imitation', () => {
    s.play(bIm.to(1, { duration: clampDur(c, c.cue('research-imitation').start, 0.35) }));
  });
  c.on('research-rl', () => {
    s.play(bRl.to(1, { duration: clampDur(c, c.cue('research-rl').start, 0.35) }));
  });
}
