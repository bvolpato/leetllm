// Scene 11: prefix - Reusable state depends on the full prefix
// Act 1: Separate requests sharing a system prompt via chained prefix hash lookup (+ model + tenant isolation).
// Act 2: Dramatic 200-request fan-in beams onto 31 shared full blocks (496 tok) + 200 private tails (4 tok):
//        6,400 -> 231 blocks (~96% fewer) + hit skips prefill except tail / last token + eviction.
import { delay, group, par, rect } from 'vizmatic/stage';
import {
  COSMOS,
  FULL_BLOCKS,
  NO_SHARING,
  PREFIX_BLOCK,
  PROMPT_TOKENS,
  REQUESTS,
  ROLE,
  TAIL_TOKENS,
  WARM,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  dashedRule,
  fmt,
  glowBar,
  guardedDynamic,
  hashOf,
  memCell,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function prefix(s, c) {
  const act1Vis = s.value(1);
  const act2Vis = s.value(0);

  // Act 1 state
  const pStep = s.value(0); // 1=branches, 2=separate, 3=same-text, 4=prefix-name, 5=keeps, 6=looks-up, 7=points
  const hStep = s.value(0); // 1=sentence, 2=before, 3=lookup, 4=model, 5=customer

  // Act 2 state
  const scaleStep = s.value(0); // 1=complete, 2=two-hundred, 3=full, 4=tail, 5=none, 6=warm, 7=fewer
  const hitStep = s.value(0); // 1=hit, 2=rest, 3=last, 4=evict

  const hA = hashOf('sys:v1|llama3|custA');
  const hB = hashOf('sys:v1|llama3|custB');

  const act1Header = cinemaHeader('PREFIX CACHING', 'Reusable state needs', 'the full prefix', {
    x: -860,
    y: -415,
    accent: ROLE.shared,
    size: 54,
  });

  const act1Aura = aura(120, 40, 620, '#ffd16624', '#5ce1e616');

  const act1Dyn = guardedDynamic(act1Vis, (a) => {
    const ps = pStep.value;
    const hs = hStep.value;
    const nodes = [];

    // Left: Incoming separate requests converging on retained gold prefix blocks
    const reqY = [-115, 25, 165];
    const reqLabels = ['Req 1: [System...]', 'Req 2: [System...]', 'Req 3: [System...]'];
    const reqCols = [ROLE.reqA, ROLE.reqB, ROLE.reqC];

    reqLabels.forEach((lbl, i) => {
      const active = i === 0 || ps >= 1.5;
      nodes.push(
        memCell(lbl, -630, reqY[i], {
          w: 360,
          h: 68,
          fill: active ? '#111b30' : '#0c1222',
          stroke: active ? reqCols[i] : '#24314f',
          textColor: active ? reqCols[i] : COSMOS.dim,
          glow: active ? 6 : 0,
          opacity: a,
        }),
      );
      if (ps >= 6.5) {
        const pts = quadArcPts([-444, reqY[i]], [-175, 25], (i - 1) * -35, 22);
        nodes.push(
          beamWithPhotons(pts, ROLE.shared, 0, {
            width: 3.4,
            glow: 9,
            photonCount: 2,
            alpha: a,
          }),
        );
      }
    });

    // Center: Retained Gold Prefix Cache Core
    const coreOn = ps >= 4.5;
    nodes.push(
      memCell(coreOn ? 'SHARED PREFIX BLOCKS' : 'KV CACHE POOL', 20, 25, {
        w: 370,
        h: 120,
        fill: coreOn ? '#2a210f' : '#10182b',
        stroke: coreOn ? ROLE.shared : '#324268',
        textColor: coreOn ? ROLE.shared : COSMOS.muted,
        size: 28,
        glow: coreOn ? 12 : 0,
        opacity: a,
      }),
    );

    if (ps >= 3.5) {
      nodes.push(
        txt(
          ps >= 5.5 ? 'Lookup prompt -> match' : 'PREFIX CACHING',
          20,
          -186,
          26,
          ROLE.shared,
          'mono',
        )
          .glow(6, ROLE.shared)
          .opacity(a),
      );
    }

    // Right: Chained Hash Key (Full Earlier Context + Model + Customer Isolation)
    if (hs >= 0.5) {
      const hAOpacity = a * Math.min(1, hs);
      nodes.push(
        dashedRule(255, -220, 255, 340, '#283657', 0.65 * hAOpacity),
        txt('CHAINED PREFIX HASH KEY', 565, -182, 26, ROLE.key, 'mono').opacity(hAOpacity),
      );
      const chain = [
        { show: hs >= 0.5, lbl: '1 lone sentence != match', col: ROLE.waste },
        { show: hs >= 1.5, lbl: 'K,V depend on ALL prior tokens', col: ROLE.focus },
        { show: hs >= 2.5, lbl: 'Key = hash(prev_blocks + tok)', col: ROLE.key },
        { show: hs >= 3.5, lbl: '+ model_id (weights version)', col: ROLE.prefill },
        { show: hs >= 4.5, lbl: `+ tenant salt: ${hA} != ${hB}`, col: ROLE.fresh },
      ];
      chain.forEach((row, idx) => {
        if (row.show) {
          nodes.push(
            txt(row.lbl, 300, -108 + idx * 78, 26, row.col, 'mono', 'left').opacity(hAOpacity),
          );
        }
      });
    }

    return group(...nodes);
  });

  // Act 2: 200-Request Fan-In Scale Visual (6,400 -> 231, ~96% fewer)
  const act2Header = cinemaHeader(
    'SCALE PAYOFF  ·  200 REQUESTS',
    'Shared full blocks,',
    'private tails',
    {
      x: -860,
      y: -454,
      accent: ROLE.fresh,
      size: 48,
    },
  );

  const act2Aura = aura(60, 20, 640, '#ffd16628', '#6ee7b71a');

  const act2Dyn = guardedDynamic(act2Vis, (a) => {
    const sc = scaleStep.value;
    const ht = hitStep.value;
    const nodes = [];

    // Left-to-right glowing fan-in constellation: 200 requests -> 31 shared full blocks -> 200 private tails
    const fanY = [-170, -102, -34, 34, 102, 170];
    const sharedCenter = [-45, 0];

    nodes.push(
      txt(
        `${REQUESTS} REQUESTS  (${PROMPT_TOKENS} tok · ${PREFIX_BLOCK}/blk)`,
        -610,
        -234,
        26,
        ROLE.reqA,
        'mono',
      ).opacity(a),
    );

    fanY.forEach((ry, idx) => {
      nodes.push(
        rect(220, 42, { fill: '#102536', stroke: ROLE.reqA, width: 1.8, radius: 8 })
          .at(-610, ry)
          .opacity(a * (sc >= 1.5 ? 1 : 0.45)),
        txt(
          idx === 5 ? `... Req #${REQUESTS}` : `Req #${idx + 1}`,
          -610,
          ry,
          26,
          ROLE.reqA,
          'mono',
        ).opacity(a * (sc >= 1.5 ? 1 : 0.45)),
      );
      if (sc >= 2.5) {
        const pts = quadArcPts([-495, ry], [-235, 0], ry * -0.18, 20);
        nodes.push(
          beamWithPhotons(pts, ROLE.shared, 0, {
            width: 3.0,
            glow: 9,
            photonCount: 1,
            alpha: a,
          }),
        );
      }
      if (sc >= 3.5) {
        const outPts = quadArcPts([145, 0], [365, ry], ry * -0.15, 20);
        nodes.push(
          beamWithPhotons(outPts, ROLE.reqC, 0, {
            width: 2.6,
            glow: 8,
            photonCount: 1,
            alpha: a,
          }),
          rect(236, 42, { fill: '#0e2923', stroke: ROLE.reqC, width: 1.8, radius: 8 })
            .at(490, ry)
            .opacity(a),
          txt(`Tail: ${TAIL_TOKENS} tok`, 490, ry, 26, ROLE.reqC, 'mono').opacity(a),
        );
      }
    });

    // Center glowing 31-block shared core
    nodes.push(
      rect(370, 146, {
        fill: sc >= 2.5 ? '#2e230d' : '#10182b',
        stroke: ROLE.shared,
        width: 3.0,
        radius: 16,
      })
        .at(sharedCenter[0], sharedCenter[1])
        .glow(12, ROLE.shared)
        .opacity(a),
      txt(`${FULL_BLOCKS} SHARED BLOCKS`, sharedCenter[0], -24, 28, ROLE.shared, 'mono')
        .glow(6, ROLE.shared)
        .opacity(a),
      txt(
        `${FULL_BLOCKS} × ${PREFIX_BLOCK} = ${FULL_BLOCKS * PREFIX_BLOCK} tokens`,
        sharedCenter[0],
        28,
        26,
        COSMOS.ink,
        'mono',
      ).opacity(a),
    );

    // Bottom Comparison Bars & Prefill Skip Strip (y = 250..428)
    if (sc >= 4.5) {
      nodes.push(
        txt(
          `No sharing: ${fmt(NO_SHARING)} blocks`,
          -855,
          264,
          26,
          ROLE.waste,
          'mono',
          'left',
        ).opacity(a),
        glowBar(-420, 264, 1260, 32, 1.0, { fill: ROLE.waste, glow: 8, opacity: a }),
      );
    }
    if (sc >= 5.5) {
      nodes.push(
        txt(`Warm cache: ${WARM} blocks`, -855, 322, 26, ROLE.fresh, 'mono', 'left')
          .glow(6, ROLE.fresh)
          .opacity(a),
        glowBar(-420, 322, 1260, 32, Math.max(0.05, WARM / NO_SHARING), {
          fill: ROLE.fresh,
          glow: 10,
          opacity: a,
        }),
      );
    }
    if (sc >= 6.5 && ht < 0.5) {
      nodes.push(
        txt(`${WARM} blocks (~96% fewer)`, 0, 398, 32, ROLE.shared, 'mono')
          .glow(8, ROLE.shared)
          .opacity(a),
      );
    }

    if (ht >= 0.5) {
      const msg =
        ht >= 3.5
          ? 'Eviction on pressure cools the cache; cold cache changes numbers'
          : ht >= 2.5
            ? 'Hit skips 496-tok prefill · tail + last token still run for next logits'
            : ht >= 1.5
              ? 'Hit skips matching prefix · unmatched tail still runs'
              : 'Cache hit skips prefill for matching prefix blocks';
      nodes.push(
        txt(msg, 0, 398, 28, ht >= 3.5 ? ROLE.link : ROLE.key, 'sans')
          .glow(6, ht >= 3.5 ? ROLE.link : ROLE.key)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(act1Aura, act1Header, act1Dyn, act2Dyn);

  // Beat 0 cues
  c.on('branches', () => {
    s.play(pStep.to(1, { duration: clampDur(c, c.cue('branches').start, 0.25) }));
  });
  c.on('separate', () => {
    s.play(pStep.to(2, { duration: clampDur(c, c.cue('separate').start, 0.25) }));
  });
  c.on('same-text', () => {
    s.play(pStep.to(3, { duration: clampDur(c, c.cue('same-text').start, 0.25) }));
  });
  c.on('prefix-name', () => {
    s.play(pStep.to(4, { duration: clampDur(c, c.cue('prefix-name').start, 0.25) }));
  });
  c.on('keeps', () => {
    s.play(pStep.to(5, { duration: clampDur(c, c.cue('keeps').start, 0.25) }));
  });
  c.on('looks-up', () => {
    s.play(pStep.to(6, { duration: clampDur(c, c.cue('looks-up').start, 0.25) }));
  });
  c.on('points', () => {
    s.play(pStep.to(7, { duration: clampDur(c, c.cue('points').start, 0.3) }));
  });

  // Beat 1 cues (Hash dependencies + model + customer isolation)
  c.on('sentence', () => {
    s.play(hStep.to(1, { duration: clampDur(c, c.cue('sentence').start, 0.25) }));
  });
  c.on('before', () => {
    s.play(hStep.to(2, { duration: clampDur(c, c.cue('before').start, 0.25) }));
  });
  c.on('lookup', () => {
    s.play(hStep.to(3, { duration: clampDur(c, c.cue('lookup').start, 0.25) }));
  });
  c.on('model', () => {
    s.play(hStep.to(4, { duration: clampDur(c, c.cue('model').start, 0.25) }));
  });
  c.on('customer', () => {
    s.play(hStep.to(5, { duration: clampDur(c, c.cue('customer').start, 0.25) }));
  });

  // Swap to Act 2 at "only complete blocks are shared"
  c.swap('complete', [act1Aura, act1Header], [act2Aura, act2Header]);
  c.on('complete', () => {
    const t = c.cue('complete').start;
    s.play(
      par(
        act1Vis.to(0, { duration: 0.16 }),
        delay(act2Vis.to(1, { duration: clampDur(c, t + 0.22, 0.28) }), 0.22),
        scaleStep.to(1, { duration: clampDur(c, t, 0.25) }),
      ),
    );
  });
  c.on('two-hundred', () => {
    s.play(scaleStep.to(2, { duration: clampDur(c, c.cue('two-hundred').start, 0.3) }));
  });
  c.on('full', () => {
    s.play(scaleStep.to(3, { duration: clampDur(c, c.cue('full').start, 0.3) }));
  });
  c.on('tail', () => {
    s.play(scaleStep.to(4, { duration: clampDur(c, c.cue('tail').start, 0.3) }));
  });
  c.after('none', () => {
    s.play(scaleStep.to(5, { duration: clampDur(c, c.cue('none').end, 0.25) }));
  });
  c.after('warm', () => {
    s.play(scaleStep.to(6, { duration: clampDur(c, c.cue('warm').end, 0.25) }));
  });
  c.after('fewer', () => {
    s.play(scaleStep.to(7, { duration: clampDur(c, c.cue('fewer').end, 0.25) }));
  });

  // Beat 3 cues (Hit skips prefill + last token + eviction)
  c.on('hit', () => {
    s.play(hitStep.to(1, { duration: clampDur(c, c.cue('hit').start, 0.25) }));
  });
  c.on('rest', () => {
    s.play(hitStep.to(2, { duration: clampDur(c, c.cue('rest').start, 0.25) }));
  });
  c.on('last', () => {
    s.play(hitStep.to(3, { duration: clampDur(c, c.cue('last').start, 0.25) }));
  });
  c.on('evict', () => {
    s.play(hitStep.to(4, { duration: clampDur(c, c.cue('evict').start, 0.25) }));
  });
}
