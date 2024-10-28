import { useCallback, useEffect, useMemo, useState } from "react"
import { MicrometerInput } from "./components/MicrometerInput"
import { Box, Button, Stack, Typography, useTheme } from "@mui/joy"
import { InfoOutlined } from "@mui/icons-material"
import { defaultInputParameters, InputParameters, validate, validateAble } from "./utils/input-parameters"
import { defaultInputPorts, generatePorts, InputPorts, PortKey } from "./utils/ports"
import { ConnectionID, defaultInputConnections, defaultOutputConnections, OutputConnections } from "./utils/connections"
import { route } from "./utils/route"
import { oklabrandom } from "./utils/color"
import { LayoutChoice } from "./components/LayoutChoice"
import { downloadDXF, generateDXF, generateOutlines } from "./utils/dxf"
import { nanoid } from "nanoid"
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import { BoardDisplay } from "./components/BoardDisplay"
import { BoardWidthIcon } from "./icons/BoardWidthIcon"
import { BoardHeightIcon } from "./icons/BoardHeightIcon"
import { PitchIcon } from "./icons/PitchIcon"
import { PortDiameterIcon } from "./icons/PortDiameterIcon"
import { PitchOffsetXIcon } from "./icons/PitchOffsetXIcon"
import { PitchOffsetYIcon } from "./icons/PitchOffsetYIcon"
import { ChannelWidthIcon } from "./icons/ChannelWidthIcon"
import { ChannelSpacingIcon } from "./icons/ChannelSpacingIcon"
import { ConnectionsState } from "./hooks/useConnectionState"

export type InputState = {
    parameters: InputParameters
    parameter_errors: string[] | undefined
    connection_errors: string[] | undefined
    general_errors: string[] | undefined
    ports: InputPorts
    portsX: number | undefined
    portsY: number | undefined
    connections: ConnectionsState
}

