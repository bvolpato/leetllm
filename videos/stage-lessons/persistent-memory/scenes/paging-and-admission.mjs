// Scene 6: paging-and-admission - What makes room for another turn?
// Act 0 (MemGPT Paging): 5 entries in prompt queue; copying #3 to archive leaves ALL 5 in
// prompt (prediction pause!) -> folding 2 older turns into summary actually frees room!
// Act 1 (Write Admission + Pressure): Host admits billing test command, blocks merge_approved
// (count stays 1) alongside 70% warning / 100% flush pressure gauge.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowMeter,
  guardedDynamic,
  memNode,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function pagingAndAdmission(s, c) {
  const pulse = s.value(0);
  const archCopyOn = s.value(0);
  const evictFoldOn = s.value(0);
  const writeMode = s.value(0); // 0 = MemGPT paging, 1 = write gate + pressure meter
  const admitOk = s.value(0);
  const blockAuth = s.value(0);
  const warn70 = s.value(0);
  const flush100 = s.value(0);

  const header = cinemaHeader(
    'MEMGPT PAGING & WRITE GATE',
    'What makes room for',
    'another turn?',
    {
      accent: ROLE.prompt,
      size: 50,
    },
  );

  const stageAura = aura(160, 40, 620, '#5ce1e61e', '#fb923c1a');

  // Mode 0: 5-slot Queue + Archival Copy vs Actual Eviction Fold
  const mode0 = guardedDynamic(
    () => fadeOutHalf(writeMode.value),
    (a) => {
      const p = 0;
      const ac = archCopyOn.value;
      const ev = evictFoldOn.value;
      const nodes = [];

      const qX = -620;
      const qYs = [-145, -75, -5, 65, 135];
      const isFolded = ev > 0.45;

      nodes.push(
        txt(
          isFolded ? 'PROMPT QUEUE: 3 ENTRIES (FREED 2 SLOTS)' : 'PROMPT QUEUE: 5 ENTRIES',
          qX - 180,
          -205,
          26,
          isFolded ? ROLE.ok : ROLE.prompt,
          'mono',
          'left',
        ).opacity(a),
      );

      if (!isFolded) {
        qYs.forEach((y, i) => {
          const isNum3 = i === 2;
          const col = isNum3 ? ROLE.focus : ROLE.prompt;
          nodes.push(
            rect(480, 52, { fill: '#10182d', stroke: col, width: isNum3 ? 3 : 2, radius: 8 })
              .at(qX + 60, y)
              .glow(isNum3 ? 7 : 0, col)
              .opacity(a),
            txt(
              isNum3 ? '#3: Replay receipt (COPIED)' : `#${i + 1}: Queue entry`,
              qX - 155,
              y,
              26,
              col,
              'mono',
              'left',
            ).opacity(a),
          );
        });
      } else {
        const folded = [
          { y: -85, label: 'SUM: Folded turns #1-#2', col: ROLE.focus },
          { y: 5, label: '#4: Verbatim turn', col: ROLE.ok },
          { y: 95, label: '#5: Verbatim turn', col: ROLE.ok },
        ];
        folded.forEach((f) => {
          nodes.push(
            rect(480, 58, { fill: '#10182d', stroke: f.col, width: 2.6, radius: 8 })
              .at(qX + 60, f.y)
              .glow(6, f.col)
              .opacity(a),
            txt(f.label, qX - 155, f.y, 26, f.col, 'mono', 'left').opacity(a),
          );
        });
      }

      // Archival storage on right receiving COPY of #3
      const archPt = [480, -5];
      const mArch = memNode(archPt[0], archPt[1], 'ARCHIVE', ROLE.archive, {
        radius: 68,
        sub: ac > 0.35 ? 'Holds COPY of #3' : 'External recall store',
        opacity: a,
      });
      nodes.push(mArch.node);

      if (ac > 0.05) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([-310, -5], [archPt[0] - mArch.r - 14, -5], -45),
            ROLE.focus,
            p * 1.2,
            {
              alpha: a * ac,
              width: 3.6,
            },
          ),
        );
      }

      // Prediction prompt vs Eviction reveal
      if (ac > 0.3 && !isFolded) {
        nodes.push(
          txt(
            'Copied #3 to archive. How many entries are still in the prompt?',
            0,
            325,
            34,
            ROLE.focus,
            'serif',
            'center',
          )
            .glow(6, ROLE.focus)
            .opacity(a),
        );
      } else if (isFolded) {
        nodes.push(
          txt(
            'COPYING != EVICTING  ·  FOLDING OLDER TURNS FREES PROMPT ROOM',
            0,
            325,
            28,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(7, ROLE.ok)
            .opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 1: Host Memory Write Gate + 70% / 100% Pressure Gauge
  const mode1 = guardedDynamic(
    () => fadeInHalf(writeMode.value),
    (a) => {
      const ok = admitOk.value;
      const bl = blockAuth.value;
      const w70 = warn70.value;
      const f100 = flush100.value;
      const nodes = [];

      nodes.push(
        txt('HOST MEMORY WRITE ADMISSION', -840, -185, 26, ROLE.profile, 'mono', 'left').opacity(a),
        txt(
          '1. field: verification_command  (Ada billing)',
          -840,
          -110,
          28,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(a),
        txt(
          ok > 0.35 ? '-> ADMITTED (count = 1)' : '-> checking session, field, size, TTL...',
          -840,
          -60,
          28,
          ROLE.ok,
          'mono',
          'left',
        )
          .glow(ok > 0.35 ? 7 : 0, ROLE.ok)
          .opacity(a),

        txt(
          '2. field: merge_approved = true',
          -840,
          40,
          28,
          bl > 0.35 ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        txt(
          bl > 0.35
            ? '-> BLOCKED (authorization field! count stays 1)'
            : '-> policy service owns approval',
          -840,
          90,
          28,
          bl > 0.35 ? ROLE.fail : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(bl > 0.35 ? 8 : 0, ROLE.fail)
          .opacity(a),

        line([-840, 175], [840, 175], { stroke: '#25355a', width: 2 }).opacity(a * 0.65),
        txt(
          'MEMGPT CONTEXT PRESSURE THRESHOLDS',
          -840,
          225,
          26,
          ROLE.caution,
          'mono',
          'left',
        ).opacity(a * (0.45 + w70 * 0.55)),
        glowMeter(-840, 285, 1640, 34, f100 > 0.35 ? 1.0 : w70 > 0.35 ? 0.7 : 0.45, {
          fill: f100 > 0.35 ? ROLE.fail : w70 > 0.35 ? ROLE.caution : ROLE.prompt,
          opacity: a,
        }),
        txt('70% WARNING', -840 + 1640 * 0.7, 345, 26, ROLE.caution, 'mono', 'center').opacity(a),
        txt('100% FLUSH', 800, 345, 26, ROLE.fail, 'mono', 'right').opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);

  c.on('archive-insert', () => {
    s.play(archCopyOn.to(1, { duration: clampDur(c, c.cue('archive-insert').start, 0.4) }));
  });
  // Strict prediction withholding: fold AFTER spoken answer!
  c.after('evict-turns', () => {
    s.play(evictFoldOn.to(1, { duration: clampDur(c, c.cue('evict-turns').end, 0.45) }));
  });
  c.on('check-preference', () => {
    s.play(writeMode.to(1, { duration: clampDur(c, c.cue('check-preference').start, 0.35) }));
  });
  c.on('write-admitted', () => {
    s.play(admitOk.to(1, { duration: clampDur(c, c.cue('write-admitted').start, 0.35) }));
  });
  c.on('write-blocked', () => {
    s.play(blockAuth.to(1, { duration: clampDur(c, c.cue('write-blocked').start, 0.35) }));
  });
  c.on('queue-warning', () => {
    s.play(warn70.to(1, { duration: clampDur(c, c.cue('queue-warning').start, 0.35) }));
  });
  c.on('queue-flush', () => {
    s.play(flush100.to(1, { duration: clampDur(c, c.cue('queue-flush').start, 0.35) }));
  });
}
