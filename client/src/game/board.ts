export const BOARD_SIZE = 50;
const MIN_GAP = 7.5;
const MARGIN = 4;
const MAX_ATTEMPTS = 80;

export type NumberPos = {
  value: number;
  x: number;
  y: number;
};

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function distance(a: NumberPos, b: NumberPos) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Place numbers 1–50 randomly without overlapping. */
export function generateBoard(): NumberPos[] {
  const positions: NumberPos[] = [];

  for (let value = 1; value <= BOARD_SIZE; value += 1) {
    let placed = false;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate: NumberPos = {
        value,
        x: randomInRange(MARGIN, 100 - MARGIN),
        y: randomInRange(MARGIN, 100 - MARGIN),
      };

      if (!positions.some((p) => distance(p, candidate) < MIN_GAP)) {
        positions.push(candidate);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const col = (value - 1) % 10;
      const row = Math.floor((value - 1) / 10);
      positions.push({
        value,
        x: MARGIN + col * ((100 - 2 * MARGIN) / 9) + randomInRange(-1.5, 1.5),
        y: MARGIN + row * ((100 - 2 * MARGIN) / 4) + randomInRange(-1.5, 1.5),
      });
    }
  }

  return positions;
}
