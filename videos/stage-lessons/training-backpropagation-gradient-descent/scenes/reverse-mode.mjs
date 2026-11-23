import { heading } from '../../kit-narrated.mjs';
import { requestGraph, relay } from '../parts.mjs';
export default function reverseMode(s, c) {
  const p = requestGraph(s);
  s.add(heading(c.title), p.banner, p.nodes, p.edges, p.caption);
  c.on('reverse-forward', () => {
    relay(s, p.nodes[0], p.nodes[1], { color: 'cyan' });
    relay(s, p.nodes[1], p.nodes[2], { color: 'cyan' });
    relay(s, p.nodes[2], p.nodes[3], { color: 'cyan' });
  });
  c.show('reverse-seed', p.seed, { after: true });
  c.on('reverse-residual', () => relay(s, p.seed, p.residual));
  c.show('reverse-residual', [p.residual, p.backEdges[0]], { after: true });
  c.on('reverse-prediction', () => relay(s, p.residual, p.addition));
  c.show('reverse-prediction', [p.addition, p.backEdges[1]], { after: true });
  c.on('reverse-branch', () => {
    relay(s, p.addition, p.product, { duration: 0.7 });
    relay(s, p.addition, p.bias, { duration: 0.7 });
  });
  c.show('reverse-branch', [p.product, p.bias, p.backEdges[2], p.backEdges[3]], { after: true });
  c.on('reverse-weight', () => relay(s, p.product, p.weight));
  c.show('reverse-weight', [p.weight, p.backEdges[4]], { after: true });
}
