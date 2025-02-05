import { validate as wasm_validate } from '../../../pkg/mmft_board_router';

export type Value<VALIDTYPE> = ValidValue<VALIDTYPE> | InvalidValue<VALIDTYPE>

export type ValidValue<VALIDTYPE> = {
    error: false
    warning?: string | undefined 
    value: VALIDTYPE
    fieldValue: string
}

export type InvalidValue<VALIDTYPE> = {
    error: true
    errorMessage: string
    warning?: string | undefined 
    value: VALIDTYPE | undefined
    fieldValue: string
}

export const defaultInputParameterValues: InputParameterValues = {
    boardWidth: 105,
    boardHeight: 15,
    pitch: 1.5,
    pitchOffsetX: 3,
    pitchOffsetY: 3,
    portDiameter: 0.7,
    channelWidth: 0.4,
    channelSpacing: 0.4,
    layout: 'Octilinear',
    channelCap: 'Square',
    channelCapCustom: 0.8,
    maxPorts: 5000
}

export function generateInputParametersFromConfig(v: InputParameterValues): InputParameters {
    return Object.fromEntries(Object.entries(v).map(([k, v]) => ([k, { error: false, value: v, fieldValue: v.toString() }]))) as InputParameters
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
    channelCap: string
    channelCapCustom: number
    maxPorts: number
}

export type InputParameters = { [K in keyof InputParameterValues]: Value<InputParameterValues[K]> }

export function validateAble(parameters: InputParameters) {
    return Object.values(parameters).every(p => p.value !== undefined)
}

