// Scene 15: explicit-plan - Which station does this ticket reach?
// Illuminated transit dependency map: Hours receipt points to History while Train ticket
// terminates at Art (prediction pause!) -> mismatch rejected -> new History train line
// snaps onto the History stop, unlocking the recommendation step!
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  orbNode,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function explicitPlan(s, c) {
  const pulse = s.value(0);
  const hoursIn = s.value(0);
  const artRouteOn = s.value(0);
  const mismatchReveal = s.value(0);
  const newTrainOn = s.value(0);
  const unlockReveal = s.value(0);
  const hybridOn = s.value(0);

  const header = cinemaHeader(
    'EXPLICIT PLAN DEPENDENCIES',
    'Which station does',
    'this ticket reach?',
    { accent: ROLE.plan, size: 50 },
  );

  const stageAura = aura(180, 40, 620, '#60a5fa1e', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const hi = hoursIn.value;
      const ar = artRouteOn.value;
      const mm = mismatchReveal.value;
      const nt = newTrainOn.value;
      const ul = unlockReveal.value;
      const hy = hybridOn.value;
      const nodes = [];

      const startPt = [-600, 120];
      const artPt = [-60, -90];
      const histPt = [160, 140];
      const recPt = [640, 20];

      // Train line to Art (mismatched destination!)
      const [sa0, sa1] = trimSeg(startPt, artPt, 58, 58);
      nodes.push(
        beamWithPhotons([sa0, sa1], mm > 0.35 && nt < 0.35 ? ROLE.fail : ROLE.caution, p * 1.1, {
          alpha: 0.3 + ar * 0.7,
          width: 3.4,
        }),
        orbNode(startPt[0], startPt[1], 'START', ROLE.host, { radius: 52 }),
        orbNode(artPt[0], artPt[1], 'ART', mm > 0.35 ? ROLE.fail : ROLE.caution, {
          radius: 52,
          sub: ar > 0.3 ? 'Train terminates here' : 'Art Museum',
          opacity: 0.4 + ar * 0.6,
        }),
      );

      // History stop (Hours receipt open until 18:00)
      nodes.push(
        orbNode(histPt[0], histPt[1], 'HIST', ROLE.ok, {
          radius: 58,
          sub: hi > 0.3 ? 'Hours: today -> 18:00' : 'Step 1: Hours',
        }),
      );

      // New matching train line to History!
      if (nt > 0.05) {
        const [sh0, sh1] = trimSeg(startPt, histPt, 58, 64);
        nodes.push(
          beamWithPhotons([sh0, sh1], ROLE.ok, p * 1.2, { alpha: nt, width: 4.2 }),
          txt('FEASIBLE TRAIN -> HISTORY', -220, 190, 26, ROLE.ok, 'mono', 'center')
            .glow(6, ROLE.ok)
            .opacity(nt),
        );
      }

      // Join to Recommendation node
      const [hr0, hr1] = trimSeg(histPt, recPt, 64, 68);
      nodes.push(
        beamWithPhotons(quadArcPts(hr0, hr1, -24), ul > 0.35 ? ROLE.ok : '#2e3f68', p * 1.1 + 0.4, {
          alpha: ul > 0.35 ? 1 : 0.35,
          width: 3.6,
        }),
        orbNode(
          recPt[0],
          recPt[1],
          ul > 0.35 ? 'READY' : 'LOCKED',
          ul > 0.35 ? ROLE.ok : COSMOS.dim,
          {
            radius: 62,
            sub: ul > 0.35 ? 'Same venue & day!' : 'Recommend visit',
          },
        ),
      );

      // Bottom prediction prompt / diagnosis
      if (ar > 0.3 && mm < 0.05) {
        nodes.push(
          txt(
            '2 completed lookups (History hours + Art train). Can we join them?',
            0,
            350,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (mm > 0.05 && ul < 0.35) {
        nodes.push(
          txt(
            'DESTINATIONS DIFFER: HISTORY != ART  ·  KEEP HOURS, REFRESH TRAIN',
            0,
            350,
            28,
            ROLE.fail,
            'mono',
            'center',
          )
            .glow(8, ROLE.fail)
            .opacity(mm),
        );
      } else if (ul > 0.35) {
        nodes.push(
          txt(
            hy > 0.35
              ? 'HYBRID: PLAN TRACKS DEPENDENCIES · SHORT LOOP HANDLES TIMETABLES INSIDE A STEP'
              : 'BOTH RECEIPTS MATCH HISTORY TODAY -> RECOMMENDATION UNLOCKED',
            0,
            350,
            26,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(7, ROLE.ok)
            .opacity(ul),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('plan-hours', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('plan-hours').start, 0.25) }));
  });
  c.on('plan-journey', () => {
    s.play(pulse.to(0.6, { duration: clampDur(c, c.cue('plan-journey').start, 0.25) }));
  });
  c.on('plan-hours-in', () => {
    s.play(hoursIn.to(1, { duration: clampDur(c, c.cue('plan-hours-in').start, 0.35) }));
  });
  c.on('plan-art', () => {
    s.play(artRouteOn.to(1, { duration: clampDur(c, c.cue('plan-art').start, 0.35) }));
  });
  c.on('plan-question', () => {
    s.play(artRouteOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.after('plan-mismatch', () => {
    s.play(mismatchReveal.to(1, { duration: clampDur(c, c.cue('plan-mismatch').end, 0.35) }));
  });
  c.on('plan-new-train', () => {
    s.play(newTrainOn.to(0.5, { duration: clampDur(c, c.cue('plan-new-train').start, 0.3) }));
  });
  c.on('plan-return', () => {
    s.play(newTrainOn.to(1, { duration: clampDur(c, c.cue('plan-return').start, 0.35) }));
  });
  c.on('plan-match', () => {
    s.play(newTrainOn.to(1, { duration: 0.12 }));
  });
  c.after('plan-unlock', () => {
    s.play(unlockReveal.to(1, { duration: clampDur(c, c.cue('plan-unlock').end, 0.35) }));
  });
  c.on('plan-hybrid', () => {
    s.play(hybridOn.to(1, { duration: clampDur(c, c.cue('plan-hybrid').start, 0.35) }));
  });
}
