import { OutputConnections, Point } from "./connections";
import MakerJs, { IModel } from 'makerjs';

const Factor45 = Math.tan(Math.PI / 8)
const Factor90 = Math.tan(Math.PI / 4)

export function generateDXF(
    chipDimensions: {
        originX: number,
        originY: number,
        width: number,
        height: number
    },
    outlines: Point[][]
) {
    const channels = outlines.map(points => {
        const e = new MakerJs.models.ConnectTheDots(true, points)
        return e
    })
    const chip = new MakerJs.models.Rectangle(chipDimensions.width, chipDimensions.height)
    chip.origin = [chipDimensions.originX, chipDimensions.originY]
    const model: IModel = {
        models: {}
    }

    const models = [chip, ...channels]
    models.forEach((m, i) => model.models![i] = m)

    MakerJs.model.scale(model, 1e-3)
    return MakerJs.exporter.toDXF(model, { units: 'mm' })
}

export function generateOutlines(channelWidth: number, connections: OutputConnections): Point[][] {

    const ch = channelWidth / 2
    const outlines: Point[][] = []

    Object.entries(connections).forEach(([_, points]) => {
        const leftSide = []
        const rightSide = []
        let pa = points[0]
        let pb = points[1]

        let { d, n } = seg(pa, pb)
        leftSide.push([pa[0] - d[0] * ch - n[0] * ch, pa[1] - d[1] * ch - n[1] * ch])
        rightSide.push([pa[0] - d[0] * ch + n[0] * ch, pa[1] - d[1] * ch + n[1] * ch])

        for (const point of points.slice(2)) {
            let { d: pd } = seg(pa, pb)
            let { d, n } = seg(pb, point)
            if (pd[0] > 0 && pd[1] > 0) {
                let lsign, rsign
                if (d[0] > 0 && d[1] === 0) {
                    //Down-right to right
                    lsign = -Factor45
                    rsign = +Factor45
                } else if (d[0] > 0 && d[1] > 0) {
                    //Down-right to Down-right
                    lsign = 0
                    rsign = 0
                } else if (d[0] === 0 && d[1] > 0) {
                    //Down-right to down
                    lsign = +Factor45
                    rsign = -Factor45
                } else if (d[0] < 0 && d[1] > 0) {
                    //Down-right to down-left
                    lsign = +Factor90
                    rsign = -Factor90
                } else if (d[0] > 0 && d[1] < 0) {
                    //Down-right to up-right
                    lsign = -Factor90
                    rsign = +Factor90
                } else {
                    throw ''
                }
                leftSide.push([pb[0] - n[0] * ch + lsign * d[0] * ch, pb[1] - n[1] * ch + lsign * d[1] * ch])
                rightSide.push([pb[0] + n[0] * ch + rsign * d[0] * ch, pb[1] + n[1] * ch + rsign * d[1] * ch])
            } else if (pd[0] > 0 && pd[1] < 0) {
                let lsign, rsign
                if (d[0] > 0 && d[1] === 0) {
                    //Up-right to right
                    lsign = +Factor45
                    rsign = -Factor45
                } else if (d[0] > 0 && d[1] < 0) {
                    //Up-right to Up-right
                    lsign = 0
                    rsign = 0
                } else if (d[0] === 0 && d[1] < 0) {
                    //Up-right to up
                    lsign = -Factor45
                    rsign = +Factor45
                } else if (d[0] < 0 && d[1] < 0) {
                    //up-right to up-left
                    lsign = -Factor90
                    rsign = +Factor90
                } else if (d[0] > 0 && d[1] > 0) {
                    //up-right to down-right
                    lsign = +Factor90
                    rsign = -Factor90
                } else {
                    throw ''
                }
                leftSide.push([pb[0] - n[0] * ch + lsign * d[0] * ch, pb[1] - n[1] * ch + lsign * d[1] * ch])
                rightSide.push([pb[0] + n[0] * ch + rsign * d[0] * ch, pb[1] + n[1] * ch + rsign * d[1] * ch])
            } else if (pd[0] < 0 && pd[1] > 0) {
                let lsign, rsign
                if (d[0] < 0 && d[1] === 0) {
                    //Down-left to left
                    lsign = +Factor45
                    rsign = -Factor45
                } else if (d[0] < 0 && d[1] > 0) {
                    //Down-left to Down-left
                    lsign = 0
                    rsign = 0
                } else if (d[0] === 0 && d[1] > 0) {
                    //Down-left to down
                    lsign = -Factor45
                    rsign = +Factor45
                } else if (d[0] > 0 && d[1] > 0) {
                    //Down-left to down-right
                    lsign = -Factor90
                    rsign = +Factor90
                } else if (d[0] < 0 && d[1] < 0) {
                    //Down-left to up-left
                    lsign = +Factor90
                    rsign = -Factor90
                } else {
                    throw ''
                }
                leftSide.push([pb[0] - n[0] * ch + lsign * d[0] * ch, pb[1] - n[1] * ch + lsign * d[1] * ch])
                rightSide.push([pb[0] + n[0] * ch + rsign * d[0] * ch, pb[1] + n[1] * ch + rsign * d[1] * ch])
            } else if (pd[0] < 0 && pd[1] < 0) {
                let lsign, rsign
                if (d[0] < 0 && d[1] === 0) {
                    //Up-left to left
                    lsign = -Factor45
                    rsign = +Factor45
                } else if (d[0] < 0 && d[1] < 0) {
                    //Up-left to Up-left
                    lsign = 0
                    rsign = 0
                } else if (d[0] === 0 && d[1] < 0) {
                    //Up-left to up
                    lsign = +Factor45
                    rsign = -Factor45
                } else if (d[0] > 0 && d[1] < 0) {
                    //Up-left to Up-right
                    lsign = +Factor90
                    rsign = -Factor90
                } else if (d[0] < 0 && d[1] > 0) {
                    //Up-left to down-left
                    lsign = -Factor90
                    rsign = +Factor90
                } else {
                    throw ''
                }
                leftSide.push([pb[0] - n[0] * ch + lsign * d[0] * ch, pb[1] - n[1] * ch + lsign * d[1] * ch])
                rightSide.push([pb[0] + n[0] * ch + rsign * d[0] * ch, pb[1] + n[1] * ch + rsign * d[1] * ch])
            } else if (pd[0] > 0 && pd[1] === 0) {
                let lsign, rsign
                if (d[0] > 0 && d[1] < 0) {
                    //Right to Up-right
                    lsign = -Factor45
                    rsign = +Factor45
                } else if (d[0] > 0 && d[1] === 0) {
                    //Right to Right
                    lsign = 0
                    rsign = 0
                } else if (d[0] > 0 && d[1] > 0) {
                    //Right to Down-right
                    lsign = +Factor45
                    rsign = -Factor45
                } else if (d[0] === 0 && d[1] < 0) {
                    //Right to Up
                    lsign = -Factor90
                    rsign = +Factor90
                } else if (d[0] === 0 && d[1] > 0) {
                    //Right to down
                    lsign = +Factor90
                    rsign = -Factor90
                } else {
                    throw ''
                }
                leftSide.push([pb[0] - n[0] * ch + lsign * d[0] * ch, pb[1] - n[1] * ch + lsign * d[1] * ch])
                rightSide.push([pb[0] + n[0] * ch + rsign * d[0] * ch, pb[1] + n[1] * ch + rsign * d[1] * ch])
            } else if (pd[0] < 0 && pd[1] === 0) {
                let lsign, rsign
                if (d[0] < 0 && d[1] < 0) {
                    //Left to Up-Left
                    lsign = +Factor45
                    rsign = -Factor45
                } else if (d[0] < 0 && d[1] === 0) {
                    //Left to Left
                    lsign = 0
                    rsign = 0
                } else if (d[0] < 0 && d[1] > 0) {
                    //Left to Down-Left
                    lsign = -Factor45
                    rsign = +Factor45
                } else if (d[0] === 0 && d[1] < 0) {
                    //Left to Up
                    lsign = +Factor90
                    rsign = -Factor90
                } else if (d[0] === 0 && d[1] > 0) {
                    //Left to down
                    lsign = -Factor90
                    rsign = +Factor90
                } else {
                    throw ''
                }
                leftSide.push([pb[0] - n[0] * ch + lsign * d[0] * ch, pb[1] - n[1] * ch + lsign * d[1] * ch])
                rightSide.push([pb[0] + n[0] * ch + rsign * d[0] * ch, pb[1] + n[1] * ch + rsign * d[1] * ch])
            } else if (pd[0] === 0 && pd[1] > 0) {
                let lsign, rsign
                if (d[0] < 0 && d[1] > 0) {
                    //Down to Down-Left
                    lsign = +Factor45
                    rsign = -Factor45
                } else if (d[0] === 0 && d[1] > 0) {
                    //Down to Down
                    lsign = 0
                    rsign = 0
                } else if (d[0] > 0 && d[1] > 0) {
                    //Down to Down-Right
                    lsign = -Factor45
                    rsign = +Factor45
                } else if (d[0] < 0 && d[1] === 0) {
                    //Down to Left
                    lsign = +Factor90
                    rsign = -Factor90
                } else if (d[0] > 0 && d[1] === 0) {
                    //Down to Right
                    lsign = -Factor90
                    rsign = +Factor90
                } else {
                    throw ''
                }
                leftSide.push([pb[0] - n[0] * ch + lsign * d[0] * ch, pb[1] - n[1] * ch + lsign * d[1] * ch])
                rightSide.push([pb[0] + n[0] * ch + rsign * d[0] * ch, pb[1] + n[1] * ch + rsign * d[1] * ch])
            } else if (pd[0] === 0 && pd[1] < 0) {
                let lsign, rsign
                if (d[0] < 0 && d[1] < 0) {
                    //Up to Up-Left
                    lsign = -Factor45
                    rsign = +Factor45
                } else if (d[0] === 0 && d[1] < 0) {
                    //Up to Up
                    lsign = 0
                    rsign = 0
                } else if (d[0] > 0 && d[1] < 0) {
                    //Up to Up-Right
                    lsign = +Factor45
                    rsign = -Factor45
                } else if (d[0] < 0 && d[1] === 0) {
                    //Up to Left
                    lsign = -Factor90
                    rsign = +Factor90
                } else if (d[0] > 0 && d[1] === 0) {
                    //Up to Right
                    lsign = +Factor90
                    rsign = -Factor90
                } else {
                    throw ''
                }
                leftSide.push([pb[0] - n[0] * ch + lsign * d[0] * ch, pb[1] - n[1] * ch + lsign * d[1] * ch])
                rightSide.push([pb[0] + n[0] * ch + rsign * d[0] * ch, pb[1] + n[1] * ch + rsign * d[1] * ch])
            } else {
                throw ''
            }

            pa = pb
            pb = point
        }

        let { d: fd, n: fn } = seg(points[points.length - 2], points[points.length - 1])
        leftSide.push([pb[0] - fn[0] * ch + fd[0] * ch, pb[1] - fn[1] * ch + fd[1] * ch])
        rightSide.push([pb[0] + fn[0] * ch + fd[0] * ch, pb[1] + fn[1] * ch + fd[1] * ch])

        outlines.push([...leftSide, ...rightSide.reverse()] as Point[])
    })
    return outlines
}

export function seg(a: [number, number], b: [number, number]) {
    const d = [b[0] - a[0], b[1] - a[1]]
    const dl = Math.hypot(...d)
    const n = [d[1], -d[0]]
    const nl = Math.hypot(...n)
    return {
        d: [d[0] / dl, d[1] / dl],
        n: [n[0] / nl, n[1] / nl]
    }
}

export function downloadDXF(output: string, exportName: string) {
    const dataStr = "data:image/svg;charset=utf-8," + encodeURIComponent(output)
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".dxf");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
