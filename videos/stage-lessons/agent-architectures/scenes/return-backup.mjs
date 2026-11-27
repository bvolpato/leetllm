// Scene 24: return-backup - What changes after one more retry?
// Glowing backpropagation path from Retry leaf (N: 1->2, W: 0.1->1.1, mean -> 0.55)
// up to Root (N: 10->11), keeping untouched siblings Rollback & Diff frozen!
// Strict prediction withholding on Beat 0 until `backup-mean`.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  glowTex,
  guardedDynamic,
  orbNode,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function returnBackup(s, c) {
  const pulse = s.value(0);
  const countReveal = s.value(0);
  const sumReveal = s.value(0);
  const meanReveal = s.value(0);
  const parentUp = s.value(0);
  const scopeOn = s.value(0);

  const header = cinemaHeader('MCTS RETURN BACKUP', 'What changes after', 'one more retry?', {
    accent: ROLE.ok,
    size: 50,
  });

  const stageAura = aura(160, 40, 620, '#6ee7b71e', '#ffd16618');

  const meanEq = glowTex(String.raw`\frac{0.1 + 1.0}{2} = \frac{1.1}{2} = 0.55`, {
    x: -510,
    y: 45,
    size: 40,
    color: ROLE.ok,
    glow: 8,
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const ct = countReveal.value;
      const sm = sumReveal.value;
      const mn = meanReveal.value;
      const pu = parentUp.value;
      const sc = scopeOn.value;
      const nodes = [];

      // Right-hand live search tree (Root top, 3 children below, Terminal r=1 below Retry)
      const rootPt = [220, -210];
      const rbPt = [-110, 30];
      const dfPt = [220, 30];
      const rtPt = [550, 30];
      const leafPt = [550, 265];

      const [e1a, e1b] = trimSeg(rootPt, rbPt, 68, 66);
      const [e2a, e2b] = trimSeg(rootPt, dfPt, 68, 66);
      const [e3a, e3b] = trimSeg(rtPt, rootPt, 74, 70); // upward backup edge!
      const [e4a, e4b] = trimSeg(leafPt, rtPt, 66, 74);

      nodes.push(
        txt(
          pu > 0.35 ? 'Root: +1 visit, +1.0' : 'Root (N=10)',
          rootPt[0],
          rootPt[1] - 96,
          26,
          pu > 0.35 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
        beamWithPhotons([e1a, e1b], '#33456e', p * 0.5, {
          alpha: 0.45,
          width: 2.2,
          photonCount: 0,
        }),
        beamWithPhotons([e2a, e2b], '#33456e', p * 0.5, {
          alpha: 0.45,
          width: 2.2,
          photonCount: 0,
        }),
        beamWithPhotons([e4a, e4b], ROLE.ok, p * 1.2, { width: 4.0 }),
        beamWithPhotons([e3a, e3b], pu > 0.35 ? ROLE.ok : ROLE.focus, p * 1.2 + 0.4, {
          alpha: 0.45 + pu * 0.55,
          width: pu > 0.35 ? 4.4 : 2.8,
        }),
        orbNode(
          rootPt[0],
          rootPt[1],
          pu > 0.35 ? 'N=11' : 'N=10',
          pu > 0.35 ? ROLE.ok : ROLE.host,
          {
            radius: 60,
          },
        ),
        orbNode(rbPt[0], rbPt[1], 'ROLL', COSMOS.dim, {
          radius: 56,
          sub: 'N=4 · W=1.2',
          opacity: 0.6,
        }),
        orbNode(dfPt[0], dfPt[1], 'DIFF', COSMOS.dim, {
          radius: 56,
          sub: 'N=5 · W=4.5',
          opacity: 0.6,
        }),
        orbNode(rtPt[0], rtPt[1], 'RETRY', mn > 0.35 ? ROLE.ok : ROLE.focus, {
          radius: 68,
        }),
        txt(
          mn > 0.35 ? 'N=2 · 0.55' : sm > 0.35 ? 'N=2 · W=1.1' : ct > 0.35 ? 'N=2' : 'N=1 · W=0.1',
          rtPt[0] + 90,
          rtPt[1],
          26,
          mn > 0.35 ? ROLE.ok : ROLE.focus,
          'mono',
          'left',
        ),
        orbNode(leafPt[0], leafPt[1], 'r = 1', ROLE.ok, { radius: 56, sub: 'New outcome' }),
      );

      // Left diagnostic column (withholding 0.55 until `backup-mean`!)
      nodes.push(
        txt('RETRY PRIOR STATS', -840, -175, 26, ROLE.focus, 'mono', 'left'),
        txt('Visits N = 1   ·   Total W = 0.1', -840, -120, 28, COSMOS.ink, 'mono', 'left'),
        txt('New simulation return: +1.0', -840, -68, 28, ROLE.ok, 'mono', 'left'),
      );

      if (ct < 0.05) {
        nodes.push(
          txt('What new average should we store?', -840, 45, 32, ROLE.focus, 'serif', 'left').glow(
            6,
            ROLE.focus,
          ),
        );
      }

      if (sc > 0.05) {
        nodes.push(
          txt('SEARCH STATS ONLY · MODEL WEIGHTS FIXED', -840, 235, 26, ROLE.host, 'mono', 'left')
            .glow(5, ROLE.host)
            .opacity(sc),
          txt(
            'Real action still requires host permission',
            -840,
            286,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(sc),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('backup-outcome', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('backup-outcome').start, 0.25) }));
  });
  c.on('backup-question', () => {
    s.play(pulse.to(0.6, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.after('backup-count', () => {
    s.play(countReveal.to(1, { duration: clampDur(c, c.cue('backup-count').end, 0.3) }));
  });
  c.on('backup-sum', () => {
    s.play(sumReveal.to(1, { duration: clampDur(c, c.cue('backup-sum').start, 0.3) }));
  });
  c.show('backup-mean', meanEq, { after: true });
  c.after('backup-mean', () => {
    s.play(meanReveal.to(1, { duration: clampDur(c, c.cue('backup-mean').end, 0.35) }));
  });
  c.on('backup-parent', () => {
    s.play(parentUp.to(1, { duration: clampDur(c, c.cue('backup-parent').start, 0.35) }));
  });
  c.on('backup-scope', () => {
    s.play(scopeOn.to(1, { duration: clampDur(c, c.cue('backup-scope').start, 0.35) }));
  });
}
