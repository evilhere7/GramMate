function stringToUuid(value) {
  let hashA = 0xdeadbeef;
  let hashB = 0x41c64e6d;
  let hashC = 0x9e3779b9;
  let hashD = 0x3b9aca07;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    hashA = Math.imul(hashA ^ code, 2654435761);
    hashB = Math.imul(hashB ^ code, 1597334677);
    hashC = Math.imul(hashC ^ code, 2246822507);
    hashD = Math.imul(hashD ^ code, 3266489909);
  }

  const partA = (hashA >>> 0).toString(16).padStart(8, '0');
  const partB = ((hashB >>> 0) & 0xffff).toString(16).padStart(4, '0');
  const partC = `4${((hashB >>> 16) & 0x0fff).toString(16).padStart(3, '0')}`;
  const partD = (((hashC >>> 0) & 0x3fff) | 0x8000).toString(16).padStart(4, '0');
  const partE = (hashD >>> 0).toString(16).padStart(8, '0') + (((hashC >>> 16) & 0xffff).toString(16).padStart(4, '0'));

  return `${partA}-${partB}-${partC}-${partD}-${partE}`;
}

export function getFinancialUserId(userId) {
  if (typeof userId !== 'string' || userId.length === 0) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
    ? userId
    : stringToUuid(userId);
}
