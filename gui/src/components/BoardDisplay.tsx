import {Box, Button, Menu, MenuItem, Modal, ModalClose, ModalDialog, Stack, Typography, useTheme} from "@mui/joy"
import { PortDisplay } from "./PortDisplay"
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react"
import { portIndexToString, PortKey } from "../utils/ports"
import {ConnectionsState, ConnectionStateConnection, useConnectionState} from "../hooks/useConnectionState"
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
import {OutsidePort, OutsidePortEditor, OutsidePortProps, SaveResult} from "./OutsidePortEditor.tsx";
import {GridConfig, snapToGrid} from "../utils/portGrid.ts";
import {OutsideConnectionsState, useOutsideConnections} from "../hooks/useOutsideConnections.ts";

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
    onOutsideConnectionsChange?: (outside: ConnectionsState) => void;
    onCombinedChange?: (content: {
        connections: ConnectionsState;
        outsideConnections: ConnectionsState;
    }) => void;
    initialInputConnections: ConnectionsState
    outputConnections?: OutputConnections
    clearOutputConnections?: () => void
    closeDropdown: boolean
    useChipFrame: string
    frameWidth: number,
    frameHeight: number,
    onGapsChange?: (gaps: { topMm: number, bottomMm: number, rightMm: number, leftMm: number }) => void
}) {
    const theme = useTheme()

    const connectionState = useConnectionState({
        boundaries: {
            columns: props.columns ?? 0,
            rows: props.rows ?? 0
        }
    })

    const outsideConnectionState = useOutsideConnections({
        boundaries: {
            rows: props.rows!,
            columns: props.columns!
        }
    })

    function outsideConnectionsToConnectionsState(oc: OutsideConnectionsState): ConnectionsState {
        const out: ConnectionsState = {}
        for (const c of Object.values(oc)) {

            if (!c.outsideRowColumn) continue

            const outsidePk: PortKey = [c.outsideRowColumn.col, c.outsideRowColumn.row]
            const insidePk: PortKey = c.inside.port

            const conn: ConnectionStateConnection = {
                ports: [outsidePk, insidePk],
                branchPort: undefined,
            };
            out[c.id] = conn
        }
        return out
    }

    useEffect(() => {
        setSelectConnectionDropdownOpen(false)
    }, [props.closeDropdown])

    const outsideCS = React.useMemo(
        () => outsideConnectionsToConnectionsState(outsideConnectionState.connections),
        [outsideConnectionState.connections]
    );

    // To improve performance --> Otherwise, the dragging becomes very choppy and slow
    // Update connections only when something actually changed
    function fingerprintConnections(cs: ConnectionsState): string {
        const rows = Object.entries(cs).map(([id, c]) => {
            const ports = c.ports.map(([x, y]) => `${x}:${y}`).join("|");
            const branch = c.branchPort ? `${c.branchPort[0]}:${c.branchPort[1]}` : "-";
            return `${id}#${ports}#${branch}`;
        });
        rows.sort();
        return rows.join(",");
    }

    const insideFP  = React.useMemo(
        () => fingerprintConnections(connectionState.connections),
        [connectionState.connections]
    );
    const outsideFP = React.useMemo(
        () => fingerprintConnections(outsideCS),
        [outsideCS]
    );

    const last = React.useRef<{ inside: string; outside: string }>({ inside: "", outside: "" });

    React.useEffect(() => {
        const insideChanged  = insideFP  !== last.current.inside;
        const outsideChanged = outsideFP !== last.current.outside;

        if (insideChanged) {
            props.onChange?.(connectionState.connections);
        }
        if (outsideChanged) {
            props.onOutsideConnectionsChange?.(outsideCS);
        }
        if (insideChanged || outsideChanged) {
            props.onCombinedChange?.({
                connections: connectionState.connections,
                outsideConnections: outsideCS,
            });
            last.current = { inside: insideFP, outside: outsideFP };
        }
    }, [
        insideFP,
        outsideFP,
        props.onChange,
        props.onOutsideConnectionsChange,
        props.onCombinedChange,
    ]);

    useEffect(() => {
        connectionState.replaceWith(props.initialInputConnections)
    }, [props.initialInputConnections])

    const strokeWidth = useMemo(() => props.portDiameter / 3, [props.portDiameter])


    /* FRAME AND BOARD PARAMETERS (FOR DRAGGABLE ROUTING BOARD) */

    const frameEnabled = props.useChipFrame === 'WithFrame'

    const clickLayerRef = useRef<HTMLDivElement>(null)

    const frameWidthMm = props.frameWidth ?? 130  // mm
    const frameHeightMm = props.frameHeight ?? 30  // mm
    const boardWmm = props.boardWidth  // mm
    const boardHmm = props.boardHeight // mm

    const [boardPos, setBoardPos] = useState({ x: 0, y: 0 })

    const [contentSize, setContentSize] = useState({ w: 800, h: 400 });

    useLayoutEffect(() => {
        const el = clickLayerRef.current;
        if (!el) return;
        const update = () => setContentSize({ w: el.clientWidth, h: el.clientHeight });
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const pxPerMM = contentSize.w / frameWidthMm;

    const boardWidthPx  = props.boardWidth  * pxPerMM;
    const boardHeightPx = props.boardHeight * pxPerMM;

    const clamp = useCallback((x:number, y:number) => {
        const maxX = Math.max(0, contentSize.w - boardWidthPx);
        const maxY = Math.max(0, contentSize.h - boardHeightPx);
        return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
    }, [contentSize, boardWidthPx, boardHeightPx]);

    interface GapsMm {
        leftMm: number;
        topMm: number;
        rightMm: number;
        bottomMm: number;
    }

    const computeGaps = (pos: { x: number; y: number }): GapsMm => {
        const leftMm   = pos.x / pxPerMM;
        const topMm    = pos.y / pxPerMM;
        const rightMm  = frameWidthMm - leftMm - boardWmm;
        const bottomMm = frameHeightMm - topMm  - boardHmm;
        return { leftMm, topMm, rightMm, bottomMm };
    };
    

    /* OUTSIDE PORTS / MARKERS */

    const [markers, setMarkers] = React.useState<OutsidePort[]>([]);
    const nextId = useRef(1)
    const [selectedId, setSelectedId] = React.useState<number | null>(null)

    const hasMarkers = markers.length > 0
    const clearMarkers = React.useCallback(() => {
            setMarkers([])
            nextId.current = 1
            outsideConnectionState.clear();
        }, [])

    const markerResetButtonLabel = markers.length > 1 ? "Clear Outside Ports" : "Clear Outside Port"

    const orderedMarkers = React.useMemo(() => {
        return markers
    }, [markers]);

    const selectedIndex = React.useMemo(
        () => orderedMarkers.findIndex(m => m.id === selectedId),
        [orderedMarkers, selectedId]
    );
    const selectedMarker = selectedIndex >= 0 ? orderedMarkers[selectedIndex] : null;

    const originX = computeGaps({ x: boardPos.x, y: boardPos.y }).leftMm + props.pitchOffsetX // position of the first top-left port on the board
    const originY = computeGaps({ x: boardPos.x, y: boardPos.y }).topMm + props.pitchOffsetY

    const grid: GridConfig = {
        originMm: { x: originX, y: originY},
        pitchMm:  { x: props.pitch, y: props.pitch},
    };

    const svgOverlayRef = React.useRef<SVGSVGElement | null>(null)

    const createOutsidePortMarker: React.MouseEventHandler<HTMLDivElement> = (e) => {
        const svg = svgOverlayRef.current;
        if (!svg) return;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const ctm = svg.getScreenCTM(); if (!ctm) return;
        const sp = pt.matrixTransform(ctm.inverse());

        const id = nextId.current++;
        const snapped = snapToGrid(sp.x, sp.y, grid, { width: frameWidthMm, height: frameHeightMm });
        if (!snapped) return;

        setMarkers(ms => [...ms, { id, xMm: +snapped.x.toFixed(2), yMm: +snapped.y.toFixed(2), port: "" }]);
        setSelectedId(id);
    };


    const handleEditorSave = (id: number, next: OutsidePortProps): SaveResult => {
        const gaps = computeGaps({ x: boardPos.x, y: boardPos.y });
        const rowColumn = outsideMmToRowColumn({
            xMm: next.xMm,
            yMm: next.yMm,
            gaps,
            pitchMm: props.pitch,
            pitchOffsetXmm: props.pitchOffsetX,
            pitchOffsetYmm: props.pitchOffsetY,
        });

        console.log(rowColumn);

        const res = outsideConnectionState.upsertFromEditor({ id, xMm: next.xMm, yMm: next.yMm }, next.port, rowColumn);
        if (!res.ok) return res;

        setMarkers(ms =>
            ms.map(m => (m.id === id ? { ...m, xMm: next.xMm, yMm: next.yMm, port: next.port } : m))
        );
        return { ok: true, connectionId: res.connectionId };
    };


    const handleEditorDelete = (id: number) => {
        setMarkers(ms => ms.filter(m => m.id !== id));
        outsideConnectionState.removeByMarker(id);
        if (selectedId === id) setSelectedId(null);
    };

    function outsideMmToRowColumn(params: {
        xMm: number;
        yMm: number;
        gaps: GapsMm;
        pitchMm: number;
        pitchOffsetXmm: number;
        pitchOffsetYmm: number;
    }) {
        const {
            xMm, yMm, gaps, pitchMm, pitchOffsetXmm, pitchOffsetYmm
        } = params;

        const originX = gaps.leftMm + pitchOffsetXmm;
        const originY = gaps.topMm + pitchOffsetYmm;

        const fx = Math.round((xMm - originX) / pitchMm);
        const fy = Math.round((yMm - originY) / pitchMm);

        return {col: fx, row: fy}
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

        {props.outputConnections &&
            Object.entries(props.outputConnections).map(([id, outputConnection]) => {
                const connectionId = Number(id);
                return (
                    <ConnectionDisplay
                        key={connectionId}
                        channelWidth={props.channelWidth}
                        connection={outputConnection}
                        connectionId={connectionId}
                        onClick={() => connectionState.preview.loadConnection(connectionId)}
                    />
                );
            })}
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
        <Box sx={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none" }}>
            <Rnd
                bounds="parent"
                position={boardPos}
                size={{ width: boardWidthPx, height: boardHeightPx }}
                onDragStart={() => {
                    clearMarkers();
                    props.clearOutputConnections?.();
                }}
                onDragStop={(_e, d) => {
                    const newPos = clamp(d.x, d.y)
                    setBoardPos(newPos)

                    // compute gaps
                    const gaps = computeGaps(newPos)

                    // forward them to BoardUI
                    props.onGapsChange?.(gaps)
                }}
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


    // CHANNELS OVERLAY TO VISUALIZE RESULTING CHANNELS (moved from initial place after the ports)

    const { leftMm, topMm } = computeGaps({ x: boardPos.x, y: boardPos.y });

    const channelsOverlay = (
        <Box sx={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none' }}>
            {props.outputConnections && (
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${frameWidthMm} ${frameHeightMm}`}
                    preserveAspectRatio="xMidYMid meet"
                >
                    <g transform={`translate(${leftMm} ${topMm})`}>
                        {Object.entries(props.outputConnections).map(([id, conn]) => (
                            <ConnectionDisplay
                                key={id}
                                channelWidth={props.channelWidth}
                                connection={conn}
                                connectionId={+id}
                            />
                        ))}
                    </g>
                </svg>
            )}
        </Box>
    );


    // overlay with marked outside ports
    const outsidePortsOverlay = (
        <Box sx={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
            <svg
                ref={svgOverlayRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${frameWidthMm} ${frameHeightMm}`}
                preserveAspectRatio="xMidYMid meet"
            >
                {/* debug frame */}
                {/* <rect x="0" y="0" width={frameWidthMm} height={frameHeightMm}
                      fill="none" stroke="magenta" strokeWidth={0.4} /> */}
                {orderedMarkers.map((m, i) => (
                    <OutsidePortDisplay
                        key={m.id}
                        xMm={m.xMm}
                        yMm={m.yMm}
                        markerId={i + 1}
                        diameterMm={props.portDiameter}
                        fontSizeMm={1.6}
                        labelSide="auto"
                        frameWmm={frameWidthMm}
                        frameHmm={frameHeightMm}
                        onClick={(e) => {
                            e?.stopPropagation();
                            setSelectedId(m.id);  // open/switch editor
                        }}
                    />
                ))}
            </svg>
        </Box>
    )

    // framedBoard: mount content directly
    const framedBoard = (
        <Box className="chip-frame" sx={{ position: "relative", width: "100%" }}>
            <ChipFrame
                className="chip-frame"
                contentClassName="chip-frame-content"
            >
                <Box
                    ref={clickLayerRef}
                    sx={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: `${frameWidthMm} / ${frameHeightMm}`,
                        overflow: "hidden",
                        display: "block",
                    }}
                    onPointerDown={createOutsidePortMarker}
                >
                    <Box sx={{ position: "absolute", inset: 0, zIndex: 1 }}>
                        {/* gridOverlay */}
                    </Box>

                    <Box sx={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
                        {channelsOverlay}
                    </Box>

                    <Box sx={{ position: "absolute", inset: 0, zIndex: 2 }}>
                        {outsidePortsOverlay}
                    </Box>

                    <Box sx={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
                        {draggableBoard}
                    </Box>
                </Box>
            </ChipFrame>
        </Box>
    );

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
                gridConfig={grid}
                innerWmm={frameWidthMm}
                innerHmm={frameHeightMm}
                onSave={(id, next) => handleEditorSave(id, next)}
                onDelete={(id) => handleEditorDelete(id)}
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
            <Typography sx={{ color: theme.vars.palette.common.white }}>
                {markerResetButtonLabel}
            </Typography>

        </Button>
    </>

    const selectOutsidePort = <>
        <OutsidePortPicker
            markers={orderedMarkers}
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
            <Stack direction="column" spacing={2.5} alignItems="center">
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

