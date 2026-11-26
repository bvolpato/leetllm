// Scene 17: sse-identity - Give each replayable application event its own identity
// Shows HTTP SSE frames flowing into the browser Last-Event-ID register: omitted id inherits 12,
// empty `id:` clears the register, distinct `id: 13` repairs dedup, and Beat 2 POST->URL/fetch rules.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function sseIdentity(s, c) {
  const pulse = s.value(0);
  const startOn = s.value(0);
  const inheritOn = s.value(0);
  const beat1On = s.value(0);
  const clearOn = s.value(0);
  const repairOn = s.value(0);
  const beat2On = s.value(0);
  const reqOn = s.value(0);

  const header = cinemaHeader('SSE EVENT STREAM', 'Give every event its', 'own replay identity', {
    accent: ROLE.stream,
    size: 46,
  });

  const stageAura = aura(100, 40, 700, '#5ce1e61c', '#ffd16616');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const inh = inheritOn.value > 0.5;
      const b1 = beat1On.value > 0.5;
      const clr = clearOn.value > 0.5;
      const rep = repairOn.value > 0.5;
      const b2 = beat2On.value > 0.5;
      const rq = reqOn.value > 0.5;
      const nodes = [];

      nodes.push(
        txt('HTTP EVENT-STREAM FRAMES', -840, -238, 26, ROLE.stream, 'mono', 'left'),
        txt('BROWSER Last-Event-ID', 540, -238, 26, ROLE.focus, 'mono', 'center'),
      );

      const rows = [
        {
          idText: 'id: 12',
          dataText: 'data: progress',
          regVal: '12',
          col: ROLE.policy,
          regCol: ROLE.focus,
          show: true,
        },
        {
          idText: rep ? 'id: 13  (explicit distinct ID)' : '(id field omitted)',
          dataText: 'data: checked_claim',
          regVal: rep ? '13' : inh ? '12  (inherited!)' : 'pending',
          col: rep ? ROLE.ok : inh ? ROLE.caution : ROLE.query,
          regCol: rep ? ROLE.ok : inh ? ROLE.deny : COSMOS.dim,
          show: true,
        },
        {
          idText: 'id:   (explicit empty field)',
          dataText: 'data: marker',
          regVal: clr ? '""  (cleared)' : 'pending',
          col: ROLE.rewrite,
          regCol: clr ? ROLE.query : COSMOS.dim,
          show: b1 || clr || b2,
        },
      ];

      rows.forEach((row, i) => {
        if (!row.show) return;
        const y = -135 + i * 155;
        nodes.push(
          rect(940, 118, { fill: '#0d1527', stroke: row.col, width: 2.8, radius: 14 })
            .at(-370, y)
            .glow(6, row.col)
            .opacity(0.65 + 0.35 * startOn.value),
          txt(row.idText, -810, y - 24, 28, row.col, 'mono', 'left'),
          txt(row.dataText, -810, y + 26, 28, COSMOS.ink, 'mono', 'left'),

          beamWithPhotons(quadArcPts([110, y], [285, y], 0, 12), row.col, p + i * 0.3, {
            width: 3.2,
            glow: 7,
            photonCount: 1,
          }),

          rect(540, 108, { fill: '#0e1526', stroke: row.regCol, width: 2.8, radius: 14 })
            .at(570, y)
            .glow(6, row.regCol),
          txt(row.regVal, 570, y, 30, row.regCol, 'mono', 'center'),
        );
      });

      // Bottom guidance bar
      let msg = 'An explicit id updates the buffer; omitting id inherits the previous value.';
      let msgCol = COSMOS.muted;
      if (b2) {
        msg = rq
          ? 'Native EventSource uses GET URL -> create request then subscribe, or use fetch streaming for POST.'
          : 'Re-authenticate replay, bind cursor to request + principal, keep secrets out of URLs.';
        msgCol = ROLE.ok;
      } else if (rep) {
        msg =
          'Emit distinct replay IDs (12, 13) or validate a separate application event identity.';
        msgCol = ROLE.ok;
      } else if (clr) {
        msg = 'Empty "id:" resets Last-Event-ID so reconnect sends no stale cursor.';
        msgCol = ROLE.query;
      } else if (inh) {
        msg = 'WARNING: both events expose ID 12 -> blind dedup discards the checked claim!';
        msgCol = ROLE.deny;
      }

      nodes.push(
        txt(msg, -840, 382, 28, msgCol, 'serif', 'left').glow(inh || rep || b2 ? 6 : 0, msgCol),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('se-sse-identity-0', () => {
    s.play(startOn.to(1, { duration: clampDur(c, c.cue('se-sse-identity-0').start, 0.35) }));
  });
  c.on('se-sse-identity-inherited', () => {
    s.play(
      inheritOn.to(1, { duration: clampDur(c, c.cue('se-sse-identity-inherited').start, 0.35) }),
    );
  });
  c.on('se-sse-identity-1', () => {
    s.play(beat1On.to(1, { duration: clampDur(c, c.cue('se-sse-identity-1').start, 0.3) }));
  });
  c.on('se-sse-identity-clear', () => {
    s.play(clearOn.to(1, { duration: clampDur(c, c.cue('se-sse-identity-clear').start, 0.3) }));
  });
  c.on('se-sse-identity-repair', () => {
    s.play(repairOn.to(1, { duration: clampDur(c, c.cue('se-sse-identity-repair').start, 0.3) }));
  });
  c.on('se-sse-identity-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-sse-identity-2').start, 0.3) }));
  });
  c.on('se-sse-identity-request', () => {
    s.play(reqOn.to(1, { duration: clampDur(c, c.cue('se-sse-identity-request').start, 0.3) }));
  });
}
