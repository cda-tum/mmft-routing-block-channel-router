import { maxPorts, minPorts } from "../components/ConnectionEditor"
import { portStringToIndex } from "./ports"

const LINE_SEPARATOR = '\n'
const WINDOWS_LINE_SEPARATOR = '\n\r'
const CELL_SEPARATOR = ','

export function readCSV(content: string): [number, number][][] | string {
    const lineSeparator = content.includes(WINDOWS_LINE_SEPARATOR) ? WINDOWS_LINE_SEPARATOR : LINE_SEPARATOR
    const lines = content.split(lineSeparator)

    const connections: [number, number][][] = []
    
    for(const line of lines) {
        const cells = line.split(CELL_SEPARATOR)

        const ports: [number, number][] = []
        for(const cell of cells) {
            const trimmed = cell.trim()
            const maybePort = portStringToIndex(trimmed)
            if(maybePort !== undefined) {
                if(connections.some(connection => connection.some(port => port[0] === maybePort[0] && port[1] === maybePort[1])) || ports.some(port => port[0] === maybePort[0] && port[1] === maybePort[1])) {
                    return `Duplicate Port ${trimmed}`
                }
                ports.push(maybePort)
            }
        }

        if(ports.length >= minPorts && ports.length <= maxPorts) {
            connections.push(ports)
        }
    }

    return connections
}