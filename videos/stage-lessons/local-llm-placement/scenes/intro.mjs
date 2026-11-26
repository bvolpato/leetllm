// Scene 01: intro: 4th incident log OOM on 24 GB GPU -> worksheet (7.6 weights + 2.0 work + 4x0.604 KV = 12.016 GB < 19.2 GB).
import {
  COSMOS,
  MEM_CAP_4,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const showWork = s.value(0);
  const revealTotal = s.value(0); // strictly withheld until AFTER workload-state!
  const showPeakCheck = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Why Did the Fourth', 'Incident Log OOM?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.work,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const wk = showWork.value;
    const rev = revealTotal.value;
    const pk = showPeakCheck.value;
    const barX = -780;
    const maxW = 1440; // 24 GB full card width
    const pxPerGb = maxW / 24;
    const reserveX = barX + 19.2 * pxPerGb;

    const wW = MEM_CAP_4.weights * pxPerGb;
    const workW = MEM_CAP_4.workspace * pxPerGb;
    const kvW = MEM_CAP_4.kv * pxPerGb;

    const nodes = [
      txt(
        '24 GB GPU WORKSHEET  (YELLOW LINE = 19.2 GB PLANNING LIMIT, 20% RESERVE)',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),

      // 4 incident log chips across top
      chipPill('Log 1 (16k)', -650, -135, {
        w: 280,
        h: 66,
        color: ROLE.vram,
        size: 26,
        opacity: alpha,
      }),
      chipPill('Log 2 (16k)', -335, -135, {
        w: 280,
        h: 66,
        color: ROLE.vram,
        size: 26,
        opacity: alpha,
      }),
      chipPill('Log 3 (16k)', -20, -135, {
        w: 280,
        h: 66,
        color: ROLE.vram,
        size: 26,
        opacity: alpha,
      }),
      chipPill(rev > 0.4 ? 'Log 4: FITS WORKSHEET' : 'Log 4: OOM ERROR!', 355, -135, {
        w: 400,
        h: 66,
        color: rev > 0.4 ? ROLE.ok : ROLE.work,
        fill: rev > 0.4 ? '#0f2d24' : '#301420',
        size: 26,
        glow: 10,
        opacity: alpha,
      }),

      // Main 24 GB device budget bar
      rect(maxW, 64, { fill: '#0e162a', stroke: '#2c426e', width: 2.2, radius: 10 })
        .at(barX + maxW * 0.5, 15)
        .opacity(alpha),
      // Weights (7.6 GB)
      rect(wW, 56, { fill: ROLE.weights, stroke: null, radius: 6 })
        .at(barX + wW * 0.5, 15)
        .glow(8, ROLE.weights)
        .opacity(alpha),
      txt('Weights 7.6 GB', barX + wW * 0.5, 15, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),

      // Workspace (2.0 GB)
      rect(workW, 56, { fill: ROLE.work, stroke: null, radius: 6 })
        .at(barX + wW + workW * 0.5, 15)
        .opacity(alpha * (0.3 + 0.7 * wk)),
      txt('2.0', barX + wW + workW * 0.5, 15, 26, COSMOS.ink, 'mono', 'center').opacity(
        alpha * (0.3 + 0.7 * wk),
      ),

      // 4x KV Cache (~2.42 GB), withheld until workload-state!
      rect(rev > 0.4 ? kvW : 16, 56, { fill: ROLE.vram, stroke: null, radius: 6 })
        .at(barX + wW + workW + (rev > 0.4 ? kvW * 0.5 : 8), 15)
        .glow(rev > 0.4 ? 10 : 0, ROLE.vram)
        .opacity(alpha * (rev > 0.4 ? 1 : 0.25)),

      // 19.2 GB yellow planning limit marker
      lumBar(reserveX - 2, 15, 4, 110, ROLE.gold, { opacity: alpha, glow: 8 }),
      txt('19.2 GB limit', reserveX, -62, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('24 GB card', barX + maxW, -62, 26, ROLE.work, 'mono', 'right').opacity(alpha),

      // Bottom readout (withheld until workload-state!)
      chipPill(
        rev > 0.4
          ? `Total = ${MEM_CAP_4.total.toFixed(2)} GB  (ALL 4 FIT!)`
          : 'Will all 4 logs fit under 19.2 GB?',
        -350,
        165,
        {
          w: 780,
          h: 76,
          color: rev > 0.4 ? ROLE.ok : ROLE.gold,
          fill: rev > 0.4 ? '#0f2d24' : '#261e10',
          size: 30,
          glow: 10,
          opacity: alpha,
        },
      ),
      chipPill(
        pk > 0.3 ? 'Audit reserved KV + peak workspace!' : '1 shared weight copy + 4 KV strips',
        450,
        165,
        {
          w: 720,
          h: 76,
          color: pk > 0.3 ? ROLE.vram : COSMOS.rule,
          size: 28,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'failed-request', (d) => s.play(showWork.to(0, { duration: d })));
  playCue(s, c, 'short-answer', (d) => s.play(showWork.to(0, { duration: d })));
  playCue(s, c, 'shared-model', (d) => s.play(showWork.to(0.2, { duration: d })));
  playCue(s, c, 'working-allocation', (d) => s.play(showWork.to(1, { duration: d })));
  playCue(s, c, 'ask-fit', (d) => s.play(showWork.to(1, { duration: d })));
  // Strict prediction withholding: reveal 12.02 GB total & fit verdict only after workload-state!
  playCue(s, c, 'workload-state', (d) => s.play(revealTotal.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'check-peak', (d) => s.play(showPeakCheck.to(1, { duration: d })));
}
