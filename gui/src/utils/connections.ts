import { PortKey } from "./ports";

export type ConnectionID = number

export type InputConnection = {
    color: string
    ports: PortKey[]
}

export type InputConnections = Record<ConnectionID, InputConnection>

export const defaultInputConnections: InputConnections = {}


export type Point = [number, number]
export type OutputConnections = Record<ConnectionID, Point[]>

export const defaultOutputConnections: OutputConnections = {}