// Enlarged touch circles may overlap in compact views. Pick the closest center,
// rather than whichever SVG circle was painted last. Keyboard selection keeps its focused star.
export function nearestStar(stars, x, y) {
  let best = null, distance = Infinity;
  for (const star of stars) {
    const d = Math.hypot(x - star.x, y - star.y);
    if (d <= star.radius && d < distance) { best = star.id; distance = d; }
  }
  return best;
}
