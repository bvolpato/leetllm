// Scene 1: intro: "How much of the stream did one write supply?"
// Twin glowing residual stream highways: an identical +1 write docking onto a 1-unit stream
// (supplying 1/2) vs hovering poised above an 8-unit stream until AFTER the spoken "One ninth" cue.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  alignedWriteState,
  cinemaAtmosphere,
  lumBar,
  playCue,
  scenePulse,
} from '../parts.mjs';

export default function intro(s, c) {
  const early = alignedWriteState({ beat: 0, beatP: 0 }); // streamNorm = 1
  const late = alignedWriteState({ beat: 1, beatP: 1 }); // streamNorm = 8

  const title = heroTitle(['How much of the stream', 'did one write supply?'], {
    x: -850,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.write,
  });

  // Reactive scene animation parameters
  const firstDock = s.value(0); // 0 -> 1 docks +1 onto 1
  const firstShareVis = s.value(0); // reveals 1/2
  const lateBarGrow = s.value(0); // 0 -> 1 illuminates 8-unit accumulated stream
  const eighthHover = s.value(0); // 0 -> 1 brings pending +1 tile into poised hover
  const eighthDock = s.value(0); // 0 -> 1 docks +1 onto 8 -> 9 (AFTER eighth-share!)
  const eighthReveal = s.value(0); // reveals 1/9 and Pre-LN teaser (AFTER eighth-share!)
  const pulse = s.value(0);

  const stageVis = s.value(1);

  const leftX = -830;
  const unit = 122; // 9 units = 1098 px (-830 .. +268)
  const barH = 88;
  const topY = -120;
  const botY = 175;
  const shareX = 635;

  const highwayLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const p = pulse.value;
    const fd = firstDock.value;
    const fsv = firstShareVis.value;
    const lg = lateBarGrow.value;
    const eh = eighthHover.value;
    const ed = eighthDock.value;
    const er = eighthReveal.value;

    // Column caption on right
    nodes.push(
      txt('Share from this write', shareX, -278, 30, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Token feature 1 (others = 0)', leftX, -278, 28, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),
    );

    // Continuous luminous baseline tracks spanning full width
    [topY, botY].forEach((ry, idx) => {
      const trackY = ry + barH / 2 + 26;
      const runnerX = leftX + ((p * 2.4 + idx * 0.45) % 1) * 1120;
      nodes.push(
        glowingTrail(
          [
            [leftX, trackY],
            [leftX + 9 * unit + 20, trackY],
          ],
          { color: '#2b3c68', width: 2.2, glow: 4, core: false, opacity: 0.72 * alpha },
        ),
        glowDot(runnerX, trackY, {
          radius: 5,
          color: idx === 0 ? ROLE.write : ROLE.stream,
          glow: 10,
          opacity: 0.75 * alpha,
        }),
      );
      for (let tick = 0; tick <= 9; tick++) {
        const tx = leftX + tick * unit;
        nodes.push(
          line([tx, trackY - 7], [tx, trackY + 7], { stroke: '#4c6091', width: 2 }).opacity(
            0.7 * alpha,
          ),
        );
      }
    });

    // ROW 1: First write (1 + 1 = 2)
    nodes.push(txt('First write', leftX, topY - 76, 32, ROLE.write, 'sans', 'left').opacity(alpha));
    const earlyW = early.streamNorm * unit;
    nodes.push(
      lumBar(leftX + earlyW / 2, topY, earlyW - 6, barH, {
        color: ROLE.stream,
        fillOpacity: 0.36,
        strokeWidth: 2.8,
        glow: 9,
        opacity: alpha,
      }),
      txt('1', leftX + earlyW / 2, topY, 44, COSMOS.ink, 'mono', 'center').opacity(alpha),
    );

    // Docking +1 tile for Row 1
    const t1X = leftX + earlyW + unit / 2 + (1 - fd) * 260;
    const t1Y = topY - (1 - fd) * 56;
    nodes.push(
      lumBar(t1X, t1Y, unit - 6, barH, {
        color: ROLE.write,
        fillOpacity: 0.48,
        strokeWidth: 3,
        glow: 12,
        opacity: alpha,
      }),
      txt('+1', t1X, t1Y, 40, COSMOS.ink, 'mono', 'center').opacity(alpha),
    );
    if (fd > 0.85) {
      nodes.push(
        txt('total = 2', leftX + 2 * unit + 28, topY, 28, ROLE.write, 'mono', 'left').opacity(
          ((fd - 0.85) / 0.15) * alpha,
        ),
      );
    }

    // Row 1 fraction readout
    if (fsv > 0.05) {
      nodes.push(
        txt('1 / 2', shareX, topY - 10, 64, ROLE.write, 'mono', 'center')
          .glow(10, ROLE.write)
          .opacity(fsv * alpha),
        txt('50%', shareX, topY + 52, 30, COSMOS.muted, 'mono', 'center').opacity(fsv * alpha),
      );
    } else {
      nodes.push(txt('?', shareX, topY, 64, COSMOS.dim, 'mono', 'center').opacity(alpha));
    }

    // ROW 2: Eighth write (8 + 1 = ?)
    nodes.push(
      txt('Eighth write', leftX, botY - 78, 32, ROLE.stream, 'sans', 'left').opacity(alpha),
    );
    const activeSegs = 1 + lg * (late.streamNorm - 1);
    const activeW = activeSegs * unit;
    const fullLateW = late.streamNorm * unit;

    // Ghost 8-unit outline + continuous glowing stream bar (zero seams crossing the centered label)
    nodes.push(
      lumBar(leftX + fullLateW / 2, botY, fullLateW - 6, barH, {
        color: ROLE.stream,
        fillOpacity: 0.08,
        strokeWidth: 1.6,
        glow: 3,
        opacity: 0.45 * alpha,
      }),
      lumBar(leftX + activeW / 2, botY, activeW - 6, barH, {
        color: ROLE.stream,
        fillOpacity: 0.36,
        strokeWidth: 2.8,
        glow: 9,
        opacity: alpha,
      }),
    );
    const streamLabel = lg > 0.5 ? String(late.streamNorm) : '1';
    nodes.push(
      txt(streamLabel, leftX + activeW / 2, botY, 46, COSMOS.ink, 'mono', 'center')
        .glow(6, ROLE.stream)
        .opacity(alpha),
    );

    // Pending +1 tile hovering above unit 8 -> docks onto unit 9 AFTER eighth-share!
    if (eh > 0.02) {
      const hoverFloat = Math.sin(p * Math.PI * 10) * 6 * (1 - ed);
      const t2X = leftX + late.streamNorm * unit + unit / 2 + (1 - ed) * 42;
      const t2Y = botY - (1 - ed) * 108 + hoverFloat;
      const tileCol = ROLE.gold;
      nodes.push(
        lumBar(t2X, t2Y, unit - 6, barH, {
          color: tileCol,
          fillOpacity: 0.45,
          strokeWidth: 3,
          glow: 13,
          opacity: eh * alpha,
        }),
        txt('+1', t2X, t2Y, 40, COSMOS.ink, 'mono', 'center').opacity(eh * alpha),
      );
      if (ed < 0.05) {
        nodes.push(
          txt('What share of the new total?', 0, 385, 38, ROLE.gold, 'serif', 'center')
            .glow(8, ROLE.gold)
            .opacity(eh * alpha),
        );
      }
    }

    // Row 2 fraction readout (strictly withheld until AFTER eighth-share!)
    if (er > 0.05) {
      nodes.push(
        txt('1 / 9', shareX, botY - 10, 68, ROLE.gold, 'mono', 'center')
          .glow(12, ROLE.gold)
          .opacity(er * alpha),
        txt('11.1%  (total = 9)', shareX, botY + 54, 28, COSMOS.muted, 'mono', 'center').opacity(
          er * alpha,
        ),
        txt(
          'Pre-LN stream keeps growing -> what reaches the prediction head?',
          0,
          385,
          32,
          ROLE.write,
          'sans',
          'center',
        )
          .glow(6, ROLE.write)
          .opacity(er * alpha),
      );
    } else {
      nodes.push(txt('?', shareX, botY, 68, ROLE.gold, 'mono', 'center').opacity(alpha));
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.stream, ROLE.gold), title, highwayLayer);
  scenePulse(s, c, pulse);

  // Beat 0: First write docks onto 1 -> 2, revealing 1/2 AFTER first-share
  playCue(s, c, 'first-write', (d) => s.play(firstDock.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'first-share', (d) => s.play(firstShareVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  // Beat 1: Residual stream grows to 8, eighth write hovers waiting (answer withheld!)
  playCue(s, c, 'existing-stream', (d) => s.play(lateBarGrow.to(1, { duration: d })), {
    dur: 0.85,
  });
  playCue(s, c, 'eighth-waiting', (d) => s.play(eighthHover.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 2: Strictly AFTER "One ninth" cue, dock the eighth write and reveal 1/9
  playCue(
    s,
    c,
    'eighth-share',
    (d) => s.play(eighthDock.to(1, { duration: d }), eighthReveal.to(1, { duration: d })),
    { after: true, dur: 0.55 },
  );
}
