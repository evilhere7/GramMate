/**
 * Converts a string (like a Firebase UID or email) deterministically into a standard UUID v4 format.
 * Works seamlessly in both browser and Node.js environments.
 */
export function stringToUuid(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  let h3 = 0x9e3779b9;
  let h4 = 0x3b9aca07;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = ((h2 >>> 0) & 0xffff).toString(16).padStart(4, '0');
  // version 4
  const p3 = '4' + (((h2 >>> 16) & 0x0fff).toString(16).padStart(3, '0'));
  // variant
  const p4 = (((h3 >>> 0) & 0x3fff) | 0x8000).toString(16).padStart(4, '0');
  const p5 = (h4 >>> 0).toString(16).padStart(8, '0') + (((h3 >>> 16) & 0xffff).toString(16).padStart(4, '0'));

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export default stringToUuid;
