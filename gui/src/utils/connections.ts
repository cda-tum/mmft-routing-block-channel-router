import { PortKey } from "./ports";
import { generate_dxf } from '../../../pkg/mmft_board_router';

export type ConnectionID = number

export type InputConnection = {
    color: string
    ports: PortKey[]
}

export type InputConnections = Record<ConnectionID, InputConnection>

export const defaultInputConnections: InputConnections = {}


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
    for(let point of points) {
        if(previous !== undefined) {
            const [dx, dy] = [point[0] - previous[0], point[1] - previous[1]]
            length += Math.hypot(dx, dy)
        }
        previous = point
    }
    return length
}

export function generateDXF(output: OutputConnectionsRaw, channelWidth: number, channelCap: string, channelCustom: number, boardWidth: number, boardHeight: number) {
    try {
        let channelCapArg
        if(channelCap === "Butt" || channelCap === "Square") {
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
