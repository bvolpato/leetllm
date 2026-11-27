// Scene 3: state-record - What came back from History?
// Paired outbound request & returned receipt linked by call_id hours-24, feeding a
// glowing afternoon clock ruler marking 13:00 opens, 17:00 user deadline, 18:00 closing.
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  VISIT_HOURS,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  clock,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function stateRecord(s, c) {
  const pulse = s.value(0);
  const replyOn = s.value(0);
  const hoursOn = s.value(0);
  const closeOn = s.value(0);
  const limitOn = s.value(0);

  const header = cinemaHeader('CALL RECEIPT RECORD', 'What came back', 'from History?', {
    accent: ROLE.ok,
    size: 50,
  });

  const stageAura = aura(180, 40, 620, '#6ee7b71c', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const rp = replyOn.value;
      const hr = hoursOn.value;
      const cl = closeOn.value;
      const lm = limitOn.value;
      const nodes = [];

      // Left outbound rail & Right returned receipt rail linked by call_id hours-24
      nodes.push(
        line([-840, -150], [-840, 5], { stroke: ROLE.host, width: 5 }).glow(8, ROLE.host),
        txt(`OUTBOUND · ${VISIT_HOURS.id}`, -810, -135, 26, ROLE.host, 'mono', 'left'),
        txt('tool: get_hours', -810, -84, 28, COSMOS.ink, 'mono', 'left'),
        txt('venue: History · day: today', -810, -34, 28, COSMOS.muted, 'mono', 'left'),
        beamWithPhotons(
          [
            [-260, -75],
            [60, -75],
          ],
          rp > 0.3 ? ROLE.ok : ROLE.host,
          p * 1.1,
          { width: 3.6 },
        ),
        line([90, -150], [90, 5], {
          stroke: rp > 0.3 ? ROLE.ok : '#304068',
          width: 5,
        }).glow(rp > 0.3 ? 8 : 0, ROLE.ok),
        txt(
          `RECEIPT · ${VISIT_HOURS.id}`,
          120,
          -135,
          26,
          rp > 0.3 ? ROLE.ok : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      if (rp < 0.35) {
        nodes.push(txt('[ waiting for reply... ]', 120, -64, 30, COSMOS.dim, 'mono', 'left'));
      } else {
        nodes.push(
          txt(
            `open: ${clock(VISIT_HOURS.opens)} - ${clock(VISIT_HOURS.closes)}`,
            120,
            -84,
            30,
            ROLE.ok,
            'mono',
            'left',
          )
            .glow(6, ROLE.ok)
            .opacity(rp),
          txt(
            'venue: History · day: today · ts recorded',
            120,
            -34,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(rp),
        );
      }

      // Afternoon Clock Ruler (12:00 = 720 -> 19:00 = 1140)
      const rY = 195;
      const x0 = -760;
      const x1 = 760;
      const mapT = (mins) => x0 + ((mins - 720) / (1140 - 720)) * (x1 - x0);
      const xOpen = mapT(VISIT_HOURS.opens); // 13:00
      const xDead = mapT(1020); // 17:00
      const xClose = mapT(VISIT_HOURS.closes); // 18:00

      nodes.push(
        txt('AFTERNOON CLOCK RULER', -760, rY - 90, 26, COSMOS.muted, 'mono', 'left'),
        line([x0, rY], [x1, rY], { stroke: '#2d3f6b', width: 5 }),
      );

      if (hr > 0.05) {
        nodes.push(
          line([xOpen, rY], [xClose, rY], { stroke: ROLE.ok, width: 7 })
            .glow(10, ROLE.ok)
            .opacity(hr),
          circle(11, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5 }).at(xOpen, rY).opacity(hr),
          txt('13:00 OPENS', xOpen, rY + 46, 26, ROLE.ok, 'mono', 'center').opacity(hr),
        );
      }
      if (cl > 0.05) {
        nodes.push(
          line([xClose, rY - 46], [xClose, rY + 46], { stroke: ROLE.action, width: 4 })
            .glow(8, ROLE.action)
            .opacity(cl),
          txt('18:00 CLOSES (SERVICE)', xClose, rY - 72, 26, ROLE.action, 'mono', 'center').opacity(
            cl,
          ),
        );
      }
      if (lm > 0.05) {
        nodes.push(
          line([xDead, rY - 46], [xDead, rY + 46], { stroke: ROLE.focus, width: 4, dash: [6, 6] })
            .glow(9, ROLE.focus)
            .opacity(lm),
          txt('17:00 DEADLINE (USER)', xDead, rY + 86, 26, ROLE.focus, 'mono', 'center')
            .glow(6, ROLE.focus)
            .opacity(lm),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('record-request', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('record-request').start, 0.25) }));
  });
  c.on('record-empty', () => {
    s.play(pulse.to(0.6, { duration: clampDur(c, c.cue('record-empty').start, 0.25) }));
  });
  c.on('record-reply', () => {
    s.play(replyOn.to(1, { duration: clampDur(c, c.cue('record-reply').start, 0.35) }));
  });
  c.on('record-hours', () => {
    s.play(hoursOn.to(1, { duration: clampDur(c, c.cue('record-hours').start, 0.35) }));
  });
  c.on('record-close', () => {
    s.play(closeOn.to(1, { duration: clampDur(c, c.cue('record-close').start, 0.35) }));
  });
  c.on('record-limit', () => {
    s.play(limitOn.to(1, { duration: clampDur(c, c.cue('record-limit').start, 0.35) }));
  });
}
