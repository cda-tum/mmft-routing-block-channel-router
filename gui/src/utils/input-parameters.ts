import { validate as wasm_validate } from '../../../pkg/mmft_board_router';

export type Value<VALIDTYPE> = ValidValue<VALIDTYPE> | InvalidValue<VALIDTYPE>

export type ValidValue<VALIDTYPE> = {
    error: false
    value: VALIDTYPE
}

export type InvalidValue<VALIDTYPE> = {
    error: true
    error_message: string
    value: VALIDTYPE | undefined
}

export type MaybeValidValue<VALIDTYPE> = {
    error: boolean
    value: VALIDTYPE | undefined
}

export const defaultInputParameterValues: InputParameterValues = {
    boardWidth: 10000,
    boardHeight: 5000,
    pitch: 500,
    pitchOffsetX: 500,
    pitchOffsetY: 500,
    portDiameter: 200,
    channelWidth: 100,
    channelSpacing: 100,
    layout: 'Mixed',
    maxPorts: 20000
}

export function generateInputParametersFromConfig(v: InputParameterValues): InputParameters {
    return Object.fromEntries(Object.entries(v).map(([k, v]) => ([k, { error: false, value: v }]))) as InputParameters
}

export const defaultInputParameters = generateInputParametersFromConfig(defaultInputParameterValues)

export type InputParameterValues = {
    boardWidth: number
    boardHeight: number
    pitch: number
    pitchOffsetX: number
    pitchOffsetY: number
    portDiameter: number
    channelWidth: number
    channelSpacing: number
    layout: string
    maxPorts: number
}

export type InputParameters = { [K in keyof InputParameterValues]: Value<InputParameterValues[K]> }

export type MaybeValidInputParameters = { [K in keyof InputParameterValues]: Value<InputParameterValues[K]> | MaybeValidValue<InputParameterValues[K]> }

export function validate(parameters: MaybeValidInputParameters) {

    const rawParams = {
        channel_width: parameters.channelWidth.value,
        channel_spacing: parameters.channelSpacing.value,
        board_width: parameters.boardWidth.value,
        board_height: parameters.boardHeight.value,
        pitch: parameters.pitch.value,
        pitch_offset_x: parameters.pitchOffsetX.value,
        pitch_offset_y: parameters.pitchOffsetY.value,
        max_ports: parameters.maxPorts.value,
        layout: parameters.layout.value,
        connections: [[0, [[0, 0], [5, 5]]]],
    }

    try {
        const result = wasm_validate(rawParams)

        if ('Err' in result) {
            const vp = Object.fromEntries(Object.entries(parameters).map(([k, v]) => [k, { ...v }])) as InputParameters
            const errors = result['Err']
            const pe: string[] = []
            const ge: string[] = []
            const ce: string[] = []

            for (const error of errors) {
                if (typeof error === 'string') {
                    if (error === 'MissingChannelWidth' || error === 'InvalidChannelWidth' || error === 'ChannelWidthNotPositive') {
                        vp.channelWidth = {
                            ...vp.channelWidth,
                            error: true,
                            error_message: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingChannelSpacing' || error === 'InvalidChannelSpacing' || error === 'ChannelHeightNotPositive') {
                        vp.channelSpacing = {
                            ...vp.channelSpacing,
                            error: true,
                            error_message: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingBoardWidth' || error === 'InvalidBoardWidth' || error === 'BoardWidthNotPositive') {
                        vp.boardWidth = {
                            ...vp.boardWidth,
                            error: true,
                            error_message: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingBoardHeight' || error === 'InvalidBoardHeight' || error === 'BoardHeightNotPositive') {
                        vp.boardHeight = {
                            ...vp.boardHeight,
                            error: true,
                            error_message: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingPitch' || error === 'InvalidPitch' || error === 'PitchNotPositive') {
                        vp.pitch = {
                            ...vp.pitch,
                            error: true,
                            error_message: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingPitchOffsetX' || error === 'InvalidPitchOffsetX' || error === 'PitchOffsetXNotPositive') {
                        vp.pitchOffsetX = {
                            ...vp.pitchOffsetX,
                            error: true,
                            error_message: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingPitchOffsetY' || error === 'InvalidPitchOffsetY' || error === 'PitchOffsetYNotPositive') {
                        vp.pitchOffsetY = {
                            ...vp.pitchOffsetY,
                            error: true,
                            error_message: 'Must be a positive integer!'
                        }
                    } else if (error === 'InvalidMaxPorts') {
                        pe.push('Invalid maximal ports configuration!')
                    } else if (error === 'MissingConnections') {
                        ce.push('No connections supplied!')
                    } else {
                        ge.push(`Unexpected Error: ${error}`)
                        console.error(`Unexpected Error Category: ${error}`)
                    }
                } else if (typeof error === 'object') {
                    if ('MaxPortsExceeded' in error) {
                        const [ports, maxPorts] = error['MaxPortsExceeded']
                        pe.push(`The given configuration produces ${ports} possible port locations. For performance reasons, there is an upper limit of ${maxPorts} ports. Try increasing pitch, pitch offsets, or decreasing board size.`)
                    } else {
                        ge.push(`Unexpected Error.`)
                        console.error(`Unexpected Error Category`, error)
                    }
                } else {
                    ge.push(`Unexpected Error.`)
                    console.error(`Unexpected Error Category: ${error}`)
                }
            }

            return { parameters: vp, parameter_errors: pe, general_errors: ge, connection_errors: ce }
        } else if ('Ok' in result) {
            return { parameters: parameters as InputParameters, parameter_errors: undefined, general_errors: undefined, connection_errors: undefined }
        } else {
            throw 'Invalid Response'
        }
    } catch (e) {
        console.error('Validation failed due to an unknown error.', e)
        return { parameters: parameters as InputParameters, parameter_errors: [], general_errors: ['Validation failed due to an unknown error.'], connection_errors: [] }
    }
}
