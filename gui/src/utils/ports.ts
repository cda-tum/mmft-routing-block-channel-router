import { compute_ports } from '../../../pkg/mmft_board_router';
import { InputParameters } from './input-parameters';

export const PORT_PATTERN = /^([a-zA-Z]+)([1-9][0-9]*)$/
export const BRANCHPORT_CSV_PATTERN = /^BR_([a-zA-Z]+)([1-9][0-9]*)$/

export type Port = {
    index: [number, number]
    position: [number, number]
}

export type PortKey = [number, number]

export type InputPorts = Array<Array<Port>> | undefined

export const defaultInputPorts: InputPorts = undefined


export function generatePorts(parameters: InputParameters): { ports: InputPorts, portsX: number, portsY: number } | undefined {
    const [pitch, pitchOffsetX, pitchOffsetY] = [parameters.pitch.value!, parameters.pitchOffsetX.value!, parameters.pitchOffsetY.value!]
    try {
        const { ports_x: portsX, ports_y: portsY } = compute_ports({
            board_width: parameters.boardWidth.value,
            board_height: parameters.boardHeight.value,
            pitch: pitch,
            pitch_offset_x: pitchOffsetX,
            pitch_offset_y: pitchOffsetY
        })
        return {
            ports: [...Array(portsX).keys()].map(ix => [...Array(portsY).keys()].map(iy => ({
                index: [ix, iy],
                position: [pitchOffsetX + ix * pitch, pitchOffsetY + iy * pitch]
            }))),
            portsX, 
            portsY
        }
    } catch (e) {
        console.error('An unknown error occurred.')
    }
}

export function branchPortCSVStringToIndex(port: string): [number, number] | undefined {
    const r = port.match(BRANCHPORT_CSV_PATTERN)
    if (r === undefined || r === null) {
        return undefined
    }
    const yString = r[1]
    const xString = r[2]
    const x = parseInt(xString) - 1
    const y = fromAlphabetCol(yString)
    return [x, y]
}

export function portStringToIndex(port: string): [number, number] | undefined {
    const r = port.match(PORT_PATTERN)
    if (r === undefined || r === null) {
        return undefined
    }
    const yString = r[1]
    const xString = r[2]
    const x = parseInt(xString) - 1
    const y = fromAlphabetCol(yString)
    return [x, y]
}

export function portIndexToString(port: [number, number]) {
    return `${toAlphabetCol(port[1])}${port[0] + 1}`
}

export const upperCaseAlphabet = [...Array(26).keys()].map((_, i) => String.fromCodePoint(i + 'A'.codePointAt(0)!))

export function fromAlphabetCol(col: string) {
    const upperCaseCol = col.toUpperCase()
    return [...upperCaseCol]
        .map((ch) => upperCaseAlphabet.indexOf(ch))
        .reduce((n, i) => n * 26 + i + 1, 0) - 1
}

export function toAlphabetCol(n: number) {
    const chars = []

    let d
    while (n >= 0) {
        ;[n, d] = [Math.floor(n / 26) - 1, n % 26]
        chars.unshift(upperCaseAlphabet[d])
    }
    return chars.join('')
}