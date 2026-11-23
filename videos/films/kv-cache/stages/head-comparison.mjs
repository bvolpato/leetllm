import {
  concat,
  dynamic,
  fade,
  fadeIn,
  indicate,
  line,
  Node,
  rect,
  rectPath,
  smoother,
  tex,
  to,
} from 'vizmatic/stage';
import {
  KIB,
  fmt,
  bytesPerToken,
  LAYERS,
  HEADS,
  HEAD_SIZE,
  BIG_LAYERS,
  BIG_QUERY_HEADS,
  billFor,
} from '../model.mjs';
export function buildHeadComparison(
  stage,
  shrink,
  { M, S, place, crossfade, fadeOut, frameBar, growBar, arrive, handoff },
  {
    tokens,
    keyValue,
    layers,
    heads,
    LENGTH,
    HEIGHT,
    DEPTH,
    autoZoom,
    zoomHold,
    heldZoom,
    measure,
    stack,
    stages,
  },
  { firstParts },
) {
  // The formula from the size scene, with its colors and captions, for the 70B shape.
  const FX = -850,
    FY = -338,
    TERM = 92;
  const fTerm = (math, color) =>
    tex(math, {
      size: TERM,
      color,
    });
  const fLeft = fTerm('2', 'blue'),
    fLayers = fTerm(`\\times\\, ${BIG_LAYERS}`, 'yellow'),
    fHeads = [64, 8, 1].map((value) => fTerm(`\\times\\, ${value}`, 'teal')),
    fNumbers = fTerm(`\\times\\, ${HEAD_SIZE}`, 'green'),
    fBytes = [2, 1].map((value) => fTerm(`\\times\\, ${value}`, 'orange'));
  const slotWidths = [
    fLeft.width,
    fLayers.width,
    fHeads[0].width,
    fNumbers.width,
    fBytes[0].width,
  ];
  const slotAt = (i) =>
    FX + slotWidths.slice(0, i).reduce((sum2, width) => sum2 + width + 26, 0);
  const placeTerm = (node, i) => node.moveTo([slotAt(i) + slotWidths[i] / 2, FY]);
  placeTerm(fLeft, 0);
  placeTerm(fLayers, 1);
  fHeads.forEach((node) => placeTerm(node, 2));
  placeTerm(fNumbers, 3);
  fBytes.forEach((node) => placeTerm(node, 4));
  const captionOf = (name, color, i) =>
    i === 4
      ? place(
          S(name, {
            size: 38,
            color,
          }),
          slotAt(i),
          FY + 76,
        )
      : S(name, {
          size: 38,
          color,
        }).at(slotAt(i) + slotWidths[i] / 2, FY + 76);
  const fCaptions = [
    captionOf('K, V', 'blue', 0),
    captionOf('layers', 'yellow', 1),
    captionOf('KV heads', 'teal', 2),
    captionOf('numbers', 'green', 3),
  ];
  const byteCaptions = [
    captionOf('bytes, FP16', 'orange', 4),
    captionOf('bytes, 8 bit', 'orange', 4),
  ];
  const RESULT = slotAt(4) + slotWidths[4] + 30;
  const fResult = (math) =>
    tex(math, {
      size: 76,
      color: 'ink',
    })
      .moveTo([0, FY])
      .alignTo([RESULT, 0], 'left');
  const kibText = (value) => `= ${fmt(value).replace(',', '{,}')}\\ \\text{KiB per token}`;
  const r320 = fResult(kibText(billFor(8))),
    rAsk = fResult('= \\ ?'),
    rAsk2 = fResult('= \\ ?'),
    rAsk3 = fResult('= \\ ?'),
    r2560 = fResult(kibText(billFor(BIG_QUERY_HEADS))),
    r320b = fResult(kibText(billFor(8))),
    r40 = fResult(kibText(billFor(1))),
    r320c = fResult(kibText(billFor(8))),
    r160 = fResult(
      kibText(
        bytesPerToken({
          layers: BIG_LAYERS,
          heads: 8,
          bytes: 1,
        }) / KIB,
      ),
    );
  // The block, with the zoom held, so that fewer heads make it visibly thinner.
  const SHRINK_ZOOM = autoZoom(
    LENGTH,
    (HEIGHT * BIG_LAYERS) / LAYERS,
    DEPTH * (BIG_QUERY_HEADS / HEADS) * 2.28,
  );
  const blockFaces = stages[4];
  const share2 = stage.value(1);
  // The layer label rides above the block's highest corner, however wide the block gets.
  const shLayerTag = dynamic(() => {
    const { L, H, span } = measure();
    const top = [
      [-L / 2, -span / 2],
      [L / 2, -span / 2],
      [-L / 2, span / 2],
      [L / 2, span / 2],
    ].map(([x, y]) => stack.stagePoint([x, y, H / 2]));
    return S(`${BIG_LAYERS} layers`, {
      size: 46,
      color: 'yellow',
    }).at(
      top.reduce((sum2, point) => sum2 + point[0], 0) / 4,
      Math.min(...top.map((point) => point[1])) - 40,
    );
  });
  const shHeadTag = dynamic(() => {
    const { L, H, span } = measure();
    const low = [
      [-L / 2, -span / 2],
      [L / 2, -span / 2],
      [-L / 2, span / 2],
      [L / 2, span / 2],
    ].map(([x, y]) => stack.stagePoint([x, y, -H / 2]));
    const count = share2.value < 0.5 ? BIG_QUERY_HEADS : share2.value < 1.5 ? 8 : 1;
    return S(`${count} KV ${count === 1 ? 'head' : 'heads'}`, {
      size: 50,
      color: 'teal',
    }).at(
      low.reduce((sum2, point) => sum2 + point[0], 0) / 4,
      Math.min(Math.max(...low.map((point) => point[1])) + 48, 478),
    );
  });
  // Sixty four query heads, and the stored heads they read. 0 is one each, 1 is eight, 2 is one.
  const PL = 60,
    PW2 = 800,
    DOT_Y = -140,
    KV_ROW = -34;
  const mix = (a, b, t) => a + (b - a) * t;
  const kvLayout = (i) => {
    const own = [PL + ((i + 0.5) * PW2) / 64, PW2 / 64 - 2],
      eight = [PL + ((Math.floor(i / 8) + 0.5) * PW2) / 8, PW2 / 8 - 14],
      one = [PL + PW2 / 2, 150];
    const [from, into, t] =
      share2.value < 1 ? [own, eight, share2.value] : [eight, one, share2.value - 1];
    return [mix(from[0], into[0], t), mix(from[1], into[1], t)];
  };
  const dots = new Node(
    concat(
      ...Array.from(
        {
          length: BIG_QUERY_HEADS,
        },
        (_, i) => rectPath(PL + ((i + 0.5) * PW2) / 64 - 4, DOT_Y - 22, 8, 44, 2),
      ),
    ),
  ).fill('yellow', 1);
  const kvRow = dynamic(() => {
    const node = new Node();
    for (let i = 0; i < BIG_QUERY_HEADS; i += 1) {
      const [x, w] = kvLayout(i);
      node.add(
        rect(w, 66, {
          radius: Math.min(6, w / 3),
          fill: 'teal',
          stroke: null,
        }).at(x, KV_ROW),
      );
    }
    return node;
  });
  const headLinks2 = dynamic(() => {
    const node = new Node();
    for (let i = 0; i < BIG_QUERY_HEADS; i += 1)
      node.add(
        line([PL + ((i + 0.5) * PW2) / 64, DOT_Y + 24], [kvLayout(i)[0], KV_ROW - 36], {
          stroke: 'dim',
          width: 1.5,
        }),
      );
    return node;
  });
  const dotName = place(
    S('64 query heads', {
      size: 44,
      color: 'yellow',
    }),
    PL,
    DOT_Y - 52,
  );
  const kvName2 = dynamic(() => {
    const count = share2.value < 0.5 ? 64 : share2.value < 1.5 ? 8 : 1;
    return place(
      S(`${count} key value ${count === 1 ? 'head' : 'heads'}`, {
        size: 44,
        color: 'teal',
      }),
      PL,
      KV_ROW + 62,
    );
  });
  // The three bills on one scale.
  const BAR_SCALE = PW2 / billFor(BIG_QUERY_HEADS),
    BILL_Y2 = [150, 284, 418];
  const billRow = (name, kib, color, i) => {
    const y = BILL_Y2[i],
      track = frameBar(PL, y, PW2, 50),
      label2 = place(
        S(name, {
          size: 42,
          color,
        }),
        PL,
        y - 56,
      );
    const fill = growBar(PL, y, kib * BAR_SCALE, 50, color);
    const value = place(
      M(`${fmt(kib)} KiB`, {
        size: 42,
        color: kib > 1000 ? 'bg' : color,
      }),
      kib > 1000 ? PL + 22 : PL + kib * BAR_SCALE + 22,
      y,
    ).zIndex(1);
    return {
      track,
      label: label2,
      fill,
      value,
    };
  };
  const bills = [
    billRow('If each query head had its own', billFor(BIG_QUERY_HEADS), 'red', 0),
    billRow('Grouped query attention', billFor(8), 'yellow', 1),
    billRow('Multi query attention', billFor(1), 'green', 2),
  ];
  const billLand = (bill) => [
    fadeIn(bill.fill.node, {
      duration: 0.1,
    }),
    bill.fill.grow({
      duration: 0.5,
    }),
    fadeIn(bill.value),
  ];
  shrink.on('formula', () => {
    stage.play(
      layers.to(BIG_LAYERS),
      heads.to(8),
      tokens.to(4096),
      keyValue.to(1),
      heldZoom.to(SHRINK_ZOOM),
      zoomHold.to(1),
      stack.theta.to(-0.8),
      stack.unit.to(168),
      to(stack, (node) => node.at(-440, 120)),
      {
        duration: 0.01,
      },
    );
    handoff(firstParts, () =>
      arrive(
        ...blockFaces.map((face) => fade(face, 1)),
        fadeIn([
          fLeft,
          fLayers,
          fHeads[1],
          fNumbers,
          fBytes[0],
          ...fCaptions,
          byteCaptions[0],
          r320,
          shLayerTag,
          shHeadTag,
        ]),
        {
          duration: 0.45,
        },
      ),
    );
  });
  shrink.on('number', () =>
    stage.play(
      indicate(fHeads[1], {
        color: 'yellow',
        scale: 1.2,
      }),
      indicate(fCaptions[2], {
        color: 'yellow',
        scale: 1.1,
      }),
      fadeIn(kvRow),
      fadeIn(kvName2),
      {
        duration: 0.8,
      },
    ),
  );
  shrink.on('sixty-four', () =>
    stage.play(fadeIn(dots), fadeIn(dotName), fadeIn(headLinks2), {
      duration: 0.6,
    }),
  );
  shrink.on('eight-kv', () =>
    stage.play(
      indicate(kvName2, {
        color: 'teal',
        scale: 1.05,
      }),
      {
        duration: 0.7,
      },
    ),
  );
  // The head term, the block, and its label change together, and the result shows "?" until spoken.
  const headChange = (term, nextTerm, result, ask, shareTo, headsTo, bill) => {
    stage.at(stage.time, () =>
      stage.play(fadeIn([bill.track, bill.label]), {
        duration: 0.35,
      }),
    );
    stage.at(stage.time + 0.3, () =>
      stage.play(...crossfade(term, nextTerm), ...crossfade(result, ask), {
        duration: 0.5,
      }),
    );
    stage.play(share2.to(shareTo), heads.to(headsTo), {
      duration: 1.2,
      ease: smoother,
    });
  };
  shrink.on('own', () =>
    headChange(fHeads[1], fHeads[0], r320, rAsk, 0, BIG_QUERY_HEADS, bills[0]),
  );
  shrink.after('mha', () =>
    stage.play(...crossfade(rAsk, r2560), ...billLand(bills[0]), {
      duration: 0.5,
    }),
  );
  shrink.on('gqa', () => headChange(fHeads[0], fHeads[1], r2560, rAsk2, 1, 8, bills[1]));
  shrink.after('three-twenty', () => {
    stage.play(fadeOut(rAsk2), { duration: 0.08 });
    stage.play(fadeIn(r320b), ...billLand(bills[1]), { duration: 0.2 });
  });
  shrink.on('mqa', () => headChange(fHeads[1], fHeads[2], r320b, rAsk3, 2, 1, bills[2]));
  shrink.after('forty', () =>
    stage.play(...crossfade(rAsk3, r40), ...billLand(bills[2]), {
      duration: 0.5,
    }),
  );
  const panelParts = [
    dots,
    kvRow,
    headLinks2,
    dotName,
    kvName2,
    ...bills.flatMap((bill) => [bill.track, bill.label, bill.fill.node, bill.value]),
  ];
  return {
    fLeft,
    fLayers,
    fHeads,
    fNumbers,
    fBytes,
    fCaptions,
    byteCaptions,
    r40,
    r320c,
    r160,
    blockFaces,
    share2,
    shLayerTag,
    shHeadTag,
    PL,
    PW2,
    panelParts,
  };
}
