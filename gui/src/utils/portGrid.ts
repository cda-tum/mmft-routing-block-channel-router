
export type GridConfig = {
    originMm: { x: number; y: number };   // origin cell of the grid, in this case first top-left port of the board
    pitchMm:  { x: number; y: number };   // spacing between valid nodes, in mm
    isCellAllowed?: (ix: number, iy: number) => boolean;
};

export type BoundsMm = { width: number; height: number };

export function mmToCell(xMm: number, yMm: number, cfg: GridConfig) {
    const { originMm: o, pitchMm: p } = cfg;
    const fx = (xMm - o.x) / p.x;
    const fy = (yMm - o.y) / p.y;
    return { fx, fy, ix: Math.round(fx), iy: Math.round(fy) }; // nearest integer cell
}

export function cellToMm(ix: number, iy: number, cfg: GridConfig) {
    const { originMm: o, pitchMm: p } = cfg;
    return { x: o.x + ix * p.x, y: o.y + iy * p.y };
}


 // Snap to the nearest valid grid node inside bounds. If the nearest cell is
 // not allowed, search outward in a diamond shape until a valid one is found.
export function snapToGrid(
    xMm: number,
    yMm: number,
    cfg: GridConfig,
    bounds: BoundsMm,
    maxSearchRadius = 4
): { x: number; y: number } | null {
    const { ix, iy } = mmToCell(xMm, yMm, cfg);

    const okCell = (cx: number, cy: number) => {
        const { x, y } = cellToMm(cx, cy, cfg);
        const inside =
            x >= 0 && x <= bounds.width &&
            y >= 0 && y <= bounds.height;
        const allowed = cfg.isCellAllowed ? cfg.isCellAllowed(cx, cy) : true;
        return inside && allowed ? { x, y } : null;
    };

    // try nearest first, then rings
    let cand = okCell(ix, iy);
    if (cand) return cand;

    for (let r = 1; r <= maxSearchRadius; r++) {
        // diamond ring search
        for (let dx = -r; dx <= r; dx++) {
            const dy1 = r - Math.abs(dx);
            const dy2 = -dy1;
            cand = okCell(ix + dx, iy + dy1) || okCell(ix + dx, iy + dy2);
            if (cand) return cand;
        }
    }
    return null;
}
