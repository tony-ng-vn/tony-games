const BOARD_SIZE = 50;
const MIN_GAP = 7.5; // percent — keep numbers from overlapping
const MARGIN = 4;
const MAX_ATTEMPTS = 80;

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Place numbers 1–50 randomly on a percent-based board without overlapping.
 * @returns {{ value: number, x: number, y: number }[]}
 */
export function generateBoard() {
  /** @type {{ value: number, x: number, y: number }[]} */
  const positions = [];

  for (let value = 1; value <= BOARD_SIZE; value += 1) {
    let placed = false;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = {
        value,
        x: randomInRange(MARGIN, 100 - MARGIN),
        y: randomInRange(MARGIN, 100 - MARGIN),
      };

      const overlaps = positions.some((p) => distance(p, candidate) < MIN_GAP);
      if (!overlaps) {
        positions.push(candidate);
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Fallback: place with slight jitter near a grid cell so every number appears
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

export { BOARD_SIZE };
