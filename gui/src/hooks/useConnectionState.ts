import { useState } from "react"
import { ConnectionID } from "../utils/connections"
import { portIndexToString, PortKey, portStringToIndex } from "../utils/ports"

export type PortConnectionMap = Record<number, undefined | Record<number, ConnectionID | undefined>>
export type ConnectionsState = Record<ConnectionID, {
    ports: PortKey[]
}>

export const ERROR_MESSAGES = {
    MISSING: 'Missing port identifier',
    INVALID_PORT: 'Invalid port identifier',
    OUT_OF_BOUNDS: 'Out of bounds',
    DUPLICATE_PORT: 'Duplicate port',
    ALREADY_TAKEN: 'Port is taken by other connection'
}

export type PortField = {
    index: PortKey | undefined
    fieldValue: string
    error: string | undefined
}

export type ConnectionPreviewState = {
    active: boolean
    connection: ConnectionID
    ports: PortField[]
}

export type Boundaries = {
    rows: number,
    columns: number
}

export const connectionPreviewStateDefault = {
    active: false,
    connection: 0,
    ports: [],
}

export function portError(index: number, portKey: PortKey | undefined, boundaries: Boundaries, isUsedByOtherThan: (key: PortKey, connection: number) => boolean, ports: PortField[], connection: ConnectionID) {
    if (portKey == undefined) {
        return ERROR_MESSAGES.INVALID_PORT
    }

    if (portKey[0] < 0 || portKey[0] >= boundaries.columns) {
        return ERROR_MESSAGES.OUT_OF_BOUNDS
    }

    if (portKey[1] < 0 || portKey[1] >= boundaries.rows) {
        return ERROR_MESSAGES.OUT_OF_BOUNDS
    }

    const otherPorts = [...ports]
    otherPorts.splice(index, 1)
    if (otherPorts.some(p => p.index !== undefined && p.index[0] === portKey[0] && p.index[1] === portKey[1])) {
        return ERROR_MESSAGES.DUPLICATE_PORT
    }

    if (isUsedByOtherThan(portKey, connection)) {
        return ERROR_MESSAGES.ALREADY_TAKEN
    }
}

