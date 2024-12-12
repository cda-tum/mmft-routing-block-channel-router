import { useEffect, useState } from "react"
import { MicrometerInput } from "./components/MicrometerInput"
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Box, Button, Link, Stack, Typography, useTheme } from "@mui/joy"
import { InfoOutlined } from "@mui/icons-material"
import { defaultInputParameters, InputParameters, validate, validateAble } from "./utils/input-parameters"
import { generatePorts, PortKey } from "./utils/ports"
import ImportExportIcon from '@mui/icons-material/ImportExport';
import { ConnectionID, defaultInputConnections, defaultOutputConnections, defaultOutputConnectionsRaw, generateDXF, OutputConnections, OutputConnectionsRaw } from "./utils/connections"
import { route } from "./utils/route"
import { LayoutChoice } from "./components/LayoutChoice"
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
import { OutputChannelCapChoice } from "./components/OutputChannelCapChoice"
import { DownloadButton } from "./components/DownloadButton"
import { ContentBox } from "./components/ContentBox"
import { UploadButton } from "./components/UploadButton"
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import OutputIcon from '@mui/icons-material/Output';
import { ChannelIcon } from "./icons/ChannelIcon"
import { SxProps } from "@mui/joy/styles/types"
import { BoardIcon } from "./icons/BoardIcon"
import { MMFTIcon } from "./icons/MMFTIcon"

export type InputState = {
    parameters: InputParameters
    parameter_errors: string[] | undefined
    connection_errors: string[] | undefined
    general_errors: string[] | undefined
    portsX: number | undefined
    portsY: number | undefined
    connections: ConnectionsState
}

const defaultInputState: InputState = {
    parameters: defaultInputParameters,
    parameter_errors: undefined,
    connection_errors: undefined,
    general_errors: undefined,
    connections: defaultInputConnections,
    portsX: undefined,
    portsY: undefined
}

export type OutputState = {
    error: undefined | string
    is_partial: boolean
    connections: OutputConnections
    connectionsRaw: OutputConnectionsRaw
}

