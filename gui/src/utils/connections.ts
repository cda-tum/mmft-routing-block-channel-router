import { PortKey } from "./ports";
import { generate_dxf } from '../../../pkg/mmft_board_router';
import { generate_stl } from '../../../pkg/mmft_board_router';

export type ConnectionID = number

export type InputConnection = {
    color: string
    ports: PortKey[]
    branchPort: PortKey | undefined
}

export type InputConnections = Record<ConnectionID, InputConnection>

export const defaultInputConnections: InputConnections = {
    0: {
        color: "",
        ports: [[0, 0], [2, 1]],
        branchPort: undefined
    },
    1: {
        color: "",
        ports: [[2, 5], [4, 6]],
        branchPort: undefined
    },
    2: {
        color: "",
        ports: [[4, 0], [6, 5]],
        branchPort: undefined
    },
    3: {
        color: "",
        ports: [[0, 4], [14, 5]],
        branchPort: undefined
    },
    4: {
        color: "",
        ports: [[10, 1], [14, 1]],
        branchPort: undefined
    },
    5: {
        color: "",
        ports: [[12, 0], [10, 5]],
        branchPort: undefined
    },
}


export type Point = [number, number]
export type Channel = Point[]
export type OutputConnection = Channel[]
export type OutputConnections = Record<ConnectionID, OutputConnection>
export type OutputConnectionsRaw = [ConnectionID, Channel[]][]

export const defaultOutputConnections: OutputConnections = {}
export const defaultOutputConnectionsRaw: OutputConnectionsRaw = []

export function computePathLength(points: Point[]) {
    let previous = undefined
    let length = 0
    for (let point of points) {
        if (previous !== undefined) {
            const [dx, dy] = [point[0] - previous[0], point[1] - previous[1]]
            length += Math.hypot(dx, dy)
        }
        previous = point
    }
    return length
}

export function computePathResistance(points: Point[], channelWidth: number, channelHeight: number) {
    let length = computePathLength(points);
    const fluidViscosity = 0.001; // Viscosity of water at room temperature (20°C) in Pa·s (= 1 mPa·s)

    // Convert width, height and length from mm to m first
    channelWidth /= 1000;
    channelHeight /= 1000;
    length /= 1000;

    const correctionFactor = (1 - ((192 * channelHeight) / (Math.PI ** 5 * channelWidth)) * Math.tanh((Math.PI * channelWidth) / (2 * channelHeight))) ** (-1);
    const resistance = 12 * correctionFactor * ((fluidViscosity * length) / (channelWidth * channelHeight ** 3));
    return resistance;
}

export function generateDXF(output: OutputConnectionsRaw, channelWidth: number, channelCap: string, channelCustom: number, boardWidth: number, boardHeight: number) {
    try {
        let channelCapArg
        if (channelCap === "Butt" || channelCap === "Square") {
            channelCapArg = channelCap
        } else {
            channelCapArg = {
                "Custom": channelCustom
            }
        }
        const args = {
            connections: {
                connections: output
            },
            channel_width: channelWidth,
            channel_cap: channelCapArg,
            board_width: boardWidth,
            board_height: boardHeight
        }
        const result = generate_dxf(args)
        return result
    } catch (e) {
        console.error('An unknown error occurred.')
        return undefined
    }
}

export function generateSTL(output: OutputConnectionsRaw, channelWidth: number, channelHeight: number, channelCap: string, channelCustom: number, boardWidth: number, boardHeight: number, boardThickness: number, portDiameter: number, isTemplate: boolean = false) {
    try {
        let channelCapArg
        if (channelCap === "Butt" || channelCap === "Square") {
            channelCapArg = channelCap
        } else {
            channelCapArg = {
                "Custom": channelCustom
            }
        }
        const args = {
            connections: {
                connections: output
            },
            channel_width: channelWidth,
            channel_height: channelHeight,
            channel_cap: channelCapArg,
            board_width: boardWidth,
            board_height: boardHeight,
            board_thickness: boardThickness,
            port_diameter: portDiameter,
            is_template: isTemplate
        }
        const result = generate_stl(args)
        return result
    } catch (e) {
        console.error('An unknown error occurred.')
        return undefined
    }
}
