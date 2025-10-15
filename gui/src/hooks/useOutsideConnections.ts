import * as React from "react";
import {portIndexToString, PortKey, portStringToIndex} from "../utils/ports";

export type Boundaries = { rows: number; columns: number };

export type OutsideEndpoint = { markerId: number; xMm: number; yMm: number };

export type OutsideConnection = {
    id: number;
    outside: OutsideEndpoint;
    inside: { port: PortKey }; // the destination port inside board
    outsideRowColumn?: { row: number; col: number };
    createdAt: number;
    updatedAt: number;
};

export type OutsideConnectionsState = Record<number, OutsideConnection>;

export type SaveResult =
    | { ok: true; connectionId: number }
    | { ok: false; error: string };

type UseOutsideConnectionsArgs = {
    boundaries: Boundaries;
    initial?: OutsideConnectionsState;
    // optional guard against collisions with existing (inside) connections
    isInsidePortFree?: (pk: PortKey) => boolean;
};

export function useOutsideConnections({
                                          initial,
                                          isInsidePortFree,
                                      }: UseOutsideConnectionsArgs) {

    const [state, setState] = React.useState<OutsideConnectionsState>(initial ?? {});
    const [byMarker, setByMarker] = React.useState<Record<number, number>>({});
    const [byPort, setByPort] = React.useState<Record<string, number>>({});
    const nextId = React.useRef(1);

    const keyOf = (pk: PortKey) => portIndexToString(pk);

    const upsertFromEditor = React.useCallback(
        (
            marker: { id: number; xMm: number; yMm: number },
            portStr: string,
            outsideRowColumn?: { row: number; col: number }
        ): SaveResult => {
            const pk = portStringToIndex(portStr);
            if (!pk) return { ok: false, error: "Invalid port format." };

            if (isInsidePortFree && !isInsidePortFree(pk)) {
                return { ok: false, error: "Port is already used by another connection." };
            }

            const k = keyOf(pk);
            const onPort = byPort[k];
            const onMarker = byMarker[marker.id];

            // If port is already taken by another outside-connection, block
            if (onPort && onPort !== onMarker) {
                return { ok: false, error: "Port already used by another outside connection." };
            }

            const now = Date.now();
            const id = onMarker ?? nextId.current++;

            const conn: OutsideConnection = {
                id,
                outside: { markerId: marker.id, xMm: marker.xMm, yMm: marker.yMm },
                inside: { port: pk },
                outsideRowColumn,
                createdAt: onMarker ? state[id].createdAt : now,
                updatedAt: now,
            };

            setState(prev => ({ ...prev, [id]: conn }));
            setByMarker(prev => ({ ...prev, [marker.id]: id }));
            setByPort(prev => ({ ...prev, [k]: id }));

            return { ok: true, connectionId: id };
        },
        [byMarker, byPort, isInsidePortFree, state]
    );

    const removeByMarker = React.useCallback((markerId: number) => {
        const id = byMarker[markerId];
        if (!id) return;
        setState(prev => {
            const copy = { ...prev };
            const portStr = copy[id] ? keyOf(copy[id].inside.port) : null;
            delete copy[id];
            if (portStr) setByPort(p => { const x = { ...p }; delete x[portStr]; return x; });
            return copy;
        });
        setByMarker(prev => { const x = { ...prev }; delete x[markerId]; return x; });
    }, [byMarker]);

    const removeById = React.useCallback((id: number) => {
        setState(prev => {
            const copy = { ...prev };
            const conn = copy[id];
            if (conn) {
                const k = keyOf(conn.inside.port);
                setByPort(p => { const x = { ...p }; delete x[k]; return x; });
                setByMarker(m => {
                    const x = { ...m };
                    if (x[conn.outside.markerId] === id) delete x[conn.outside.markerId];
                    return x;
                });
                delete copy[id];
            }
            return copy;
        });
    }, []);

    const findByMarker = React.useCallback(
        (markerId: number) => {
            const id = byMarker[markerId];
            return id ? state[id] : null;
        },
        [byMarker, state]
    );

    const findByPort = React.useCallback(
        (pk: PortKey) => {
            const id = byPort[keyOf(pk)];
            return id ? state[id] : null;
        },
        [byPort, state]
    );

    const clear = React.useCallback(() => {
        setState({});
        setByMarker({});
        setByPort({});
        nextId.current = 1;
    }, []);

    return {
        connections: state,
        upsertFromEditor,
        removeByMarker,
        removeById,
        findByMarker,
        findByPort,
        clear,
        byMarker,
        byPort,
    };
}
