import { useCallback, useEffect, useMemo, useState } from "react"
import { MicrometerInput } from "./components/MicrometerInput"
import { Box, Button, Typography, useTheme } from "@mui/joy"
import { InfoOutlined } from "@mui/icons-material"
import { defaultInputParameters, InputParameters, validate } from "./utils/input-parameters"
import { defaultInputPorts, generatePorts, InputPorts, PortKey } from "./utils/ports"
import { ConnectionID, defaultInputConnections, defaultOutputConnections, InputConnections, OutputConnections } from "./utils/connections"
import { generateView } from "./utils/view"
import { route } from "./utils/route"
import { oklabrandom } from "./utils/color"
import { LayoutChoice } from "./components/LayoutChoice"
import { Port } from "./components/Port"

export type InputState = {
    parameters: InputParameters
    parameter_errors: string[] | undefined
    connection_errors: string[] | undefined
    general_errors: string[] | undefined
    ports: InputPorts
    connections: InputConnections
}

const defaultInputState: InputState = {
    parameters: defaultInputParameters,
    parameter_errors: undefined,
    connection_errors: undefined,
    general_errors: undefined,
    ports: defaultInputPorts,
    connections: defaultInputConnections
}

export type OutputState = {
    error: undefined | string
    is_partial: boolean
    connections: OutputConnections
}

const defaultOutputState: OutputState = {
    error: undefined,
    is_partial: false,
    connections: defaultOutputConnections
}

export type BoardEdit = {
    state: BoardEditState.Default
    nextConnection: ConnectionID
    nextConnectionColor: string
} | {
    state: BoardEditState.Selected
    nextConnection: ConnectionID
    nextConnectionColor: string
    selected: ConnectionID
} | {
    state: BoardEditState.FirstPortSet
    nextConnection: ConnectionID
    nextConnectionColor: string
    port: PortKey
}

enum BoardEditState {
    Default,
    Selected,
    FirstPortSet
}

