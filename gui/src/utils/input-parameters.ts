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
    boardWidth: 30,
    boardHeight: 15,
    boardThickness: 1.5,
    pitch: 1.5,
    pitchOffsetX: 3,
    pitchOffsetY: 3,
    portDiameter: 0.7,
    channelWidth: 0.4,
    channelHeight: 0.4,
    channelSpacing: 0.4,
    layout: 'Octilinear',
    template: 'NoTemplate',
    channelCap: 'Square',
    channelCapCustom: 0.8,
    maxPorts: 5000,
    exclusionX: 2.0,
    exclusionY: 2.0,
    exclusionWidth: 5.0,
    exclusionHeight: 5.0
}


export function getStarterPlatformParams(): InputParameters {
    return {
        boardWidth: { error: false, value: 105, fieldValue: "105" },
        boardHeight: { error: false, value: 15, fieldValue: "15" },
        boardThickness: { error: false, value: 1.5, fieldValue: "1.5" },
        pitch: { error: false, value: 1.5, fieldValue: "1.5" },
        pitchOffsetX: { error: false, value: 6, fieldValue: "6" },
        pitchOffsetY: { error: false, value: 3, fieldValue: "3" },
        portDiameter: { error: false, value: 1, fieldValue: "1" },
        channelWidth: { error: false, value: 0.4, fieldValue: "0.4" },
        channelHeight: { error: false, value: 0.4, fieldValue: "0.4" },
        channelSpacing: { error: false, value: 0.4, fieldValue: "0.4" },
        layout: { error: false, value: "Octilinear", fieldValue: "Octilinear" },
        template: { error: false, value: "STARTER", fieldValue: "STARTER" },
        channelCap: { error: false, value: "Square", fieldValue: "Square" },
        channelCapCustom: { error: false, value: 0.8, fieldValue: "0.8" },
        maxPorts: { error: false, value: 5000, fieldValue: "5000" },
    }
}

export function generateInputParametersFromConfig(v: InputParameterValues): InputParameters {
    return Object.fromEntries(Object.entries(v).map(([k, v]) => ([k, { error: false, value: v, fieldValue: v.toString() }]))) as InputParameters
}

export const defaultInputParameters = generateInputParametersFromConfig(defaultInputParameterValues)

export type InputParameterValues = {
    boardWidth: number
    boardHeight: number
    boardThickness: number
    pitch: number
    pitchOffsetX: number
    pitchOffsetY: number
    portDiameter: number
    channelWidth: number
    channelHeight: number
    channelSpacing: number
    layout: string
    template: string,
    channelCap: string
    channelCapCustom: number
    maxPorts: number
    exclusionX?: number
    exclusionY?: number
    exclusionWidth?: number
    exclusionHeight?: number
}

export type InputParameters = { [K in keyof InputParameterValues]: Value<InputParameterValues[K]> }

export function validateAble(parameters: InputParameters) {
    return Object.values(parameters).every(p => p.value !== undefined)
}

export function validate(parameters: InputParameters) {

    const rawParams = {
        channel_width: parameters.channelWidth.value,
        channel_height: parameters.channelHeight.value,
        channel_spacing: parameters.channelSpacing.value,
        board_width: parameters.boardWidth.value,
        board_height: parameters.boardHeight.value,
        board_thickness: parameters.boardThickness.value,
        pitch: parameters.pitch.value,
        pitch_offset_x: parameters.pitchOffsetX.value,
        pitch_offset_y: parameters.pitchOffsetY.value,
        port_diameter: parameters.portDiameter.value,
        max_ports: parameters.maxPorts.value,
        layout: parameters.layout.value,
        template: parameters.template.value,
        connections: [], // TODO
        exclusion_x: parameters.exclusionX,
        exclusion_y: parameters.exclusionY,
        exclusion_width: parameters.exclusionWidth,
        exclusion_height: parameters.exclusionHeight
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
                    } else if (error === 'MissingChannelHeight' || error === 'InvalidChannelHeight' || error === 'ChannelHeightNotPositive') {
                        vp.channelHeight = {
                            ...vp.channelHeight,
                            error: true,
                            errorMessage: 'Must be a positive integer!'
                        }
                    } else if (error === 'MissingChannelSpacing' || error === 'InvalidChannelSpacing' || error === 'ChannelSpacingNotPositive') {
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
                    } else if (error === 'MissingBoardThickness' || error === 'InvalidBoardThickness' || error === 'BoardThicknessNotPositive') {
                        vp.boardThickness = {
                            ...vp.boardThickness,
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
                    } else if ('BoardThicknessError' in error) {
                        const suberror = error['BoardThicknessError']
                        if (suberror === 'Undefined') {
                            vp.boardThickness = {
                                ...vp.boardThickness,
                                error: true,
                                errorMessage: 'Please enter a valid number!'
                            }
                        } else if (suberror === 'NotPositive') {
                            vp.boardThickness = {
                                ...vp.boardThickness,
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
                    } else if ('ChannelHeightError' in error) {
                        const suberror = error['ChannelHeightError']
                        if (suberror === 'Undefined') {
                            vp.channelHeight = {
                                ...vp.channelHeight,
                                error: true,
                                errorMessage: 'Please enter a valid number!'
                            }
                        } else if (suberror === 'NotPositive') {
                            vp.channelHeight = {
                                ...vp.channelHeight,
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
