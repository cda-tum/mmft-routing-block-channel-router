import { compute_ports } from '../../../pkg/mmft_board_router';
import { InputParameters } from './input-parameters';

export type Port = {
    index: [number, number]
    position: [number, number]
}

export type PortKey = [number, number]

export type InputPorts = Array<Array<Port>> | undefined

export const defaultInputPorts: InputPorts = undefined

export function generatePorts(parameters: InputParameters): InputPorts | undefined {
    const [pitch, pitchOffsetX, pitchOffsetY] = [parameters.pitch.value!, parameters.pitchOffsetX.value!, parameters.pitchOffsetY.value!]
    try {
        const { ports_x: portsX, ports_y: portsY } = compute_ports({
            board_width: parameters.boardWidth.value,
            board_height: parameters.boardHeight.value,
            pitch: pitch,
            pitch_offset_x: pitchOffsetX,
            pitch_offset_y: pitchOffsetY
        })
        return [...Array(portsX).keys()].map(ix => [...Array(portsY).keys()].map(iy => ({
            index: [ix, iy],
            position: [pitchOffsetX + ix * pitch, pitchOffsetY + iy * pitch]
        })))
    } catch (e) {
        console.error('An unknown error occurred.')
        return []
    }
}