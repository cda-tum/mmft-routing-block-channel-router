import { PortKey } from "./ports";

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

export const defaultOutputConnections: OutputConnections = {}

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
