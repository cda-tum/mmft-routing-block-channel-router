import { Button, useTheme } from "@mui/joy"
import { Port } from "./Port"
import { useCallback, useMemo, useState } from "react"
import { portIndexToString, PortKey } from "../utils/ports"
import { useConnectionState } from "../hooks/useConnectionState"
import { ConnectionEditor } from "./ConnectionEditor"

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
}) {
    const theme = useTheme()

    const connectionState = useConnectionState({
        boundaries: {
            columns: props.columns,
            rows: props.rows
        }
    })

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

        {
            ports.map(port => {

                return <Port
                    key={port.index[1] * props.columns + port.index[0]}
                    index={port.index}
                    position={port.position}
                    diameter={props.portDiameter}
                    onClick={port.onClick}
                    clickable={port.clickable}
                    style={port.style}
                >

                </Port>
            })
        }
    </>

    const editConnection = connectionState.preview.active ? <ConnectionEditor
        connectionState={connectionState}
    /> : <Button
        onClick={_ => {
            connectionState.preview.loadNewConnection()
        }}
    >New Connection</Button>

    return <>
        {editConnection}
        <svg
            width="100%"
            viewBox={viewBox}
        >
            {contents}
        </svg>
    </>
}