export function validate(parameters: InputParameters) {

    const rawParams = {
        channel_width: parameters.channelWidth.value,
        channel_spacing: parameters.channelSpacing.value,
        board_width: parameters.boardWidth.value,
        board_height: parameters.boardHeight.value,
        pitch: parameters.pitch.value,
        pitch_offset_x: parameters.pitchOffsetX.value,
        pitch_offset_y: parameters.pitchOffsetY.value,
        port_diameter: parameters.portDiameter.value,
        max_ports: parameters.maxPorts.value,
        layout: parameters.layout.value,
        connections: [], // TODO
    }

    try {
        const result = wasm_validate(rawParams)

        if ('Err' in result) {
            const vp = Object.fromEntries(Object.entries(parameters).map(([k, v]) => [k, { ...v }])) as InputParameters
            const errors = result['Err']['errors']
            const pe: string[] = []
            const ge: string[] = []
            const ce: string[] = []

            const warnings = result['Err']['warnings']

            for (const error of errors) {
                if (typeof error === 'string') {
                    if (error === 'MissingChannelWidth' || error === 'InvalidChannelWidth' || error === 'ChannelWidthNotPositive') {
                        vp.channelWidth = {
                            ...vp.channelWidth,
                            error: true,
                            errorMessage: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingChannelSpacing' || error === 'InvalidChannelSpacing' || error === 'ChannelHeightNotPositive') {
                        vp.channelSpacing = {
                            ...vp.channelSpacing,
                            error: true,
                            errorMessage: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingBoardWidth' || error === 'InvalidBoardWidth' || error === 'BoardWidthNotPositive') {
                        vp.boardWidth = {
                            ...vp.boardWidth,
                            error: true,
                            errorMessage: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingBoardHeight' || error === 'InvalidBoardHeight' || error === 'BoardHeightNotPositive') {
                        vp.boardHeight = {
                            ...vp.boardHeight,
                            error: true,
                            errorMessage: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingPitch' || error === 'InvalidPitch' || error === 'PitchNotPositive') {
                        vp.pitch = {
                            ...vp.pitch,
                            error: true,
                            errorMessage: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingPitchOffsetX' || error === 'InvalidPitchOffsetX' || error === 'PitchOffsetXNotPositive') {
                        vp.pitchOffsetX = {
                            ...vp.pitchOffsetX,
                            error: true,
                            errorMessage: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingPitchOffsetY' || error === 'InvalidPitchOffsetY' || error === 'PitchOffsetYNotPositive') {
                        vp.pitchOffsetY = {
                            ...vp.pitchOffsetY,
                            error: true,
                            errorMessage: 'Must be a positive integer!'
                        }
                    } else if (error === 'InvalidMaxPorts') {
                        pe.push('Invalid maximal ports configuration!')
                    } else if (error === 'MissingConnections') {
                        ce.push('No connections supplied!')
                    } else {
                        ge.push(`Unexpected Error: ${error}`)
                    }
                } else if (typeof error === 'object') {
                    if ('MaxPortsExceeded' in error) {
                        const [ports, maxPorts] = error['MaxPortsExceeded']
                        pe.push(`The given configuration produces ${ports} possible port locations. For performance reasons, there is an upper limit of ${maxPorts} ports. Try to increase pitch, pitch offsets, or decrease board size.`)
                    } else if ('BoardWidthError' in error) {
                        const suberror = error['BoardWidthError']
                        if (suberror === 'Undefined') {
                            vp.boardWidth = {
                                ...vp.boardWidth,
                                error: true,
                                errorMessage: 'Please enter a valid number!'
                            }
                        } else if (suberror === 'NotPositive') {
                            vp.boardWidth = {
                                ...vp.boardWidth,
                                error: true,
                                errorMessage: 'Must be a positive number!'
                            }
                        } else {
                            ge.push(`Unexpected Error: ${suberror}`)
                        }
                    } else if ('BoardHeightError' in error) {
                        const suberror = error['BoardHeightError']
                        if (suberror === 'Undefined') {
                            vp.boardHeight = {
                                ...vp.boardHeight,
                                error: true,
                                errorMessage: 'Please enter a valid number!'
                            }
                        } else if (suberror === 'NotPositive') {
                            vp.boardHeight = {
                                ...vp.boardHeight,
                                error: true,
                                errorMessage: 'Must be a positive number!'
                            }
                        } else {
                            ge.push(`Unexpected Error: ${suberror}`)
                        }
                    } else if ('PortDiameterError' in error) {
                        const suberror = error['PortDiameterError']
                        if (suberror === 'Undefined') {
                            vp.portDiameter = {
                                ...vp.portDiameter,
                                error: true,
                                errorMessage: 'Please enter a valid number!'
                            }
                        } else if (suberror === 'NotPositive') {
                            vp.portDiameter = {
                                ...vp.portDiameter,
                                error: true,
                                errorMessage: 'Must be a positive number!'
                            }
                        } else {
                            ge.push(`Unexpected Error: ${suberror}`)
                        }
                    } else if ('PitchError' in error) {
                        const suberror = error['PitchError']
                        if (suberror === 'Undefined') {
                            vp.pitch = {
                                ...vp.pitch,
                                error: true,
                                errorMessage: 'Please enter a valid number!'
                            }
                        } else if (suberror === 'NotPositive') {
                            vp.pitch = {
                                ...vp.pitch,
                                error: true,
                                errorMessage: 'Must be a positive number!'
                            }
                        } else {
                            ge.push(`Unexpected Error: ${suberror}`)
                        }
                    } else if ('PitchOffsetXError' in error) {
                        const suberror = error['PitchOffsetXError']
                        if (suberror === 'Undefined') {
                            vp.pitchOffsetX = {
                                ...vp.pitchOffsetX,
                                error: true,
                                errorMessage: 'Please enter a valid number!'
                            }
                        } else if (suberror === 'NotPositive') {
                            vp.pitchOffsetX = {
                                ...vp.pitchOffsetX,
                                error: true,
                                errorMessage: 'Must be a positive number!'
                            }
                        } else if (suberror === 'SmallerThanPitch') {
                            vp.pitchOffsetX = {
                                ...vp.pitchOffsetX,
                                error: true,
                                errorMessage: 'Must equal or greater than pitch!'
                            }
                        } else {
                            ge.push(`Unexpected Error: ${suberror}`)
                        }
                    } else if ('PitchOffsetYError' in error) {
                        const suberror = error['PitchOffsetYError']
                        if (suberror === 'Undefined') {
                            vp.pitchOffsetY = {
                                ...vp.pitchOffsetY,
                                error: true,
                                errorMessage: 'Please enter a valid number!'
                            }
                        } else if (suberror === 'NotPositive') {
                            vp.pitchOffsetY = {
                                ...vp.pitchOffsetY,
                                error: true,
                                errorMessage: 'Must be a positive number!'
                            }
                        } else if (suberror === 'SmallerThanPitch') {
                            vp.pitchOffsetY = {
                                ...vp.pitchOffsetY,
                                error: true,
                                errorMessage: 'Must equal or greater than pitch!'
                            }
                        } else {
                            ge.push(`Unexpected Error: ${suberror}`)
                        }
                    } else if ('ChannelWidthError' in error) {
                        const suberror = error['ChannelWidthError']
                        if (suberror === 'Undefined') {
                            vp.channelWidth = {
                                ...vp.channelWidth,
                                error: true,
                                errorMessage: 'Please enter a valid number!'
                            }
                        } else if (suberror === 'NotPositive') {
                            vp.channelWidth = {
                                ...vp.channelWidth,
                                error: true,
                                errorMessage: 'Must be a positive number!'
                            }
                        } else {
                            ge.push(`Unexpected Error: ${suberror}`)
                        }
                    } else if ('ChannelSpacingError' in error) {
                        const suberror = error['ChannelSpacingError']
                        if (suberror === 'Undefined') {
                            vp.channelSpacing = {
                                ...vp.channelSpacing,
                                error: true,
                                errorMessage: 'Please enter a valid number!'
                            }
                        } else if (suberror === 'NotPositive') {
                            vp.channelSpacing = {
                                ...vp.channelSpacing,
                                error: true,
                                errorMessage: 'Must be a positive number!'
                            }
                        } else {
                            ge.push(`Unexpected Error: ${suberror}`)
                        }
                    } else {
                        ge.push(`Unexpected Error: ${error}`)
                    }
                } else {
                    ge.push(`Unexpected Error: ${error}`)
                }
            }

            parseWarnings(warnings, parameters)

            return { parameters: vp, parameter_errors: pe, general_errors: ge, connection_errors: ce }
        } else if ('Ok' in result) {
            const warnings = result['Ok']['warnings']

            parseWarnings(warnings, parameters)

            return { parameters: parameters as InputParameters, parameter_errors: undefined, general_errors: undefined, connection_errors: undefined }
        } else {
            throw 'Invalid Response'
        }

        
    } catch (e) {
        console.error('Validation failed due to an unknown error.', e)
        return { parameters: parameters as InputParameters, parameter_errors: [], general_errors: ['Validation failed due to an unknown error.'], connection_errors: [] }
    }
}

function parseWarnings(warnings: any, vp: InputParameters) {
    for (const warning of warnings) {
        if (typeof warning === 'string') {

        } else if (typeof warning === 'object') {
            if ('PitchNotMultiple' in warning) {
                const nextMultiple = warning['PitchNotMultiple'];
                vp.pitch = {
                    ...vp.pitch,
                    warning: `Should be a multiple of 1.5 mm. Nearest value: ${nextMultiple} mm.`
                }
            } else if ('BoardWidthNotMultiple' in warning) {
                const nextMultiple = warning['BoardWidthNotMultiple'];
                vp.boardWidth = {
                    ...vp.boardWidth,
                    warning: `Should be a multiple of 1.5 mm. Nearest value: ${nextMultiple} mm.`
                }
            } else if ('BoardHeightNotMultiple' in warning) {
                const nextMultiple = warning['BoardHeightNotMultiple'];
                vp.boardHeight = {
                    ...vp.boardHeight,
                    warning: `Should be a multiple of 1.5 mm. Nearest value: ${nextMultiple} mm.`
                }
            }
        }
    }
}