const defaultInputState: InputState = {
    parameters: defaultInputParameters,
    parameter_errors: undefined,
    connection_errors: undefined,
    general_errors: undefined,
    ports: defaultInputPorts,
    connections: defaultInputConnections,
    portsX: undefined,
    portsY: undefined
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

    const [dxfDownload, setDXFDownload] = useState<(undefined | string)>(undefined)
    const [input, setInput] = useState<InputState>(defaultInputState)
    const [output, setOutput] = useState<OutputState>(defaultOutputState)
    const [boardEdit, setBoardEdit] = useState<BoardEdit>({
        state: BoardEditState.Default,
        nextConnection: -1,
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

    const deleteConnection = useCallback((connectionId: number) => {
        const { [connectionId]: removed, ...connections } = input.connections
        setInput(i => ({
            ...i,
            connections
        }))
        /*setPortConnectionMap(m => ({
            ...m,
            [removed.ports[0][0]]: {
                ...m[removed.ports[0][0]],
                [removed.ports[0][1]]: undefined
            }
        }))
        setPortConnectionMap(m => ({
            ...m,
            [removed.ports[1][0]]: {
                ...m[removed.ports[1][0]],
                [removed.ports[1][1]]: undefined
            }
        }))*/
        //resetBoardEdit()
        resetOutput()
    }, [output, input, /*portConnectionMap*/])

    

    /*const resetBoardEdit = useCallback(() => {
        setBoardEdit(s => ({
            state: BoardEditState.Default,
            nextConnection: s.nextConnection,
            nextConnectionColor: input.connections[s.nextConnection]?.color ?? s.nextConnectionColor//input.connections[s.nextConnection].color
        }))
    }, [input.connections])*/

    useEffect(() => {
        if (boardEdit.nextConnection === -1) {
            createConnection()
            //resetBoardEdit()
            setBoardEdit(e => ({
                ...e,
                nextConnection: 0
            }))
            updateInputParameters(defaultInputParameters)
        }
    }, [boardEdit.nextConnection])

    useEffect(() => {
        //resetBoardEdit()
    }, [input.ports])

    const updateInputParameter = (parameter: string, fieldValue: string, parsedValue: string | number | undefined) => {
        if (!(parameter in input.parameters)) {
            throw 'InvalidParameter'
        }

        const parameters = {
            ...input.parameters,
            [parameter]: {
                error: parsedValue === undefined,
                value: parsedValue,
                fieldValue: fieldValue,
                ...(parsedValue === undefined ? { errorMessage: 'Please enter a valid number!' } : {})
            }
        }
        updateInputParameters(parameters)
    }

    const updateInputParameters = (parameters: InputParameters) => {
        if (validateAble(parameters)) {
            const { parameters: validated_parameters, parameter_errors, general_errors, connection_errors } = validate(parameters)

            let gPorts
            if (Object.values(validated_parameters).every(p => !p.error) && (parameter_errors === undefined || parameter_errors.length === 0) && (general_errors === undefined || general_errors.length === 0)) {
                gPorts = generatePorts(validated_parameters)
            }

            let ports: InputPorts = undefined
            let portsX = undefined
            let portsY = undefined

            if (gPorts !== undefined) {
                ports = gPorts.ports
                portsX = gPorts.portsX
                portsY = gPorts.portsY
            }

            setInput(s => ({
                ...s,
                ports,
                portsX,
                portsY,
                parameter_errors: parameter_errors,
                general_errors: general_errors,
                connection_errors: connection_errors,
                parameters: validated_parameters
            }))
        } else {
            const ports: InputPorts = undefined

            setInput(s => ({
                ...s,
                ports,
                parameter_errors: undefined,
                general_errors: ["Some fields have invalid input!"],
                connection_errors: undefined,
                parameters: parameters
            }))
        }

        //resetBoardEdit()

        resetOutput()
    }

    const resetOutput = () => {
        setOutput({
            error: undefined,
            is_partial: false,
            connections: {}
        })
        setDXFDownload(undefined)
    }

    const theme = useTheme()
    const [closeDropdown, setCloseDropdown] = useState(false)

    return <div
        style={{
            backgroundColor: theme.vars.palette.background.level1,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}
        onClick={_ => setCloseDropdown(d => !d)}
    >

        <header
            style={{
                backgroundColor: theme.vars.palette.primary[500],
            }}
        >
            <a><Typography
                level='h1'
                sx={{
                    color: theme.vars.palette.common.white,
                    paddingY: 1,
                }}
            >
                MMFT Board Router
            </Typography></a>
        </header>
        <main>
            <Box sx={{
                marginBottom: 4
            }}>
                <Typography level="h4">Board Settings</Typography>
                <Stack direction="row" spacing={4} flexWrap='wrap' useFlexGap>
                    <MicrometerInput
                        label="Board Width"
                        explainIcon={<BoardWidthIcon width={50} height={50} />}
                        value={input.parameters.boardWidth.fieldValue}
                        error={input.parameters.boardWidth.error ? input.parameters.boardWidth.errorMessage : undefined}
                        onChange={(fv, pv) => updateInputParameter('boardWidth', fv, pv)}
                        description="Absolute width of the routing board."
                    />
                    <MicrometerInput
                        label="Board Height"
                        explainIcon={<BoardHeightIcon width={50} height={50} />}
                        value={input.parameters.boardHeight.fieldValue}
                        error={input.parameters.boardHeight.error ? input.parameters.boardHeight.errorMessage : undefined}
                        onChange={(fv, pv) => updateInputParameter('boardHeight', fv, pv)}
                        description="Absolute height of the routing board."
                    />

                </Stack>
            </Box>
            <Box sx={{
                marginY: 4
            }}>
                <Typography level="h4">Port Settings</Typography>
                <Stack direction="row" flexWrap='wrap' useFlexGap>
                    <Stack direction="row" spacing={4} flexGrow={1} flexWrap='wrap' useFlexGap>
                        <MicrometerInput
                            label="Port Diameter"
                            explainIcon={<PortDiameterIcon width={50} height={50} />}
                            value={input.parameters.portDiameter.fieldValue}
                            error={input.parameters.portDiameter.error ? input.parameters.portDiameter.errorMessage : undefined}
                            onChange={(fv, pv) => updateInputParameter('portDiameter', fv, pv)}
                            description="Diameter of ports."
                        />
                        <MicrometerInput
                            label="Pitch"
                            explainIcon={<PitchIcon width={50} height={50} />}
                            value={input.parameters.pitch.fieldValue}
                            error={input.parameters.pitch.error ? input.parameters.pitch.errorMessage : undefined}
                            onChange={(fv, pv) => updateInputParameter('pitch', fv, pv)}
                            description="Distance between ports on the port grid."
                            autocompleteValues={[1500, 3000, 4500, 6000, 7500, 9000, 10500, 12000, 13500, 15000]}
                        />
                    </Stack>
                    <Stack direction="row" spacing={4} flexGrow={1} flexWrap='wrap' useFlexGap>
                        <MicrometerInput
                            label="Pitch Offset X"
                            explainIcon={<PitchOffsetXIcon width={50} height={50} />}
                            value={input.parameters.pitchOffsetX.fieldValue}
                            error={input.parameters.pitchOffsetX.error ? input.parameters.pitchOffsetX.errorMessage : undefined}
                            onChange={(fv, pv) => updateInputParameter('pitchOffsetX', fv, pv)}
                            description="Offset of the top left port in X direction."
                        />
                        <MicrometerInput
                            label="Pitch Offset Y"
                            explainIcon={<PitchOffsetYIcon width={50} height={50} />}
                            value={input.parameters.pitchOffsetY.fieldValue}
                            error={input.parameters.pitchOffsetY.error ? input.parameters.pitchOffsetY.errorMessage : undefined}
                            onChange={(fv, pv) => updateInputParameter('pitchOffsetY', fv, pv)}
                            description="Offset of the top left port in Y direction."
                        />
                    </Stack>
                </Stack>
            </Box>
            <Box
                sx={{
                    marginY: 4,
                }}
            >
                <Typography level="h4">Channel Settings</Typography>
                <Stack direction="row" spacing={4} flexWrap='wrap' useFlexGap>
                    <MicrometerInput
                        label="Channel Width"
                        explainIcon={<ChannelWidthIcon width={50} height={50} />}
                        value={input.parameters.channelWidth.fieldValue}
                        error={input.parameters.channelWidth.error ? input.parameters.channelWidth.errorMessage : undefined}
                        onChange={(fv, pv) => updateInputParameter('channelWidth', fv, pv)}
                        description="Width of channels' cross section."
                    />
                    <MicrometerInput
                        label="Channel Spacing"
                        explainIcon={<ChannelSpacingIcon width={50} height={50} />}
                        value={input.parameters.channelSpacing.fieldValue}
                        error={input.parameters.channelSpacing.error ? input.parameters.channelSpacing.errorMessage : undefined}
                        onChange={(fv, pv) => updateInputParameter('channelSpacing', fv, pv)}
                        description="Minimal required spacing between channels."
                    />
                </Stack>

                <LayoutChoice
                    layout={input.parameters.layout.value}
                    onChange={layout => updateInputParameter('layout', layout, layout)}
                />

            </Box>

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


            <Box
                sx={{
                    marginY: 4,
                }}
            >
                <Typography level="h4">Connections</Typography>
                <Box
                    sx={{
                        backgroundColor: theme.vars.palette.background.surface,
                        borderRadius: theme.radius.sm,
                        border: '1px solid',
                        borderColor: theme.vars.palette.background.level2,
                        boxShadow: `0px 2px ${theme.vars.palette.background.level1}`,
                        marginY: 2
                    }}>

                    <Button
                        disabled={!((input.parameter_errors === undefined || input.parameter_errors.length === 0) && (input.general_errors === undefined || input.general_errors.length === 0) && (input.connection_errors === undefined || input.connection_errors.length === 0))}
                        onClick={_ => {
                            //resetBoardEdit()
                            const r = route(input)
                            const outlines = generateOutlines(input.parameters.channelWidth.value!, r.connections)
                            const dxf = generateDXF({
                                width: input.parameters.boardWidth.value!,
                                height: input.parameters.boardHeight.value!,
                                originX: 0,
                                originY: 0,
                            }, outlines)
                            setDXFDownload(dxf)
                            setOutput(r)
                        }}
                        sx={{
                            margin: 1,
                            marginX: 2,
                        }}
                    >
                        <Typography sx={{ color: theme.vars.palette.common.white }}>
                            <PlayCircleFilledWhiteIcon sx={{
                                verticalAlign: 'bottom'
                            }} /> Route</Typography>
                    </Button>

                    <Button
                        disabled={dxfDownload === undefined}
                        onClick={_ => {
                            if (dxfDownload !== undefined) {
                                downloadDXF(dxfDownload, nanoid())
                            }
                        }}
                        sx={{
                            margin: 1,
                            marginX: 2,
                        }}
                    >
                        <Typography sx={{ color: theme.vars.palette.common.white }}>
                            <FileDownloadIcon sx={{
                                verticalAlign: 'bottom'
                            }} /> Download DXF</Typography>
                    </Button>

                    {output.error !== undefined &&
                        <Typography
                            variant="soft"
                            color="danger"
                            startDecorator={<InfoOutlined />}
                            sx={{
                                padding: 1,
                                margin: 1,
                                marginX: 2,
                                border: 1
                            }}
                        >
                            {output.error}
                        </Typography>
                    }

                    <Box
                        sx={{
                            marginX: 2,
                            marginY: 1
                        }}
                    >
                        {input.ports !== undefined &&
                            <BoardDisplay
                                boardWidth={input.parameters.boardWidth.value!}
                                boardHeight={input.parameters.boardHeight.value!}
                                pitch={input.parameters.pitch.value!}
                                pitchOffsetX={input.parameters.pitchOffsetX.value!}
                                pitchOffsetY={input.parameters.pitchOffsetY.value!}
                                portDiameter={input.parameters.portDiameter.value!}
                                channelWidth={input.parameters.channelWidth.value!}
                                columns={input.portsX!}
                                rows={input.portsY!}
                                onChange={c => setInput(s => ({
                                    ...s,
                                    connections: c
                                }))}
                                outputConnections={output}
                                closeDropdown={closeDropdown}
                            ></BoardDisplay>
                        }
                    </Box>
                </Box>
            </Box>
        </main>
        <footer
            style={{
                backgroundColor: theme.vars.palette.primary[500],
                marginTop: 'auto'
            }}
        >
            <a href="https://www.cda.cit.tum.de/research/microfluidics/" style={{ textDecoration: 'none' }}><Typography
                level='h4'
                sx={{
                    color: theme.vars.palette.common.white,
                    paddingY: 1
                }}
            >Chair for Design Automation<br />Technical University of Munich</Typography></a>
        </footer>
    </div >
}