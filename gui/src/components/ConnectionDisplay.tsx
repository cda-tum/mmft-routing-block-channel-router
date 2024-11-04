import { Tooltip, useTheme } from "@mui/joy"
import { Channel, computePathLength, ConnectionID, OutputConnection } from "../utils/connections"
import { useState } from "react"

export function ConnectionDisplay(props: {
    channelWidth: number
    connection: OutputConnection
    connectionId: ConnectionID
    onClick?: () => void
}) {
    const channels = props.connection

    return <>
        {channels.map(c => <ChannelDisplay
            channelWidth={props.channelWidth}
            connectionId={props.connectionId}
            channel={c}
            onClick={props.onClick}
        />)}
    </>
}

export function ChannelDisplay(props: {
    channelWidth: number
    channel: Channel
    connectionId: ConnectionID
    onClick?: () => void
}) {
    const theme = useTheme()
    const points = props.channel

    const [hover, setHover] = useState<boolean>(false)
    return <Tooltip
        title={`Length: ${computePathLength(points)} μm`}
        open={hover}
    ><path
        d={`M ${points.map(p => `${p[0]},${p[1]}`).join('L')}`}
        stroke={theme.vars.palette.primary[500]}
        strokeWidth={props.channelWidth}
        fill="none"
        style={{ cursor: 'pointer' }}
        onClick={() => props.onClick?.()}
        onPointerEnter={_ => {
            setHover(true)
        }}
        onPointerLeave={_ => {
            setHover(false)
        }}
    ></path>
    </Tooltip>
}