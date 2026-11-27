// Scene 18: replan - The train on the plan
// Living transit dependency graph: History hours + History train feed Recommendation ->
// Cancellation strikes the train leg (prediction pause!) -> keep History hours receipt,
// invalidate only train + downstream recommendation -> replacement bus line restores route!
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

export default function replan(s, c) {
  const pulse = s.value(0);
  const trainOn = s.value(0);
  const cancelOn = s.value(0);
  const refreshReveal = s.value(0);
  const keepHours = s.value(0);
  const busOn = s.value(0);
  const recheckOn = s.value(0);

  const header = cinemaHeader('DEPENDENCY REPLANNING', 'The train on the plan', 'is cancelled', {
    accent: ROLE.fail,
    size: 48,
  });

  const stageAura = aura(160, 40, 620, '#ff6b8b1c', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const tr = trainOn.value;
      const cn = cancelOn.value;
      const rf = refreshReveal.value;
      const kh = keepHours.value;
      const bs = busOn.value;
      const rc = recheckOn.value;
      const nodes = [];

      const hrsPt = [-540, -100];
      const legPt = [-540, 140];
      const histPt = [40, 20];
      const recPt = [580, 20];

      const isCancelled = cn > 0.35 && bs < 0.35;
      const hrsCol = kh > 0.35 || bs > 0.35 ? ROLE.ok : ROLE.ok;
      const legCol = bs > 0.35 ? ROLE.ok : isCancelled ? ROLE.fail : ROLE.action;
      const recCol =
        rc > 0.35
          ? ROLE.ok
          : rf > 0.35 && bs < 0.35
            ? ROLE.fail
            : isCancelled
              ? ROLE.focus
              : ROLE.ok;

      const [h0, h1] = trimSeg(hrsPt, histPt, 62, 66);
      const [l0, l1] = trimSeg(legPt, histPt, 62, 66);
      const [r0, r1] = trimSeg(histPt, recPt, 66, 68);

      nodes.push(
        beamWithPhotons([h0, h1], hrsCol, p * 1.1, { width: 3.6 }),
        beamWithPhotons([l0, l1], legCol, p * 1.1 + 0.4, { alpha: 0.45 + tr * 0.55, width: 3.8 }),
        beamWithPhotons(quadArcPts(r0, r1, -20), recCol, p * 1.1 + 0.7, { width: 3.6 }),
        orbNode(hrsPt[0], hrsPt[1], 'HOURS', hrsCol, {
          radius: 56,
          sub: kh > 0.35 ? 'KEEP (still valid!)' : 'History · 13:00-18:00',
        }),
        orbNode(legPt[0], legPt[1], bs > 0.35 ? 'BUS' : 'TRAIN', legCol, {
          radius: 56,
          sub:
            bs > 0.35 ? 'Replacement bus line' : isCancelled ? 'CANCELLED!' : 'Transit to History',
        }),
        orbNode(histPt[0], histPt[1], 'HIST', ROLE.plan, {
          radius: 60,
          sub: 'Venue + day join',
        }),
        orbNode(
          recPt[0],
          recPt[1],
          rc > 0.35 ? 'RECHECK' : rf > 0.35 && bs < 0.35 ? 'INVALID' : 'PLAN',
          recCol,
          {
            radius: 62,
            sub:
              rc > 0.35
                ? 'Verify bus timetable'
                : rf > 0.35 && bs < 0.35
                  ? 'Lost train support'
                  : 'Visit advice',
          },
        ),
      );

      // Strict prediction withholding at bottom!
      if (isCancelled && rf < 0.05) {
        nodes.push(
          txt(
            'One lookup left: ask again for museum hours or a journey?',
            0,
            345,
            34,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (rf > 0.05 && bs < 0.35) {
        nodes.push(
          txt(
            'REFRESH JOURNEY ONLY · PRESERVE VALID HISTORY HOURS RECEIPT',
            0,
            345,
            28,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(7, ROLE.ok)
            .opacity(rf),
        );
      } else if (bs > 0.35) {
        nodes.push(
          txt(
            'REPLANNING: REPLACE BROKEN LEG + REOPEN DEPENDENT DECISION',
            0,
            345,
            28,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(7, ROLE.ok)
            .opacity(bs),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('replan-hours', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('replan-hours').start, 0.25) }));
  });
  c.on('replan-train', () => {
    s.play(trainOn.to(1, { duration: clampDur(c, c.cue('replan-train').start, 0.35) }));
  });
  c.on('replan-cancel', () => {
    s.play(cancelOn.to(1, { duration: clampDur(c, c.cue('replan-cancel').start, 0.35) }));
  });
  c.on('replan-predict', () => {
    s.play(cancelOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.after('replan-refresh', () => {
    s.play(refreshReveal.to(1, { duration: clampDur(c, c.cue('replan-refresh').end, 0.35) }));
  });
  c.on('replan-keep', () => {
    s.play(keepHours.to(1, { duration: clampDur(c, c.cue('replan-keep').start, 0.35) }));
  });
  c.on('replan-bus', () => {
    s.play(busOn.to(1, { duration: clampDur(c, c.cue('replan-bus').start, 0.35) }));
  });
  c.on('replan-bus-route', () => {
    s.play(busOn.to(1, { duration: 0.12 }));
  });
  c.on('replan-recheck', () => {
    s.play(recheckOn.to(1, { duration: clampDur(c, c.cue('replan-recheck').start, 0.35) }));
  });
}
