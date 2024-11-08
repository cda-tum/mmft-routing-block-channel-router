import { useState } from "react"
import { MicrometerInput } from "./components/MicrometerInput"
import { Box, Button, Link, Stack, Typography, useTheme } from "@mui/joy"
import { InfoOutlined } from "@mui/icons-material"
import { defaultInputParameters, InputParameters, validate, validateAble } from "./utils/input-parameters"
import { defaultInputPorts, generatePorts, InputPorts, PortKey } from "./utils/ports"
import { ConnectionID, defaultInputConnections, defaultOutputConnections, OutputConnections } from "./utils/connections"
import { route } from "./utils/route"
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
    const [dxfDownload, setDXFDownload] = useState<(undefined | string)>(undefined)
    const [input, setInput] = useState<InputState>(defaultInputState)
    const [output, setOutput] = useState<OutputState>(defaultOutputState)

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
            <Box>
                <Typography>A short introductionary paragraph and a link to further resources. <Link href="#">Learn more</Link>.</Typography>
            </Box>
            <Box sx={{
                marginY: 4
            }}>
                <Typography level="h4">Board Settings</Typography>
                <Stack direction="row" spacing={4} flexWrap='wrap' useFlexGap>
                    <MicrometerInput
                        label="Board Width"
                        explainIcon={<BoardWidthIcon width={50} height={50} />}
                        value={input.parameters.boardWidth.fieldValue}
                        error={input.parameters.boardWidth.error ? input.parameters.boardWidth.errorMessage : undefined}
                        warning={input.parameters.boardWidth.warning}
                        onChange={(fv, pv) => updateInputParameter('boardWidth', fv, pv)}
                        description="Absolute width of the routing board."
                    />
                    <MicrometerInput
                        label="Board Height"
                        explainIcon={<BoardHeightIcon width={50} height={50} />}
                        value={input.parameters.boardHeight.fieldValue}
                        error={input.parameters.boardHeight.error ? input.parameters.boardHeight.errorMessage : undefined}
                        warning={input.parameters.boardHeight.warning}
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
                            warning={input.parameters.portDiameter.warning}
                            onChange={(fv, pv) => updateInputParameter('portDiameter', fv, pv)}
                            description="Diameter of ports."
                        />
                        <MicrometerInput
                            label="Pitch"
                            explainIcon={<PitchIcon width={50} height={50} />}
                            value={input.parameters.pitch.fieldValue}
                            error={input.parameters.pitch.error ? input.parameters.pitch.errorMessage : undefined}
                            warning={input.parameters.pitch.warning}
                            onChange={(fv, pv) => updateInputParameter('pitch', fv, pv)}
                            description="Distance between ports on the port grid."
                            autocompleteValues={[1.5, 3.0, 4.5, 6.0, 7.5, 9.0, 10.5, 12.0, 13.5, 15.0]}
                        />
                    </Stack>
                    <Stack direction="row" spacing={4} flexGrow={1} flexWrap='wrap' useFlexGap>
                        <MicrometerInput
                            label="Pitch Offset X"
                            explainIcon={<PitchOffsetXIcon width={50} height={50} />}
                            value={input.parameters.pitchOffsetX.fieldValue}
                            error={input.parameters.pitchOffsetX.error ? input.parameters.pitchOffsetX.errorMessage : undefined}
                            warning={input.parameters.pitchOffsetX.warning}
                            onChange={(fv, pv) => updateInputParameter('pitchOffsetX', fv, pv)}
                            description="Offset of the top left port in X direction."
                        />
                        <MicrometerInput
                            label="Pitch Offset Y"
                            explainIcon={<PitchOffsetYIcon width={50} height={50} />}
                            value={input.parameters.pitchOffsetY.fieldValue}
                            error={input.parameters.pitchOffsetY.error ? input.parameters.pitchOffsetY.errorMessage : undefined}
                            warning={input.parameters.pitchOffsetY.warning}
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
                        warning={input.parameters.channelWidth.warning}
                        onChange={(fv, pv) => updateInputParameter('channelWidth', fv, pv)}
                        description="Width of channels' cross section."
                    />
                    <MicrometerInput
                        label="Channel Spacing"
                        explainIcon={<ChannelSpacingIcon width={50} height={50} />}
                        value={input.parameters.channelSpacing.fieldValue}
                        error={input.parameters.channelSpacing.error ? input.parameters.channelSpacing.errorMessage : undefined}
                        warning={input.parameters.channelSpacing.warning}
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
                        marginY: 2,
                    }}>

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
                                outputConnections={output.connections}
                                closeDropdown={closeDropdown}
                            ></BoardDisplay>
                        }
                    </Box>
                </Box>
            </Box>

            <Box
                sx={{
                    marginY: 4,
                }}
            >
                <Typography level="h4">Design</Typography>
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
                            //TODO: adapt for multi-connection
                            /*
                            const outlines = generateOutlines(input.parameters.channelWidth.value!, r.connections)
                            const dxf = generateDXF({
                                width: input.parameters.boardWidth.value!,
                                height: input.parameters.boardHeight.value!,
                                originX: 0,
                                originY: 0,
                            }, outlines)
                            setDXFDownload(dxf)*/
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