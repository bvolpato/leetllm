import { REPORT_XML } from './fixtures.mjs';
import { DOMParser } from '@xmldom/xmldom';
export function parseReport(xml = REPORT_XML) {
  const doc = new DOMParser({
    onError: (_level, message) => {
      throw new Error(message);
    },
  }).parseFromString(xml, 'application/xml');
  const namespace = doc.documentElement.namespaceURI ?? '';
  return Array.from(doc.getElementsByTagNameNS(namespace || null, 'testcase'), (node, index) => ({
    namespace,
    id: 'X' + (index + 1),
    className: node.getAttribute('classname'),
    name: node.getAttribute('name'),
    attributes: Object.fromEntries(Array.from(node.attributes, (a) => [a.name, a.value])),
    children: Array.from(node.childNodes)
      .filter((child) => child.nodeType === 1)
      .map((child) => ({
        namespace: child.namespaceURI,
        tag: child.localName,
      })),
  }));
}
export const bounded = (value) => Math.max(0, Math.min(1, value));
export function passAtK(n, c, k) {
  if (![n, c, k].every(Number.isInteger) || n < 1 || c < 0 || c > n || k < 1 || k > n)
    throw new Error('invalid pass-at-k counts');
  const choose = (a, b) => {
    if (b < 0 || b > a) return 0;
    let result = 1;
    for (let i = 1; i <= b; i += 1) result = (result * (a - i + 1)) / i;
    return result;
  };
  return 1 - choose(n - c, k) / choose(n, k);
}
export function memoryAccess(address, bytes = 4, limit = 65536) {
  return Number.isInteger(address) && address >= 0 && address + bytes <= limit
    ? 'read permitted'
    : 'MEMORY_OUT_OF_BOUNDS';
}
export function addI32(value) {
  if (!Number.isInteger(value) || value < -(2 ** 31) || value >= 2 ** 31)
    throw new Error('Argument must be a signed i32');
  return (value + 1) | 0;
}
