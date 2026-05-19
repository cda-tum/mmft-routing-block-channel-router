import { InputState } from "../BoardUI";
import { route as wasm_route } from '../../../pkg/mmft_board_router';
import { Channel, ConnectionID, OutputConnections } from "./connections";
import { ExclusionZoneState } from "./exclusions";


function connections(resultConnections: [number, Channel[]][]) {
    const connections: OutputConnections = {}
    resultConnections.forEach(([connection_id, connection_channels]: [ConnectionID, Channel[]]) => {
        connections[connection_id] = connection_channels
    });
    return connections
}

export function route(input: InputState, exclusionZones: ExclusionZoneState) {
    try {
        const args = {
            channel_width: input.parameters.channelWidth.value,
            channel_height: input.parameters.channelHeight.value,
            channel_spacing: input.parameters.channelSpacing.value,
            board_width: input.parameters.boardWidth.value,
            board_height: input.parameters.boardHeight.value,
            pitch: input.parameters.pitch.value,
            pitch_offset_x: input.parameters.pitchOffsetX.value,
            pitch_offset_y: input.parameters.pitchOffsetY.value,
            port_diameter: input.parameters.portDiameter.value,
            max_ports: input.parameters.maxPorts.value,
            connections: Object.entries(input.connections).filter(([_, connection]) => connection.ports.length > 1).map(([c_id, connection]) => ({
                id: parseInt(c_id),
                ports: connection.ports,
                branch_port: connection.branchPort
            })),
            exclusion_zones: Object.values(exclusionZones),
            min_grid_size: 0,
            layout: input.parameters.layout.value,
        }

        console.time('timing')
        const result = wasm_route(args)
        console.timeEnd('timing')

        if ('Ok' in result) {
            return { connections: connections(result['Ok']['connections']), connectionsRaw: result['Ok']['connections'], error: undefined, is_partial: false }
        } else if ('Err' in result) {
            const error = result['Err']
            let error_message = undefined
            if (typeof error === 'string') {
                if (error === 'NoInputConnections') {
                    error_message = 'No routing targets supplied.'
                } else if (error === 'NoConnectionsFound') {
                    error_message = 'No solution has been found.'
                } else {
                    error_message = 'Unexpected error'
                    console.error('Unexpected error')
                }
            } else if (typeof error === 'object') {
                if ('PartialResult' in error) {
                    return { connections: connections(result['Err']['PartialResult']['connections']), connectionsRaw: result['Err']['PartialResult']['connections'], error: 'A partial solution has been found.', is_partial: true }
                } else if ('ExclusionZoneBlocked' in error) {
                    const { board, blocked_connection_ids } = error['ExclusionZoneBlocked'] as { board: { connections: [number, Channel[]][] }, blocked_connection_ids: number[] }
                    const ids = blocked_connection_ids.map(id => `#${id}`).join(', ')
                    return { connections: connections(board.connections), connectionsRaw: board.connections, error: `Connection(s) ${ids} could not be routed due to an exclusion zone.`, is_partial: true }
                } else {
                    error_message = 'Unexpected error'
                    console.error('Unexpected error')
                }
            } else {
                error_message = 'Unexpected error'
                console.error('Unexpected error')
            }
            return { connections: {}, connectionsRaw: [], error: error_message, is_partial: false }
        } else {
            throw 'Unexpected result'
        }
    } catch (e) {
        console.error('An unknown error occurred during execution', e)
        return { connections: {}, connectionsRaw: [], error: "An unknown error occurred during execution.", is_partial: false }
    }
}