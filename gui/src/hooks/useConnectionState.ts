import { useState } from "react"
import { ConnectionID } from "../utils/connections"
import { PortKey } from "../utils/ports"

export type PortConnectionMap = Record<number, undefined | Record<number, ConnectionID | undefined>>



export function useConnectionState(props?: {
    portConnectionMap?: PortConnectionMap
}) {
    const [portConnectionMap, setPortConnectionMap] = useState<PortConnectionMap>(props?.portConnectionMap ?? {})

    return {
        isUsed: (port: PortKey) => portConnectionMap[port[0]]?.[port[1]] !== undefined,
        connection: (port: PortKey) => portConnectionMap[port[0]]?.[port[1]],
        addConnectionPort: (port: PortKey, connection: ConnectionID) => setPortConnectionMap(m => ({
            ...m,
            [port[0]]: {
                ...m[port[0]],
                [port[1]]: connection
            }
        }))
    }
}