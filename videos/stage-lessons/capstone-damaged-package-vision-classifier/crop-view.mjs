import { place, rect } from 'vizmatic/stage';
import { cropParcel } from './parts.mjs';

export function fitAspect(region, aspect) {
  const width = Math.min(region.width, region.height * aspect);
  const height = width / aspect;
  return region.inset((region.width - width) / 2, (region.height - height) / 2);
}

export const inputWidth = 512,
  inputHeight = 256,
  cropSize = 224;
const span = cropSize / inputWidth,
  height = cropSize / inputHeight;
const top = (1 - height) / 2;
export const centerLeft = (1 - span) / 2;

export const fullFrame = (region) => cropParcel(region, 0, 1);
export const croppedFrame = (region, left) => cropParcel(region, left, span, top, height);
export function viewfinder(region, left) {
  const inset = region.inset(((1 - span) * region.width) / 2, top * region.height);
  return place(
    rect(inset.width, inset.height, { fill: null, stroke: 'yellow', width: 5 }),
    inset,
  ).moveTo([region.left + (left + span / 2) * region.width, region.cy]);
}
