const lowerIndices = [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23];
const upperIndices = [1, 3, 5, 8, 10, 13, 15, 17, 20, 22];

export function getOrganizeModeLabel(idx: number): string {
  const lowerPos = lowerIndices.indexOf(idx);
  if (lowerPos !== -1) {
    return `LO${lowerPos + 1}`;
  }

  const upperPos = upperIndices.indexOf(idx);
  if (upperPos !== -1) {
    return `UP${upperPos + 1}`;
  }

  return `${idx + 1}`;
}

export function getOrganizeModeLabelFull(idx: number): string {
  const lowerPos = lowerIndices.indexOf(idx);
  if (lowerPos !== -1) {
    return `lower ${lowerPos + 1}`;
  }

  const upperPos = upperIndices.indexOf(idx);
  if (upperPos !== -1) {
    return `upper ${upperPos + 1}`;
  }

  return `${idx + 1}`;
}