export function useConnectionState(props: {
    portConnectionMap?: PortConnectionMap
    connections?: ConnectionsState
    boundaries: Boundaries
}) {
    const [portConnectionMap, setPortConnectionMap] = useState<PortConnectionMap>(props?.portConnectionMap ?? {})
    const [connections, setConnections] = useState<ConnectionsState>(props?.connections ?? [])
    const [connectionPreviewState, setConnectionPreviewState] = useState<ConnectionPreviewState>(connectionPreviewStateDefault)

    const removeConnection = (connection: ConnectionID) => {
        connections[connection].ports.forEach(p => setPortConnectionMap(m => ({
            ...m,
            [p[0]]: {
                ...m[p[0]],
                [p[1]]: undefined
            }
        })))
        const { [connection]: removed, ...remainingConnections } = connections
        setConnections(remainingConnections)
    }

    const isValid = () => connectionPreviewState.ports.every(p => p.error === undefined)

    const isUsedByOtherThan = (port: PortKey, connection: ConnectionID) => portConnectionMap[port[0]]?.[port[1]] !== undefined && portConnectionMap[port[0]]?.[port[1]] !== connection

    const updatePortErrors = (ports: PortField[]) => {
        return ports.map((port, j) => {
            const error = portError(j, port.index, props.boundaries, isUsedByOtherThan, ports, connectionPreviewState.connection)
            return {
                ...port,
                error
            }
        })
    }

    const unfinishedPorts = () => {
        return connectionPreviewState.ports.map((port, i) => [port, i] as [PortField, number]).filter(([port, _]) => port.index === undefined)
    }

    const addOrUpdateConnection = (connection: ConnectionID, ports?: PortKey[]) => {
        if (connections[connection] !== undefined) {
            removeConnection(connection)
        }
        if (ports !== undefined) {
            ports.forEach(p => {
                setPortConnectionMap(m => ({
                    ...m,
                    [p[0]]: {
                        ...m[p[0]],
                        [p[1]]: connection
                    }
                }))
            })
        }
        setConnections(c => ({
            ...c,
            [connection]: {
                ports: ports ?? []
            }
        }))
    }
    const newConnectionId = () => {
        let i = 0
        while (connections[i] !== undefined) {
            i++
        }
        return i
    }

    const portsOf = (connection: ConnectionID) => connections[connection]?.ports

    const hasConnection = (connection: ConnectionID) => connections[connection]

    return {
        connections,
        isUsed: (port: PortKey) => portConnectionMap[port[0]]?.[port[1]] !== undefined,
        isUsedByOtherThan,
        connectionOf: (port: PortKey) => portConnectionMap[port[0]]?.[port[1]],
        portsOf,
        addConnectionPort: (port: PortKey, connection: ConnectionID) => {
            setPortConnectionMap(m => ({
                ...m,
                [port[0]]: {
                    ...m[port[0]],
                    [port[1]]: connection
                }
            }))
            setConnections(c => ({
                ...c,
                [connection]: {
                    ...c[connection],
                    ports: [...c[connection].ports, port]
                }
            }))
        },
        removeConnectionPort: (port: PortKey, connection: ConnectionID) => {
            setPortConnectionMap(m => ({
                ...m,
                [port[0]]: {
                    ...m[port[0]],
                    [port[1]]: undefined
                }
            }))

            const remainingPorts = connections[connection].ports.filter(p => p[0] !== port[0] || p[1] !== port[1])
            setConnections(c => ({
                ...c,
                [connection]: {
                    ...c[connection],
                    ports: remainingPorts
                }
            }))
        },
        removeConnection,
        addOrUpdateConnection,
        newConnectionId,
        preview: {
            isValid,
            isUsed: (key: PortKey) => connectionPreviewState.ports.some(port => port.index !== undefined && port.index[0] === key[0] && port.index[1] === key[1]),
            addPort: () => setConnectionPreviewState(s => ({
                ...s,
                ports: [...s?.ports, {
                    fieldValue: '',
                    index: undefined,
                    error: ERROR_MESSAGES.MISSING
                }]
            })),
            removePort: (i: number) => setConnectionPreviewState(s => {
                const remainingPorts = [...s.ports]
                remainingPorts.splice(i, 1)
                return {
                    ...s,
                    ports: updatePortErrors(remainingPorts)
                }
            }),
            updatePort: (i: number, fieldValue: string) => {
                const portKey = portStringToIndex(fieldValue)

                setConnectionPreviewState(s => {
                    const updatedPorts = [...s.ports]
                    updatedPorts.splice(i, 1, {
                        fieldValue,
                        index: portKey,
                        error: updatedPorts[i].error
                    })
                    return {
                        ...s,
                        ports: updatePortErrors(updatedPorts)
                    }
                })
            },
            unfinishedPorts,
            hasUnfinishedPorts: () => {
                return unfinishedPorts().length > 0
            },
            nextUnfinishedPort: () => {
                return unfinishedPorts()[0]?.[1]
            },
            loadConnection: (connection: ConnectionID) => {
                if (hasConnection(connection)) {
                    setConnectionPreviewState(s => ({
                        ...s,
                        active: true,
                        ports: portsOf(connection).map(p => ({
                            index: p,
                            fieldValue: portIndexToString(p),
                            error: undefined
                        })),
                        connection: connection
                    }))
                    return true
                }
                return false
            },
            loadNewConnection: (numPorts?: number) => {
                const connection = newConnectionId()
                setConnectionPreviewState(s => ({
                    ...s,
                    active: true,
                    ports: [...Array(numPorts ?? 2).keys()].map(_ => ({
                        fieldValue: '',
                        index: undefined,
                        error: ERROR_MESSAGES.MISSING
                    })),
                    connection: connection
                }))
            },
            acceptPreview: () => {
                setConnectionPreviewState(s => {
                    addOrUpdateConnection(s.connection, s.ports.map(p => p.index as PortKey))
                    return { ...s, active: false }
                })
            },
            setActive: (active?: boolean) => {
                setConnectionPreviewState(s => ({
                    ...s,
                    active: active ?? true
                }))
            },
            setInactive: () => {
                setConnectionPreviewState(s => ({
                    ...s,
                    active: false
                }))
            },
            active: connectionPreviewState.active,
            ports: connectionPreviewState.ports,
            connection: connectionPreviewState.connection,
        }
    }
}