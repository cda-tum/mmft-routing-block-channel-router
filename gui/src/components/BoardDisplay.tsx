import {Box, Button, Menu, MenuItem, Modal, ModalClose, ModalDialog, Stack, Typography, useTheme} from "@mui/joy"
import { PortDisplay } from "./PortDisplay"
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react"
import { portIndexToString, PortKey } from "../utils/ports"
import { ConnectionsState, useConnectionState } from "../hooks/useConnectionState"
import { ConnectionEditor, minPorts } from "./ConnectionEditor"
import { OutputConnections } from "../utils/connections"
import { ConnectionDisplay } from "./ConnectionDisplay"
import { ArrowDropDown } from "@mui/icons-material"
import { UploadButton } from "./UploadButton"
import { readCSV } from "../utils/readCSV"
import { ChipFrame } from "./ChipFrame"
import { Rnd } from "react-rnd"
import React from "react"
import {OutsidePortDisplay} from "./OutsidePortDisplay.tsx";
import {OutsidePortPicker} from "./OutsidePortPicker.tsx";
import {OutsidePortEditor} from "./OutsidePortEditor.tsx";


export function BoardDisplay(props: {
    show: boolean
    boardWidth: number
    boardHeight: number
    channelWidth: number
    pitch: number
    pitchOffsetX: number
    pitchOffsetY: number
    portDiameter: number
    columns: number | undefined
    rows: number | undefined
    onChange?: (connections: ConnectionsState) => void
    initialInputConnections: ConnectionsState
    outputConnections?: OutputConnections
    clearOutputConnections?: () => void
    closeDropdown: boolean
    useChipFrame: string
    chipFramePadding?: number
    frameWidth: number,
    frameHeight: number

}) {
    const theme = useTheme()

    const connectionState = useConnectionState({
        boundaries: {
            columns: props.columns ?? 0,
            rows: props.rows ?? 0
        }
    })

    useEffect(() => {
        setSelectConnectionDropdownOpen(false)
    }, [props.closeDropdown])

    useEffect(() => {
        props.onChange?.(connectionState.connections)
    }, [connectionState.connections])

    useEffect(() => {
        connectionState.replaceWith(props.initialInputConnections)
    }, [props.initialInputConnections])


    const strokeWidth = useMemo(() => props.portDiameter / 3, [props.portDiameter])


    /* FRAME AND BOARD PARAMETERS (FOR DRAGGABLE ROUTING BOARD) */

    const frameEnabled = props.useChipFrame === 'WithFrame'

    const dragStageRef = useRef<HTMLDivElement>(null)
    const outerStageRef = useRef<HTMLDivElement>(null)

    const outerFrameWmm = props.frameWidth ?? 130  // mm
    const outerFrameHmm = props.frameHeight ?? 30  // mm
    const boardWmm = props.boardWidth  // mm
    const boardHmm = props.boardHeight // mm
    const framePaddingMm = props.chipFramePadding ?? 2 // mm

    const innerWmm = Math.max(1, outerFrameWmm  - 2 * framePaddingMm)
    const innerHmm = Math.max(1, outerFrameHmm - 2 * framePaddingMm)

    const [frameOuterWidthPx, setFrameOuterWidthPx] = useState(800)
    const [boardPos, setBoardPos] = useState({ x: 0, y: 0 })

    // FOR FRAME
    useLayoutEffect(() => {
        const el = outerStageRef.current
        if (!el) return
        setFrameOuterWidthPx(el.clientWidth)
    }, []);

    useEffect(() => {
        const el = outerStageRef.current
        if (!el) return
        const ro = new ResizeObserver(() => setFrameOuterWidthPx(el.clientWidth))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Conversion of mm to px
    const pxPerMM = frameOuterWidthPx / outerFrameWmm

    const paddingPx= Math.max(0, framePaddingMm * pxPerMM)

    const frameWidthPx  = frameOuterWidthPx
    const frameHeightPx = outerFrameHmm * pxPerMM

    // Board pixel size
    const boardWidthPx  = Math.max(1, boardWmm * pxPerMM)
    const boardHeightPx = Math.max(1, boardHmm * pxPerMM)

    const clamp = useCallback((x: number, y: number) => {
        const stage = dragStageRef.current
        if (!stage) return { x, y }
        const maxX = Math.max(stage.clientWidth  - boardWidthPx,  0)
        const maxY = Math.max(stage.clientHeight - boardHeightPx, 0)
        return { x: Math.min(Math.max(x, 0), maxX), y: Math.min(Math.max(y, 0), maxY) }
    }, [boardWidthPx, boardHeightPx])

    // Re-clamp when anything resizes
    useEffect(() => {
        setBoardPos(p => clamp(p.x, p.y))
    }, [clamp, frameWidthPx, frameHeightPx, boardWidthPx, boardHeightPx])



    /* OUTSIDE PORTS / MARKERS */

    // clicking layer ref and selected point (in mm)
    const clickLayerRef = useRef<HTMLDivElement>(null)

    type Marker = { id: number; xMm: number; yMm: number }

    const [markers, setMarkers] = useState<Marker[]>([])
    const nextId = useRef(1)
    const [selectedId, setSelectedId] = React.useState<number | null>(null)

    const hasMarkers = markers.length > 0
    const clearMarkers = React.useCallback(() => {
            setMarkers([])
            nextId.current = 1
        }, [])

    const markerResetButtonLabel = markers.length > 1 ? "Clear markers" : "Clear marker"

    const ordered = React.useMemo(() => {
        return [...markers].sort((a,b) => a.xMm - b.xMm || a.yMm - b.yMm);
    }, [markers]);

    const selectedIndex = React.useMemo(
        () => ordered.findIndex(m => m.id === selectedId),
        [ordered, selectedId]
    );
    const selectedMarker = selectedIndex >= 0 ? ordered[selectedIndex] : null;

    const updateMarker = (id: number, next: Partial<Pick<Marker,"xMm"|"yMm">>) =>
        setMarkers(ms => ms.map(m => (m.id === id ? { ...m, ...next } : m)))

    const deleteMarker = (id: number) => {
        setMarkers(ms => ms.filter(m => m.id !== id))
        setSelectedId(s => (s === id ? null : s))
    }

    const svgOverlayRef = React.useRef<SVGSVGElement | null>(null)

    const pickFromEvent: React.MouseEventHandler<HTMLDivElement> = (e) => {
        const svg = svgOverlayRef.current
        if (!svg) return

        // Create a point in *screen* coords (clientX/Y)
        const pt = svg.createSVGPoint()
        pt.x = e.clientX
        pt.y = e.clientY

        const ctm = svg.getScreenCTM()
        if (!ctm) return

        // Transform the point into the SVG's viewBox coordinate space
        const inv = ctm.inverse()
        const sp = pt.matrixTransform(inv)

        // Clamp to your frame viewBox (mm)
        const xMm = Math.min(Math.max(0, sp.x), innerWmm)
        const yMm = Math.min(Math.max(0, sp.y), innerHmm)

        setMarkers(prev => [...prev, { id: nextId.current++, xMm: +xMm.toFixed(2), yMm: +yMm.toFixed(2) }])
    }


    const emptyStyle = {
        strokeDasharray: props.portDiameter / 5,
        fill: 'transparent'
    }

    const takenStyle = {
        fill: theme.vars.palette.primary[500],
        strokeDasharray: undefined
    }

    const previewTakenStyle = {
        fill: theme.vars.palette.primary[300],
        strokeDasharray: undefined,
    }

    const ports =
        [...Array(props.columns).keys()].flatMap(x => [...Array(props.rows).keys()].map(y => {
            const portIndex = [x, y] as PortKey
            const portString = portIndexToString(portIndex)
            const connection = connectionState.preview.connection
            const taken = connectionState.isUsed(portIndex)
            const previewTaken = connectionState.preview.isUsed(portIndex)

            let onClick = undefined
            let style = undefined
            if (connectionState.preview.active) {
                if (taken) {
                    const portConnection = connectionState.connectionOf(portIndex)
                    if (previewTaken) {
                        if (portConnection! === connection) {
                            style = previewTakenStyle
                            // remove the port from connection again?
                        } else {
                            console.error('Unexpected case')
                        }
                    } else {
                        if (portConnection! === connection) {
                            const unfinishedPorts = connectionState.preview.unfinishedPorts()
                            if (unfinishedPorts.length > 1) {
                                onClick = () => {
                                    connectionState.preview.updatePort(unfinishedPorts[0][1], portString)
                                }
                            } else if (unfinishedPorts.length === 1) {
                                onClick = () => {
                                    connectionState.preview.updatePort(unfinishedPorts[0][1], portString)
                                    connectionState.preview.acceptPreview()
                                }
                            }
                            style = emptyStyle
                        } else {
                            style = takenStyle
                        }
                    }
                } else {
                    if (previewTaken) {
                        style = previewTakenStyle
                        // remove the port from connection again?
                    } else {
                        const unfinishedPorts = connectionState.preview.unfinishedPorts()
                        if (unfinishedPorts.length > 1) {
                            onClick = () => {
                                connectionState.preview.updatePort(unfinishedPorts[0][1], portString)
                            }
                        } else if (unfinishedPorts.length === 1) {
                            onClick = () => {
                                connectionState.preview.updatePort(unfinishedPorts[0][1], portString)
                                connectionState.preview.acceptPreview()
                            }
                        }
                        style = emptyStyle
                    }
                }
            } else {
                if (taken) {
                    onClick = () => {
                        const portConnection = connectionState.connectionOf(portIndex)!
                        connectionState.preview.loadConnection(portConnection)
                    }
                    style = takenStyle
                } else {
                    onClick = () => {
                        connectionState.preview.loadNewConnection()
                        connectionState.preview.updatePort(0, portString)
                    }
                    style = emptyStyle
                }
            }


            return {
                index: portIndex as PortKey,
                position: [props.pitchOffsetX + x * props.pitch, props.pitchOffsetY + y * props.pitch] as [number, number],
                onClick,
                style,
                clickable: onClick !== undefined
            }
        }))

    const contents = <><rect
        x={0}
        y={0}
        width={props.boardWidth}
        height={props.boardHeight}
        fill="none"
        strokeWidth={strokeWidth}
        stroke={theme.vars.palette.text.primary}
        rx={strokeWidth / 2}
    >

    </rect>
        {props.outputConnections !== undefined && Object.entries(connectionState.connections).map(([id]) => {
            const connectionId = parseFloat(id)
            if (props.outputConnections === undefined) {
                return undefined
            }
            const outputConnection = props.outputConnections?.[connectionId]
            if (outputConnection === undefined) {
                return undefined
            }
            return <ConnectionDisplay
                channelWidth={props.channelWidth}
                connection={outputConnection}
                connectionId={connectionId}
                onClick={() => {
                    connectionState.preview.loadConnection(connectionId)
                }}
            />
        })}

        {
            ports.map(port => {

                return <PortDisplay
                    key={port.index[1] * (props.columns ?? 0) + port.index[0]}
                    index={port.index}
                    position={port.position}
                    diameter={props.portDiameter}
                    onClick={port.onClick}
                    clickable={port.clickable}
                    style={port.style}
                />

            })
        }
    </>


    const boardSvg = (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${boardWmm} ${boardHmm}`}
            preserveAspectRatio="xMidYMid meet"
        >
            {contents}
        </svg>
    )

    const draggableBoard = (
        <Box ref={dragStageRef}
             sx={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", zIndex: 2, pointerEvents: "none" }}>
            <Rnd
                bounds="parent"
                position={boardPos}
                size={{ width: boardWidthPx, height: boardHeightPx }}
                onDragStart={() => clearMarkers()}
                onDragStop={(_e, d) => setBoardPos(clamp(d.x, d.y))}
                enableResizing={false}
                style={{
                    cursor: "grab",
                    pointerEvents: "auto",
                }}
            >
                <Box sx={{ width: "100%", height: "100%" }}>{boardSvg}</Box>
            </Rnd>
        </Box>
    )

    // overlay with marked outside ports
    const outsidePortsOverlay = (
        <Box sx={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
            <svg
                ref={svgOverlayRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${innerWmm} ${innerHmm}`}
                preserveAspectRatio="xMidYMid meet"
            >
                {/* debug frame: should align exactly with start of padding */}
                {/* <rect x="0" y="0" width={innerWmm} height={innerHmm}
                      fill="none" stroke="magenta" strokeWidth={0.4} /> */}
                {ordered.map((m, i) => (
                    <OutsidePortDisplay
                        key={m.id}
                        xMm={m.xMm}
                        yMm={m.yMm}
                        markerId={i + 1}
                        diameterMm={props.portDiameter}
                        fontSizeMm={1.6}
                        labelSide="auto"
                        frameWmm={innerWmm}
                        frameHmm={innerHmm}
                    />
                ))}
            </svg>
        </Box>
    )

    const contentLayer = (
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
            <Box
                ref={clickLayerRef}
                onClick={pickFromEvent}
                sx={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                }}
            />
            {outsidePortsOverlay}
            {draggableBoard}
        </Box>
    )


    // Board with frame around
    const framedBoard = (
        <Box
            ref={outerStageRef}
            className="chip-frame"
            sx={{
                position: "relative",
                width: "100%",
                minHeight: 280,
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            <ChipFrame
                minPadding={paddingPx}
                frameSizePx={{width: frameWidthPx, height: frameHeightPx}}
                defaultSize={{ width: frameWidthPx, height: frameHeightPx }}
                minContentSizePx={{ width: boardWidthPx, height: boardHeightPx }}
                className="chip-frame"
                contentClassName="chip-frame-content"
            >
                <Box className="board-stage" sx={{ width:"100%", height:"100%" }}>
                    {contentLayer}
                </Box>
            </ChipFrame>
        </Box>
    )

    // unframed board for the default solution without extra chip area around the routing board
    const plainBoard = (
        <Box sx={{ width: "100%" }}>
            <Box sx={{ width: "100%", aspectRatio: `${props.boardWidth} / ${props.boardHeight}` }}>
                {boardSvg}
            </Box>
        </Box>
    )

    const editOutsidePort = <>
        {selectedMarker && (
            <OutsidePortEditor
                marker={selectedMarker}
                displayNumber={selectedIndex + 1}
                frameWmm={innerWmm}
                frameHmm={innerHmm}
                onSave={(id, next) => updateMarker(id, next)}
                onDelete={(id) => deleteMarker(id)}
            />
        )}
    </>

    const editConnection = connectionState.preview.active ? <ConnectionEditor
        connectionState={connectionState}
    /> : undefined

    const [selectConnectionDropdownOpen, setSelectConnectionDropdownOpen] = useState<boolean>(false)
    const selectConnectionDropdownRef = useRef(null);

    const selectConnection = <>
        <Button
            ref={selectConnectionDropdownRef}
            onClick={e => {
                setSelectConnectionDropdownOpen(!selectConnectionDropdownOpen)
                e.stopPropagation()
            }}
            sx={{
                marginY: 2,
            }}
        >
            <Typography sx={{ color: theme.vars.palette.common.white }}>{connectionState.preview.active &&
                <>Connection {connectionState.preview.connection}</>
            }{!connectionState.preview.active &&
                <>Select Connection</>
            }
                <ArrowDropDown sx={{ verticalAlign: 'bottom' }} />
            </Typography>
        </Button>
        <Menu
            open={selectConnectionDropdownOpen}
            onClose={() => setSelectConnectionDropdownOpen(false)}
            anchorEl={selectConnectionDropdownRef.current}
            sx={{
                maxHeight: 300
            }}
        >
            <MenuItem
                onClick={_ => {
                    connectionState.preview.loadNewConnection()
                }}
            >
                <Typography sx={{
                    color: theme.vars.palette.text.primary
                }}>New Connection</Typography>
            </MenuItem>
            {Object.entries(connectionState.connections).map(([id, _]) => {
                const connectionId = parseFloat(id)
                return <MenuItem
                    key={connectionId}
                    onClick={_ => {
                        connectionState.preview.loadConnection(connectionId)
                    }}
                >
                    <Typography sx={{
                        color: theme.vars.palette.text.primary
                    }}>Connection #{connectionId}</Typography>
                </MenuItem>
            })}
        </Menu>
    </>

    const isBlank = connectionState.numberOfConnections() === 0

    const [csvMessage, setCSVMessage] = useState<string | undefined>(undefined)

    const uploadCSV = <>
        <UploadButton
            sx={{
                marginX: 2
            }}
            label={"Load CSV"}
            onSuccess={(content) => {
                const connections = readCSV(content)
                if (typeof connections === 'string') {
                    setCSVMessage(`Error: ${connections}`)
                } else {
                    props.clearOutputConnections?.()
                    const cleanedConnections = connections.map(c => ({
                        ports: c.ports.filter(([column, row]) => props.columns !== undefined && column < props.columns && props.rows !== undefined && row < props.rows),
                        branchPort: c.branchPort
                    })).filter(c => c.ports !== undefined && c.ports.length >= minPorts)
                    connectionState.replaceWith(Object.fromEntries(cleanedConnections.map((c, i) => [i.toString(), { ports: c.ports, branchPort: c.branchPort }])))
                    setCSVMessage(`Imported ${cleanedConnections.length} connections with a total of ${cleanedConnections.reduce((acc, c) => acc + c.ports.length, 0)} ports successfully.`)
                }
            }}
        />
        {csvMessage !== undefined &&
            <Modal
                open={csvMessage !== undefined}
                onClose={() => setCSVMessage(undefined)}
            >
                <ModalDialog>
                    <Typography sx={{
                        marginRight: '2em'
                    }}>{csvMessage}</Typography>
                    <ModalClose />
                </ModalDialog>
            </Modal>
        }
    </>

    const resetMarker = <>
        <Button
        sx={{
            marginX: 2
        }}
        disabled={!hasMarkers}
        onClick={() => clearMarkers()}
        >
            {markerResetButtonLabel}
        </Button>
    </>

    const selectOutsidePort = <>
        <OutsidePortPicker
            markers={markers}
            selectedId={selectedId}
            onSelect={setSelectedId}
        />
    </>

    const controlsRow = (
        <Stack
            direction="row"
            spacing={1.5}
            justifyContent="center"
            alignItems="center"
            sx={{ mt: 1, flexWrap: "wrap", width: "100%" }}
            paddingBottom={3}
            paddingTop={2}
        >
            {selectConnection}
            {selectOutsidePort}
            {uploadCSV}
            {resetMarker}
        </Stack>
    )

    const displayContent = (
        <>
            {frameEnabled ? framedBoard : plainBoard}
            <Stack
                direction="row"
                spacing={1.5}
                justifyContent="center"   // <- centers the whole row
                alignItems="center"
                sx={{ mt: 1, flexWrap: "wrap", width: "100%" }}
                paddingBottom={2}
                paddingTop={2}
            >
                {isBlank && <Typography sx={{ mt: 1 }}>Click on ports to define connection ends, then generate the channel design in the section below.</Typography>}
                {controlsRow}
            </Stack>
            <Stack direction="column" spacing={1.5} alignItems="center">
                {editConnection}
                {editOutsidePort}
            </Stack>
        </>
    )

    const hasOutOfBoundsConnections = connectionState.hasOutOfBoundsConnections()

    const updateContent = <>
        <Typography>
            A change of parameters caused some connections/ports to be out of bounds. Click update to remove violating connections.
        </Typography>
        <Button
            color="warning"
            onClick={_ => connectionState.removeOutOfBoundsConnections()}
            sx={{
                marginY: 2
            }}
        >
            Update
        </Button>
    </>

    const content = hasOutOfBoundsConnections ? updateContent : displayContent

    return <>
        <Box
            marginY={2}
        >
            {props.show && content}
        </Box>
    </>
}

