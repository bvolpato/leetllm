import { arrow, boxOf, dot, draw, dynamic, fadeIn, group, line, linear, place, row, svgPath } from "vizmatic/stage";
import { area, heading, label, mono } from "../../kit-narrated.mjs";
import { actorMemoryTrace } from "../parts.mjs";

const colors = { dog: "cyan", cat: "pink" };

function portrait(animal) {
  const fill = colors[animal];
  const face = path => svgPath(path, { fill, stroke: null });
  const detail = path => svgPath(path, { fill: null, stroke: "bg", width: 7 });
  const eyes = [-42, 42].map(x => dot(9, "bg").at(x, -16));
  const nose = svgPath("M -19 14 Q 0 6 19 14 Q 15 29 0 34 Q -15 29 -19 14 Z", { fill: "bg", stroke: null });
  const mouth = detail("M 0 30 L 0 43 Q -14 57 -27 44 M 0 43 Q 14 57 27 44");
  if (animal === "dog") {
    const head = face("M -77 -73 Q -42 -118 19 -103 Q 65 -108 89 -61 Q 112 -23 87 46 Q 79 91 36 98 Q 0 124 -36 98 Q -87 94 -95 40 Q -110 -22 -77 -73 Z");
    const ears = [-1, 1].map(side => svgPath(
      "M 64 -77 Q 96 -105 124 -70 Q 157 -33 140 24 Q 130 62 102 44 Q 80 26 81 -9 Q 81 -54 64 -77 Z",
      { fill, stroke: "bg", width: 6 },
    ).scale([side, 1], [0, 0]));
    return group(head, ...ears, ...eyes, nose, mouth);
  }
  const head = face("M -92 -38 L -102 -113 Q -103 -124 -92 -117 L -38 -82 Q 0 -96 41 -82 L 92 -117 Q 105 -124 102 -108 L 94 -34 Q 123 8 91 57 Q 67 95 11 107 Q 0 113 -11 107 Q -66 95 -92 58 Q -120 22 -92 -38 Z");
  const ears = detail("M -82 -90 L -74 -61 L -52 -72 M 82 -90 L 74 -61 L 52 -72");
  const whiskers = [-1, 1].flatMap(side => [14, 37].map((y, i) =>
    line([side * 51, y], [side * 131, y + (i ? 17 : -13)], { stroke: colors.cat, width: 6 })));
  return group(head, ...whiskers, ears, ...eyes, nose, mouth);
}

function sentence(words, region) {
  const tokens = words.map((word, i) =>
    label(word + (i === words.length - 1 ? "." : ""), { size: 66, color: colors[word] ?? "ink" }));
  const phrase = place(row(tokens, { gap: 16 }), region);
  const actor = boxOf(tokens[1]);
  const underline = line(actor.point("bottom left"), actor.point("bottom right"), { stroke: colors[words[1]], width: 5 });
  return { tokens: phrase.nodes, underline };
}

export default function intro(s, c) {
  const [aboveCaptions] = area.rows([5, 1], 0);
  const [picture, original, reversed, tally] = aboveCaptions.rows([4, 1.25, 1.25, 1], "tight");
  const [left, middle, right] = picture.inset("wide", 0).columns([1.25, 1, 1.25], "normal");
  const dog = place(portrait("dog").scale(1.55), left);
  const cat = place(portrait("cat").scale(1.55), right);
  const [name, shaft] = middle.rows(2, "normal");
  const verb = place(label("chased", { size: 66 }), name, "bottom");
  const leftTip = shaft.point("top left"), rightTip = shaft.point("top right");
  const chase = (start, end, color) => arrow(start, end, { stroke: color, width: 13, tip: 38, pad: 0 });
  const chaseTipX = s.value(leftTip[0] + shaft.width * 0.2);
  const forward = dynamic(() => chase(leftTip, [chaseTipX.value, rightTip[1]], colors.dog));
  const backward = chase(rightTip, leftTip, colors.cat);
  const dogReplay = chase(leftTip, rightTip, colors.dog);
  const catReplay = chase(rightTip, leftTip, colors.cat);
  const dogWords = actorMemoryTrace("dog").words;
  const first = sentence(dogWords, original);
  const second = sentence(actorMemoryTrace("cat").words, reversed);
  const counts = new Map();
  for (const word of dogWords.map(word => word.toLowerCase())) counts.set(word, (counts.get(word) ?? 0) + 1);
  const tallyText = Array.from(counts, ([word, count]) => word + " × " + count).join("      ");
  const opening = [heading(c.title), dog, cat, verb, forward, ...first.tokens];
  s.add(...opening);
  s.play(fadeIn(opening, { duration: 0 }));
  s.play(chaseTipX.to(rightTip[0], { duration: 1.2, ease: linear }));
  c.show("reversed-sentence", second.tokens);
  c.on("reversed-sentence", () => {
    s.remove(forward);
    s.play(draw(backward), { duration: 0.65 });
  });
  c.show("count-question", place(mono(tallyText, { size: 43 }), tally));
  c.on("actor-position", () => {
    s.remove(backward);
    s.add(first.underline);
    s.play(draw(dogReplay), { duration: 0.45 });
  });
  c.on("actor-role-reverses", () => {
    s.remove(dogReplay, first.underline);
    s.add(second.underline);
    s.play(draw(catReplay), { duration: 0.45 });
  });
}
