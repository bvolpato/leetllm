import { board } from './atelier.mjs';
import { prepareCaptions } from './captions.mjs';
import {
  terminals,
  paths,
  findFixture,
  ignore,
  snapshot,
  scoring,
  parsing,
  hook,
  boundary,
  history,
} from './checkout.mjs';
import { search, helper, pipeline, strictShell, remote, processIdentity } from './shell.mjs';
import { environment, setup, devices, objects, prove, practice } from './handoff-scenes.mjs';
import { checkRun } from './run.mjs';

const scenes = [
  terminals,
  paths,
  findFixture,
  ignore,
  snapshot,
  scoring,
  parsing,
  hook,
  boundary,
  history,
  search,
  helper,
  pipeline,
  strictShell,
  remote,
  processIdentity,
  environment,
  setup,
  devices,
  objects,
  prove,
  practice,
];
const surfaces = [
  '#264e45',
  '#344e4c',
  '#3f4844',
  '#484941',
  '#2d534b',
  '#3c5048',
  '#344952',
  '#3b4c48',
  '#2f5049',
  '#494d45',
  '#334952',
  '#3c514d',
  '#344e54',
  '#354958',
  '#3e484e',
  '#52483f',
  '#2c4b49',
  '#35504f',
  '#384b50',
  '#394a42',
  '#264e45',
  '#344f45',
];
function draw(ctx, clock) {
  const chapter = clock.beat.chapterIndex;
  board(ctx, clock, surfaces[chapter]);
  ctx.save();
  // Fit the artwork above the two-line caption area. Keep the chapter title at its original size.
  ctx.translate(64, 11.2);
  ctx.scale(0.9, 0.9);
  scenes[chapter](ctx, clock);
  ctx.restore();
}
export default {
  title: 'Git, Shell and Linux: Rebuild the Committed Run',
  draw,
  check: checkRun,
  preparePicture: prepareCaptions,
};
