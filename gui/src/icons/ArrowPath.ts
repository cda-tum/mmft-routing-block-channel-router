export function arrowPath(from: [number, number], to: [number, number], toArrowPercentage?: number, fromArrowPercentage?: number) {
    const direction = [to[0] - from[0], to[1] - from[1]]
    const perp = [direction[1], -direction[0]]
    const line = [from, to]
    const toArrowP = toArrowPercentage ?? 0.15
    const toArrowBase = [to[0] + toArrowP * -direction[0], to[1] + toArrowP * -direction[1]]
    const toArrowBaseDef = toArrowP / 2
    const toArrow = [to, [toArrowBase[0] + toArrowBaseDef * perp[0], toArrowBase[1] + toArrowBaseDef * perp[1]], [toArrowBase[0] + toArrowBaseDef * -perp[0], toArrowBase[1] + toArrowBaseDef * -perp[1]]] as [number, number][]
    const fromArrowP = fromArrowPercentage ?? 0.15
    const fromArrowBase = [from[0] + fromArrowP * direction[0], from[1] + fromArrowP * direction[1]]
    const fromArrowBaseDef = fromArrowP / 2
    const fromArrow = [from, [fromArrowBase[0] + fromArrowBaseDef * perp[0], fromArrowBase[1] + fromArrowBaseDef * perp[1]], [fromArrowBase[0] + fromArrowBaseDef * -perp[0], fromArrowBase[1] + fromArrowBaseDef * -perp[1]]] as [number, number][]
    return {
        line: arrayToPath(line, false),
        arrows: [arrayToPath(fromArrow, true), arrayToPath(toArrow, true)]
    }
}

export function arrayToPath(points: [number, number][], closed: boolean = false) {
    return `M${points.map(point => `${point[0]},${point[1]}`).join(',')}` + (closed ? 'Z' : '')
}