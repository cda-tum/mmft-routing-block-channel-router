import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MicrometerInput } from "./components/MicrometerInput"
import { Box, Button, ButtonGroup, IconButton, Menu, MenuItem, Tooltip, Typography, useTheme } from "@mui/joy"
import { InfoOutlined } from "@mui/icons-material"
import { defaultInputParameters, InputParameters, validate, validateAble } from "./utils/input-parameters"
import { defaultInputPorts, generatePorts, InputPorts, PortKey } from "./utils/ports"
import { computePathLength, ConnectionID, defaultInputConnections, defaultOutputConnections, InputConnections, OutputConnections } from "./utils/connections"
import { generateView } from "./utils/view"
import { route } from "./utils/route"
import { oklabrandom } from "./utils/color"
import { LayoutChoice } from "./components/LayoutChoice"
import { Port } from "./components/Port"
import { downloadDXF, generateDXF, generateOutlines } from "./utils/dxf"
import { nanoid } from "nanoid"
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import CheckIcon from '@mui/icons-material/Check';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { AddConnection } from "./components/AddConnection"

const randomColors = false

export type InputState = {
    parameters: InputParameters
    parameter_errors: string[] | undefined
    connection_errors: string[] | undefined
    general_errors: string[] | undefined
    ports: InputPorts
    portsX: number | undefined
    portsY: number | undefined
    connections: InputConnections
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

    const [openConnectionDropdown, setOpenConnectionDropdown] = useState<boolean>(false)
    const connectionDropdownRef = useRef<HTMLDivElement>(null);

    const [dxfDownload, setDXFDownload] = useState<(undefined | string)>(undefined)
    const [input, setInput] = useState<InputState>(defaultInputState)
    const [output, setOutput] = useState<OutputState>(defaultOutputState)
    const [portConnectionMap, setPortConnectionMap] = useState<Record<number, Record<number, ConnectionID | undefined>>>({})
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
        setPortConnectionMap(m => ({
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
        }))
        resetBoardEdit()
        resetOutput()
    }, [output, input, portConnectionMap])

    const selectConnection = useCallback((connectionId: number) => {
        setBoardEdit(s => ({
            state: BoardEditState.Selected,
            nextConnection: s.nextConnection,
            nextConnectionColor: s.nextConnectionColor,
            selected: connectionId
        }))
    }, [])

    const resetBoardEdit = useCallback(() => {
        setBoardEdit(s => ({
            state: BoardEditState.Default,
            nextConnection: s.nextConnection,
            nextConnectionColor: input.connections[s.nextConnection]?.color ?? s.nextConnectionColor//input.connections[s.nextConnection].color
        }))
    }, [input.connections])

    useEffect(() => {
        if (boardEdit.nextConnection === -1) {
            createConnection()
            resetBoardEdit()
            setBoardEdit(e => ({
                ...e,
                nextConnection: 0
            }))
            updateInputParameters(defaultInputParameters)
        }
    }, [boardEdit.nextConnection])

    useEffect(() => {
        resetBoardEdit()
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

        resetBoardEdit()

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

    const portIsInRange = (portKey: PortKey) => input.portsX !== undefined && input.portsY !== undefined && portKey[0] < input.portsX && portKey[1] < input.portsY
    const portIsFree = (portKey: PortKey) => input.portsX !== undefined && input.portsY !== undefined && portConnectionMap[portKey[0]]?.[portKey[1]] === undefined

    const theme = useTheme()

    const view = generateView(input.parameters)
    return <div
        style={{
            backgroundColor: theme.vars.palette.background.level1
        }}
        onClick={_ => setOpenConnectionDropdown(false)}
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
            <MicrometerInput
                label="Board Width"
                value={input.parameters.boardWidth.fieldValue}
                error={input.parameters.boardWidth.error ? input.parameters.boardWidth.errorMessage : undefined}
                onChange={(fv, pv) => updateInputParameter('boardWidth', fv, pv)}
                description="The absolute width of the routing board"
            />
            <MicrometerInput
                label="Board Height"
                value={input.parameters.boardHeight.fieldValue}
                error={input.parameters.boardHeight.error ? input.parameters.boardHeight.errorMessage : undefined}
                onChange={(fv, pv) => updateInputParameter('boardHeight', fv, pv)}
                description="The absolute height of the routing board"
            />
            <MicrometerInput
                label="Pitch"
                value={input.parameters.pitch.fieldValue}
                error={input.parameters.pitch.error ? input.parameters.pitch.errorMessage : undefined}
                onChange={(fv, pv) => updateInputParameter('pitch', fv, pv)}
                description="The pitch of the port grid"
            />
            <MicrometerInput
                label="Pitch Offset X"
                value={input.parameters.pitchOffsetX.fieldValue}
                error={input.parameters.pitchOffsetX.error ? input.parameters.pitchOffsetX.errorMessage : undefined}
                onChange={(fv, pv) => updateInputParameter('pitchOffsetX', fv, pv)}
                description="The pitch offset of the port grid in x direction"
            />
            <MicrometerInput
                label="Pitch Offset Y"
                value={input.parameters.pitchOffsetY.fieldValue}
                error={input.parameters.pitchOffsetY.error ? input.parameters.pitchOffsetY.errorMessage : undefined}
                onChange={(fv, pv) => updateInputParameter('pitchOffsetY', fv, pv)}
                description="The pitch offset of the port grid in y direction"
            />
            <MicrometerInput
                label="Channel Width"
                value={input.parameters.channelWidth.fieldValue}
                error={input.parameters.channelWidth.error ? input.parameters.channelWidth.errorMessage : undefined}
                onChange={(fv, pv) => updateInputParameter('channelWidth', fv, pv)}
                description="The width of channels"
            />
            <MicrometerInput
                label="Channel Spacing"
                value={input.parameters.channelSpacing.fieldValue}
                error={input.parameters.channelSpacing.error ? input.parameters.channelSpacing.errorMessage : undefined}
                onChange={(fv, pv) => updateInputParameter('channelSpacing', fv, pv)}
                description="The required spacing between channels"
            />
            <MicrometerInput
                label="Port Diameter"
                value={input.parameters.portDiameter.fieldValue}
                error={input.parameters.portDiameter.error ? input.parameters.portDiameter.errorMessage : undefined}
                onChange={(fv, pv) => updateInputParameter('portDiameter', fv, pv)}
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
                onChange={layout => updateInputParameter('layout', layout, layout)}
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


            <Box
                sx={{
                    backgroundColor: theme.vars.palette.background.surface,
                    borderRadius: theme.radius.sm,
                    border: '1px solid',
                    borderColor: theme.vars.palette.background.level2,
                    boxShadow: `0px 2px ${theme.vars.palette.background.level1}`,
                    marginY: 2
                }}>
                <ButtonGroup
                    ref={connectionDropdownRef}
                    aria-label="split button"
                    sx={{
                        margin: 2,
                        display: 'inline-flex'
                    }}
                >
                    <Box
                        sx={{
                            backgroundColor: boardEdit.state === BoardEditState.Selected ? input.connections[boardEdit.selected]?.color : input.connections[boardEdit.nextConnection]?.color
                        }}
                        onClick={() => {

                        }}><Typography sx={{
                            backgroundColor: '#0008',
                            padding: 1,
                            margin: 1,
                            cursor: 'default',
                            color: theme.vars.palette.common.white
                        }}>Connection {
                                boardEdit.state === BoardEditState.Selected ? boardEdit.selected : boardEdit.nextConnection
                            } {
                                boardEdit.state === BoardEditState.Selected ? <CheckIcon sx={{
                                    verticalAlign: 'bottom'
                                }}></CheckIcon> : <TouchAppIcon sx={{
                                    verticalAlign: 'bottom'
                                }}></TouchAppIcon>
                            }</Typography></Box>
                    {boardEdit.state === BoardEditState.Selected &&
                        <IconButton
                            variant="solid"
                            color="danger"
                            aria-label="delete connection"
                            onClick={() => {
                                deleteConnection(boardEdit.selected)
                            }}
                        >
                            <DeleteForeverIcon />
                        </IconButton>
                    }
                    <IconButton
                        variant="solid"
                        color="primary"
                        aria-controls={openConnectionDropdown ? 'split-button-menu' : undefined}
                        aria-expanded={openConnectionDropdown ? 'true' : undefined}
                        aria-label="select connection"
                        aria-haspopup="menu"
                        onClick={e => {
                            setOpenConnectionDropdown(!openConnectionDropdown)
                            e.stopPropagation()
                        }}
                    >
                        <ArrowDropDownIcon />
                    </IconButton>
                </ButtonGroup>
                <Menu
                    open={openConnectionDropdown}
                    onClose={() => setOpenConnectionDropdown(false)}
                    anchorEl={connectionDropdownRef.current}
                    sx={{
                        maxHeight: 300
                    }}
                >
                    {Object.entries(input.connections).map(([connectionId, connection]) => {
                        const color = connection.color
                        return <MenuItem
                            key={connectionId}
                            sx={{
                                backgroundColor: color
                            }}
                            onClick={_ => {
                                const cid = parseInt(connectionId)
                                if (cid !== boardEdit.nextConnection) {
                                    selectConnection(parseInt(connectionId))
                                } else {
                                    resetBoardEdit()
                                }
                            }}
                        >
                            <Typography sx={{
                                backgroundColor: '#0008',
                                padding: 1,
                                color: theme.vars.palette.common.white
                            }}>Connection {connectionId}</Typography>
                        </MenuItem>
                    })}
                </Menu>

                <Button
                    disabled={!((input.parameter_errors === undefined || input.parameter_errors.length === 0) && (input.general_errors === undefined || input.general_errors.length === 0) && (input.connection_errors === undefined || input.connection_errors.length === 0))}
                    onClick={_ => {
                        resetBoardEdit()
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

                <AddConnection
                    boardEdit={boardEdit}
                    setBoardEdit={setBoardEdit}
                    portIsFree={portIsFree}
                    portIsInRange={portIsInRange}
                    onAdd={() => { }}
                >

                </AddConnection>

                <Box
                    sx={{
                        marginX: 2,
                        marginY: 1
                    }}
                >
                    <svg
                        width="100%"
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

                            {
                                input.ports!.map(px => px.map(port => {

                                    const hasConnection = portConnectionMap[port.index[0]]?.[port.index[1]] !== undefined
                                    const connectionId = portConnectionMap[port.index[0]]?.[port.index[1]]!
                                    const connection = hasConnection ? input.connections[connectionId] : undefined

                                    const selectSecondPortStyle = boardEdit.state === BoardEditState.FirstPortSet && hasConnection ? {
                                        opacity: 0.3,
                                        cursor: 'not-allowed'
                                    } : undefined

                                    const isSelected = boardEdit.state === BoardEditState.Selected && boardEdit.selected === connectionId
                                    const highlightedStyle = (boardEdit.state === BoardEditState.FirstPortSet && boardEdit.port[0] == port.index[0] && boardEdit.port[1] === port.index[1]) ? { fill: randomColors ? boardEdit.nextConnectionColor : theme.vars.palette.primary[500], strokeDasharray: undefined } : {}

                                    const selectedStyle = isSelected ? { strokeDasharray: undefined } : {}


                                    return <Port
                                        index={port.index}
                                        position={port.position}
                                        diameter={isSelected ? 1.3 * input.parameters.portDiameter.value! : input.parameters.portDiameter.value!}
                                        style={{
                                            cursor: 'pointer',
                                            strokeDasharray: input.parameters.portDiameter.value! / 6,
                                            strokeLinecap: 'round',
                                            fill: hasConnection ? (randomColors ? connection?.color : theme.vars.palette.primary[500]) : 'transparent',
                                            ...selectSecondPortStyle,
                                            ...selectedStyle,
                                            ...highlightedStyle
                                        }}
                                        hoverStyle={hasConnection ? {} : {
                                            fill: randomColors ? boardEdit.nextConnectionColor : theme.vars.palette.primary[500],
                                            strokeDasharray: undefined
                                        }}
                                        onClick={() => {
                                            const portKey = [port.index[0], port.index[1]] as [number, number]
                                            if (portConnectionMap[port.index[0]]?.[port.index[1]] === undefined) {
                                                if (boardEdit.state === BoardEditState.Default || boardEdit.state === BoardEditState.Selected) {
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
                                                    } else if (!hasConnection && boardEdit.port[0] === port.index[0] && boardEdit.port[1] === port.index[1]) {
                                                        setBoardEdit(e => ({
                                                            state: BoardEditState.Default,
                                                            nextConnection: e.nextConnection,
                                                            nextConnectionColor: e.nextConnectionColor
                                                        }))
                                                    }
                                                }
                                            } else {
                                                selectConnection(connectionId)
                                            }
                                        }}
                                    />
                                }
                                ))
                            }
                        </>
                        }

                        {Object.entries(output.connections).map(([connectionId, points]) => {

                            const connection = input.connections[parseInt(connectionId)]

                            if (connection === undefined) {
                                console.error('Connection not found in input')
                                return <></>
                            }

                            return <Tooltip
                                title={`Length: ${computePathLength(points)} μm`}
                                open={true}
                            ><path
                                d={`M ${points.map(p => `${p[0]},${p[1]}`).join('L')}`}
                                stroke={randomColors ? connection.color : theme.vars.palette.primary[500]}
                                strokeWidth={input.parameters.channelWidth.value}
                                fill="none"
                            ></path>
                            </Tooltip>
                        })}
                    </svg>
                </Box>
            </Box>
        </main>
        <footer
            style={{
                backgroundColor: theme.vars.palette.primary[500],
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