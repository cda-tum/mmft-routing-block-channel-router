import { Button, Menu, MenuItem, Typography, useTheme } from "@mui/joy"
import { PortDisplay } from "./PortDisplay"
import { useEffect, useMemo, useRef, useState } from "react"
import { portIndexToString, PortKey } from "../utils/ports"
import { ConnectionsState, useConnectionState } from "../hooks/useConnectionState"
import { ConnectionEditor } from "./ConnectionEditor"
import { OutputConnections } from "../utils/connections"
import { ConnectionDisplay } from "./ConnectionDisplay"
import { ArrowDropDown } from "@mui/icons-material"

export function BoardDisplay(props: {
    boardWidth: number
    boardHeight: number
    channelWidth: number
    pitch: number
    pitchOffsetX: number
    pitchOffsetY: number
    portDiameter: number
    columns: number
    rows: number
    onChange?: (connections: ConnectionsState) => void
    outputConnections?: OutputConnections
    closeDropdown: boolean
}) {
    const theme = useTheme()

    const connectionState = useConnectionState({
        boundaries: {
            columns: props.columns,
            rows: props.rows
        }
    })

    useEffect(() => {
        setSelectConnectionDropdownOpen(false)
    }, [props.closeDropdown])

    useEffect(() => {
        props.onChange?.(connectionState.connections)
    }, [connectionState.connections])


    const strokeWidth = useMemo(() => props.portDiameter / 10, [props.portDiameter])
    const margin = useMemo(() => strokeWidth / 2, [strokeWidth])
    const viewBox = useMemo(() => `${-margin} ${-margin} ${props.boardWidth + 2 * margin} ${props.boardHeight + 2 * margin}`, [margin, props.boardWidth, props.boardHeight])

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

        {props.outputConnections !== undefined && Object.entries(connectionState.connections).map(([id, _connection]) => {
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
                    key={port.index[1] * props.columns + port.index[0]}
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
                margin: 1,
                marginX: 2,
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
                    color: theme.vars.palette.common.white
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
                        color: theme.vars.palette.common.white
                    }}>Connection {connectionId}</Typography>
                </MenuItem>
            })}
        </Menu>
    </>

    return <>
        {selectConnection}
        {editConnection}
        <svg
            width="100%"
            viewBox={viewBox}
        >
            {contents}
        </svg>
    </>
}

/*<IconButton
            variant="solid"
            color="primary"
            aria-controls={selectConnectionDropdownOpen ? 'split-button-menu' : undefined}
            aria-expanded={selectConnectionDropdownOpen ? 'true' : undefined}
            aria-label="select connection"
            aria-haspopup="menu"
            onClick={e => {
                setSelectConnectionDropdownOpen(!selectConnectionDropdownOpen)
                e.stopPropagation()
            }}
        >
            <ArrowDropDown />
        </IconButton>*/