export function BoardUI() {

    const colorGenerator = useMemo(() => {
        return oklabrandom(0.55, 0.9, '  Fine-Sir-1584660650  ')
    }, [])

    const [input, setInput] = useState<InputState>(defaultInputState)
    const [output, setOutput] = useState<OutputState>(defaultOutputState)
    const [portConnectionMap, setPortConnectionMap] = useState<Record<number, Record<number, ConnectionID>>>({})
    const [boardEdit, setBoardEdit] = useState<BoardEdit>({
        state: BoardEditState.Default,
        nextConnection: 0,
        nextConnectionColor: '#fff'
    })

    const createConnection = useCallback(() => {
        let i = 0
        while (input.connections[i] !== undefined) {
            i++
        }
        const colorValues = colorGenerator.next().value as [number, number, number]
        const color = `oklab(${colorValues[0]} ${colorValues[1]} ${colorValues[2]})`
        setInput(s => {
            return {
                ...s,
                connections: {
                    ...s.connections,
                    [i]: {
                        color,
                        ports: []
                    }
                }
            }
        })

        return { index: i, color }
    }, [input.connections])

    const resetBoardEdit = useCallback(() => {
        setBoardEdit(s => ({
            state: BoardEditState.Default,
            nextConnection: s.nextConnection,
            nextConnectionColor: input.connections[s.nextConnection]?.color ?? s.nextConnectionColor//input.connections[s.nextConnection].color
        }))
    }, [input.connections])

    useEffect(() => {
        createConnection()
        resetBoardEdit()
        updateInputParameters(defaultInputParameters)
    }, [])

    useEffect(() => {
        resetBoardEdit()
    }, [input.ports])

    const updateInputParameter = (parameter: string, value: string | number | undefined) => {
        if (!(parameter in input.parameters)) {
            throw 'InvalidParameter'
        }

        const parameters = {
            ...input.parameters,
            [parameter]: {
                error: false,
                value: value
            }
        }
        updateInputParameters(parameters)
    }

    const updateInputParameters = (parameters: InputParameters) => {
        const { parameters: validated_parameters, parameter_errors, general_errors, connection_errors } = validate(parameters)

        let ports: InputPorts = undefined
        if (Object.values(validated_parameters).every(p => !p.error) && (parameter_errors === undefined || parameter_errors.length === 0) && (general_errors === undefined || general_errors.length === 0)) {
            ports = generatePorts(validated_parameters)
        }

        setInput(s => ({
            ...s,
            ports,
            parameter_errors: parameter_errors,
            general_errors: general_errors,
            connection_errors: connection_errors,
            parameters: validated_parameters
        }))

        resetBoardEdit()

        setOutput({
            error: undefined,
            is_partial: false,
            connections: {}
        })
    }

    const theme = useTheme()

    const view = generateView(input.parameters)
    return <>
        <MicrometerInput
            label="Board Width"
            value={input.parameters.boardWidth.value}
            error={input.parameters.boardWidth.error ? input.parameters.boardWidth.error_message : undefined}
            onChange={v => updateInputParameter('boardWidth', v)}
            description="The absolute width of the routing board"
        />
        <MicrometerInput
            label="Board Height"
            value={input.parameters.boardHeight.value}
            error={input.parameters.boardHeight.error ? input.parameters.boardHeight.error_message : undefined}
            onChange={v => updateInputParameter('boardHeight', v)}
            description="The absolute height of the routing board"
        />
        <MicrometerInput
            label="Pitch"
            value={input.parameters.pitch.value}
            error={input.parameters.pitch.error ? input.parameters.pitch.error_message : undefined}
            onChange={v => updateInputParameter('pitch', v)}
            description="The pitch of the port grid"
        />
        <MicrometerInput
            label="Pitch Offset X"
            value={input.parameters.pitchOffsetX.value}
            error={input.parameters.pitchOffsetX.error ? input.parameters.pitchOffsetX.error_message : undefined}
            onChange={v => updateInputParameter('pitchOffsetX', v)}
            description="The pitch offset of the port grid in x direction"
        />
        <MicrometerInput
            label="Pitch Offset Y"
            value={input.parameters.pitchOffsetY.value}
            error={input.parameters.pitchOffsetY.error ? input.parameters.pitchOffsetY.error_message : undefined}
            onChange={v => updateInputParameter('pitchOffsetY', v)}
            description="The pitch offset of the port grid in y direction"
        />
        <MicrometerInput
            label="Channel Width"
            value={input.parameters.channelWidth.value}
            error={input.parameters.channelWidth.error ? input.parameters.channelWidth.error_message : undefined}
            onChange={v => updateInputParameter('channelWidth', v)}
            description="The width of channels"
        />
        <MicrometerInput
            label="Channel Spacing"
            value={input.parameters.channelSpacing.value}
            error={input.parameters.channelSpacing.error ? input.parameters.channelSpacing.error_message : undefined}
            onChange={v => updateInputParameter('channelSpacing', v)}
            description="The required spacing between channels"
        />
        <MicrometerInput
            label="Port Diameter"
            value={input.parameters.portDiameter.value}
            error={input.parameters.portDiameter.error ? input.parameters.portDiameter.error_message : undefined}
            onChange={v => updateInputParameter('portDiameter', v)}
            description="The diameter of ports"
        />
        {input.parameter_errors !== undefined &&
            input.parameter_errors.map(e => <Typography
                variant="soft"
                color="danger"
                startDecorator={<InfoOutlined />}
                sx={{
                    padding: '1em'
                }}
            >
                {e}
            </Typography>
            )
        }


        <LayoutChoice
            layout={input.parameters.layout.value}
            onChange={layout => updateInputParameter('layout', layout)}
        />

        {input.connection_errors !== undefined &&
            input.connection_errors.map(e => <Typography
                variant="soft"
                color="danger"
                startDecorator={<InfoOutlined />}
                sx={{
                    padding: '1em'
                }}
            >
                {e}
            </Typography>
            )
        }

        {input.general_errors !== undefined &&
            input.general_errors.map(e => <Typography
                variant="soft"
                color="danger"
                startDecorator={<InfoOutlined />}
                sx={{
                    padding: '1em'
                }}
            >
                {e}
            </Typography>
            )
        }

{output.error !== undefined &&
            <Typography
                variant="soft"
                color="danger"
                startDecorator={<InfoOutlined />}
                sx={{
                    padding: '1em'
                }}
            >
                {output.error}
            </Typography>
        }


        <Button
            disabled={!((input.parameter_errors === undefined || input.parameter_errors.length === 0) && (input.general_errors === undefined || input.general_errors.length === 0) && (input.connection_errors === undefined || input.connection_errors.length === 0))}
            onClick={_ => {
                resetBoardEdit()
                const r = route(input)
                setOutput(r)
            }}
        >
            <Typography sx={{ color: theme.vars.palette.common.white }}>Start Routing</Typography>
        </Button>

        <Box>
            <svg
                width="1000"
                height="600"
                style={{
                    backgroundColor: theme.vars.palette.background.surface,
                    borderRadius: theme.radius.sm,
                    border: '1px solid',
                    borderColor: theme.vars.palette.background.level2,
                    boxShadow: `0px 2px ${theme.vars.palette.background.level1}`
                }}
                {...(view !== undefined ? { viewBox: view.viewBox } : {})}
            >
                {input.ports !== undefined && view !== undefined && <>
                    <rect
                        x={0}
                        y={0}
                        width={input.parameters.boardWidth.value}
                        height={input.parameters.boardHeight.value}
                        fill="none"
                        strokeWidth={view.strokeWidth}
                        stroke={theme.vars.palette.text.primary}
                        rx={view.strokeWidth / 2}
                    >

                    </rect>

                    {Object.entries(output.connections).map(([connectionId, points]) => {

                        const connection = input.connections[parseInt(connectionId)]

                        if (connection === undefined) {
                            console.error('Connection not found in input')
                            return <></>
                        }

                        return <path
                            d={`M ${points.map(p => `${p[0]},${p[1]}`).join('L')}`}
                            stroke={connection.color}
                            strokeWidth={input.parameters.channelWidth.value}
                            fill="none"
                        ></path>
                    })}

                    {
                        input.ports!.map(px => px.map(port => {

                            const hasConnection = portConnectionMap[port.index[0]]?.[port.index[1]] !== undefined
                            const connection = hasConnection ? input.connections[portConnectionMap[port.index[0]]?.[port.index[1]]] : undefined

                            const selectSecondPortStyle = boardEdit.state === BoardEditState.FirstPortSet && hasConnection ? {
                                opacity: 0.3,
                                cursor: 'not-allowed'
                            } : undefined

                            return <Port
                                position={port.position}
                                diameter={input.parameters.portDiameter.value!}
                                style={{
                                    cursor: 'pointer',
                                    strokeDasharray: input.parameters.portDiameter.value! / 6,
                                    strokeLinecap: 'round',
                                    fill: hasConnection ? connection?.color : 'transparent',
                                    ...selectSecondPortStyle
                                }}
                                hoverStyle={hasConnection ? {} : {
                                    fill: boardEdit.nextConnectionColor,
                                    strokeDasharray: undefined
                                }}
                                highlightStyle={{ fill: boardEdit.nextConnectionColor, strokeDasharray: undefined }}
                                highlighted={boardEdit.state === BoardEditState.FirstPortSet && boardEdit.port[0] == port.index[0] && boardEdit.port[1] === port.index[1]}
                                onClick={() => {
                                    const portKey = [port.index[0], port.index[1]] as [number, number]
                                    if (!portConnectionMap[port.index[0]]?.[port.index[1]]) {
                                        if (boardEdit.state === BoardEditState.Default) {
                                            setBoardEdit(e => ({
                                                state: BoardEditState.FirstPortSet,
                                                nextConnection: e.nextConnection,
                                                nextConnectionColor: e.nextConnectionColor,
                                                port: portKey
                                            }))
                                        } else if (boardEdit.state === BoardEditState.FirstPortSet) {
                                            if (!hasConnection && (boardEdit.port[0] !== port.index[0] || boardEdit.port[1] !== port.index[1])) {
                                                const { index, color } = createConnection()
                                                setPortConnectionMap(m => ({
                                                    ...m,
                                                    [boardEdit.port[0]]: {
                                                        ...m[boardEdit.port[0]],
                                                        [boardEdit.port[1]]: boardEdit.nextConnection
                                                    }
                                                }))
                                                setPortConnectionMap(m => ({
                                                    ...m,
                                                    [port.index[0]]: {
                                                        ...m[port.index[0]],
                                                        [port.index[1]]: boardEdit.nextConnection
                                                    }
                                                }))
                                                setInput(i => ({
                                                    ...i,
                                                    connections: {
                                                        ...i.connections,
                                                        [boardEdit.nextConnection]: {
                                                            ...i.connections[boardEdit.nextConnection],
                                                            ports: [boardEdit.port, port.index]
                                                        }
                                                    }
                                                }))
                                                setBoardEdit(_ => ({
                                                    state: BoardEditState.Default,
                                                    nextConnection: index,
                                                    nextConnectionColor: color
                                                }))
                                            }
                                        }
                                    } else {

                                    }
                                }}
                            />
                        }
                        ))
                    }
                </>
                }
            </svg>
        </Box>
    </>
}