const defaultOutputState: OutputState = {
    error: undefined,
    is_partial: false,
    connections: defaultOutputConnections,
    connectionsRaw: defaultOutputConnectionsRaw
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

export type DXFState = undefined | string

export function BoardUI() {
    const [dxfOutput, setDXFOutput] = useState<DXFState>(undefined)
    const [input, setInput] = useState<InputState>(defaultInputState)
    const [output, setOutput] = useState<OutputState>(defaultOutputState)

    const [nonce, setNonce] = useState<number>(1)
    const [nonce2, setNonce2] = useState<number>(1)

    const getState = () => ({
        dxfOutput,
        input,
        output
    })

    const setState = (state: {
        dxfOutput: DXFState
        input: InputState
        output: OutputState
    }) => {
        setDXFOutput(state.dxfOutput)
        setInput(state.input)
        setOutput(state.output)
    }

    useEffect(() => {
        if (output.error === undefined && Object.keys(output.connectionsRaw).length > 0 && input.parameters.channelWidth.value !== undefined && input.parameters.channelCap.value !== undefined && input.parameters.channelCapCustom.value !== undefined && input.parameters.boardWidth.value !== undefined && input.parameters.boardHeight.value !== undefined) {
            setDXFOutput(generateDXF(output.connectionsRaw, input.parameters.channelWidth.value, input.parameters.channelCap.value, input.parameters.channelCapCustom.value, input.parameters.boardWidth.value, input.parameters.boardHeight.value))
        } else {
            setDXFOutput(undefined)
        }
    }, [output, input.parameters.channelCap.value, input.parameters.channelCapCustom.value, input.parameters.channelWidth, input.parameters.boardWidth, input.parameters.boardHeight])

    useEffect(() => {
        updateInputParameters(input.parameters)
    }, [])

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

            let portsX = undefined
            let portsY = undefined

            if (gPorts !== undefined) {
                portsX = gPorts.portsX
                portsY = gPorts.portsY
            }

            setInput(s => ({
                ...s,
                portsX,
                portsY,
                parameter_errors: parameter_errors,
                general_errors: general_errors,
                connection_errors: connection_errors,
                parameters: validated_parameters
            }))
        } else {
            setInput(s => ({
                ...s,
                parameter_errors: undefined,
                general_errors: ["Some fields have invalid input!"],
                connection_errors: undefined,
                parameters: parameters
            }))
        }

        resetOutput()
    }

    const resetOutput = () => {
        setOutput({
            error: undefined,
            is_partial: false,
            connections: {},
            connectionsRaw: []
        })
    }

    const theme = useTheme()
    const [closeDropdown, setCloseDropdown] = useState(false)

    const hasErrors = (input.parameter_errors !== undefined && input.parameter_errors.length > 0) || (input.general_errors !== undefined && input.general_errors.length > 0) || (input.connection_errors !== undefined && input.connection_errors.length > 0) || Object.values(input.parameters).some(p => p.error)

    const accordionErrorSx: SxProps = { backgroundColor: `rgb(from ${theme.vars.palette.danger[500]} r g b / calc(alpha / 2))` }

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
            <Box>
                <MMFTIcon
                    primaryColor={theme.vars.palette.common.white}
                    secondaryColor={`hsl(from ${theme.vars.palette.primary[500]} h s calc(l * 2.3))`}
                    height='8em'
                    style={{
                        verticalAlign: 'middle'
                    }}
                />
                <Typography
                    level='h1'
                    sx={{
                        color: theme.vars.palette.common.white,
                        paddingY: 1,
                        display: 'inline-block',
                        verticalAlign: 'middle'
                    }}
                >
                    Routing Block Channel Router
                </Typography>
            </Box>
        </header>
        <main>
            <Box sx={{
                marginBottom: 2
            }}>
                <Typography>A tool that generates channel connections for ISO-22916-compliant microfluidic routing components. <Link href="https://github.com/cda-tum/mmft-routing-block-channel-router">Learn more</Link>.</Typography>
            </Box>
            <AccordionGroup>
                <Accordion>
                    <AccordionSummary>
                        <Typography level="h4"><ImportExportIcon sx={{
                            verticalAlign: 'bottom'
                        }} /> Load & Save</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack direction="row" spacing={4} flexWrap='wrap' useFlexGap paddingY={2}>
                            <UploadButton
                                label="Load Configuration"
                                onSuccess={content => setState(JSON.parse(content))}
                            >

                            </UploadButton>
                            <DownloadButton
                                fileName={`configuration_${nonce}.json`}
                                content={() => {
                                    setNonce(n => n + 1)
                                    return JSON.stringify(getState())
                                }}
                                mime="text/json"
                                label="Save Current Configuration"
                            />
                        </Stack>
                    </AccordionDetails>
                </Accordion>
                <Accordion>
                    <AccordionSummary sx={input.parameters.boardWidth.error || input.parameters.boardHeight.error ? accordionErrorSx : {}}>
                        <Typography level="h4"><BoardIcon sx={{
                            verticalAlign: 'bottom'
                        }} /> Board Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
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
                    </AccordionDetails>
                </Accordion>
                <Accordion>
                    <AccordionSummary sx={input.parameters.portDiameter.error || input.parameters.pitch.error || input.parameters.pitchOffsetX.error || input.parameters.pitchOffsetY.error ? accordionErrorSx : {}}>
                        <Typography level="h4"><RadioButtonUncheckedIcon sx={{
                            verticalAlign: 'bottom'
                        }} /> Port Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
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
                    </AccordionDetails>
                </Accordion>
                <Accordion>
                    <AccordionSummary sx={input.parameters.channelWidth.error || input.parameters.channelSpacing.error || input.parameters.layout.error ? accordionErrorSx : {}}>
                        <Typography level="h4"><ChannelIcon sx={{
                            verticalAlign: 'bottom'
                        }} /> Channel Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
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

                    </AccordionDetails>

                </Accordion>

                <Accordion>
                    <AccordionSummary sx={input.parameters.channelCap.error || input.parameters.channelCapCustom.error ? accordionErrorSx : {}}>
                        <Typography level="h4"><OutputIcon sx={{
                            verticalAlign: 'bottom'
                        }} /> DXF Output Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <OutputChannelCapChoice
                            channelCap={input.parameters.channelCap.value}
                            channelCapCustom={input.parameters.channelCapCustom}
                            onChangeChannelCap={channelCap => updateInputParameter('channelCap', channelCap, channelCap)}
                            onChangeChannelCapCustom={(fv, pv) => updateInputParameter('channelCapCustom', fv, pv)}
                        />
                    </AccordionDetails>
                </Accordion>
            </AccordionGroup>



            <Box sx={{ marginY: 2 }}>
                <Typography level="h4">Connections</Typography>
                <ContentBox>

                    <Box
                        sx={{
                            marginX: 2,
                            marginY: 1
                        }}
                    >
                        <BoardDisplay
                            show={!hasErrors}
                            boardWidth={input.parameters.boardWidth.value!}
                            boardHeight={input.parameters.boardHeight.value!}
                            pitch={input.parameters.pitch.value!}
                            pitchOffsetX={input.parameters.pitchOffsetX.value!}
                            pitchOffsetY={input.parameters.pitchOffsetY.value!}
                            portDiameter={input.parameters.portDiameter.value!}
                            channelWidth={input.parameters.channelWidth.value!}
                            columns={input.portsX}
                            rows={input.portsY}
                            onChange={c => setInput(s => ({
                                ...s,
                                connections: c
                            }))}
                            outputConnections={output.connections}
                            closeDropdown={closeDropdown}
                            clearOutputConnections={() => {
                                setOutput({
                                    error: undefined,
                                    is_partial: false,
                                    connections: {},
                                    connectionsRaw: []
                                })
                            }}
                        />

                        {hasErrors && <Typography
                            variant="soft"
                            color="danger"
                            sx={{
                                padding: '1em'
                            }}
                        >
                            {input.parameter_errors !== undefined && input.parameter_errors.length > 0 && input.parameter_errors.map(e => <>{e}<br /></>
                            )}
                            {input.general_errors !== undefined && input.general_errors.length > 0 && input.general_errors.map(e => <>{e}<br /></>
                            )}
                        </Typography>}
                    </Box>
                </ContentBox>
            </Box>

            <Box sx={{ marginY: 2 }}>
                <Typography level="h4">Design</Typography>
                <ContentBox sx={{
                    padding: 2
                }}>

                    <Button
                        disabled={!((input.parameter_errors === undefined || input.parameter_errors.length === 0) && (input.general_errors === undefined || input.general_errors.length === 0) && (input.connection_errors === undefined || input.connection_errors.length === 0))}
                        onClick={_ => {
                            const r = route(input)
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
                            }} /> Generate Design</Typography>
                    </Button>

                    <DownloadButton
                        label="Download DXF"
                        fileName={`chip_${nonce2}.dxf`}
                        mime={'image/x-dxf'}
                        content={dxfOutput !== undefined ? () => {
                            setNonce2(n => n + 1)
                            return dxfOutput
                        } : undefined}
                        noContentMessage={"There is no valid routing. Click 'Generate Design' to generate a routing."}
                    />

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
                </ContentBox>

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
    </div>
}