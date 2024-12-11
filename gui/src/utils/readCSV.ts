import { maxPorts, minPorts } from "../components/ConnectionEditor"
import { portStringToIndex } from "./ports"

const LINE_SEPARATOR = '\n'
const CELL_SEPARATOR = ','

export function readCSV(content: string) {
    const lines = content.split(LINE_SEPARATOR)

    const connections = []
    
    for(const line of lines) {
        const cells = line.split(CELL_SEPARATOR)

        const ports: [number, number][] = []
        for(const cell of cells) {
            const trimmed = cell.trim()
            const maybePort = portStringToIndex(trimmed)
            if(maybePort !== undefined) {
                ports.push(maybePort)
            }
        }

        if(ports.length >= minPorts && ports.length <= maxPorts) {
            connections.push(ports)
        }
    }

    return connections
}