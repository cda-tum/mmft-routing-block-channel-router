import { Tooltip, useTheme } from "@mui/joy"
import { Channel, computePathLength, computePathResistance, ConnectionID, OutputConnection } from "../utils/connections"
import { useState } from "react"

export function ConnectionDisplay(props: {
    channelWidth: number
    channelHeight: number
    connection: OutputConnection
    connectionId: ConnectionID
    onClick?: () => void
}) {
    const channels = props.connection

    return <>
        {channels.map(c => <ChannelDisplay
            channelWidth={props.channelWidth}
            channelHeight={props.channelHeight}
            connectionId={props.connectionId}
            channel={c}
            onClick={props.onClick}
        />)}
    </>
}

export function ChannelDisplay(props: {
    channelWidth: number
    channelHeight: number
    channel: Channel
    connectionId: ConnectionID
    onClick?: () => void
}) {
    const theme = useTheme()
    const points = props.channel

    const toSuperscript = (n: number): string => {
        const superscripts: Record<string, string> = {
            '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
            '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻'
        };
        return String(n).split('').map(c => superscripts[c]).join('');
    };

    const formatResistance = (r: number): string => {
        const [mantissa, exponent] = r.toExponential(2).split('e');
        return `${mantissa} × 10${toSuperscript(parseInt(exponent))} Pa·s/m³`;
    };

    const formatResistanceConverted = (r: number): string => {
        const practical = r * 1.667e-13;
        const formatted = practical < 0.01 || practical > 9999
            ? practical.toExponential(2)
            : practical.toFixed(3);
        return `${formatted} mbar/(µL/min)`;
    };

    const resistance = computePathResistance(points, props.channelWidth, props.channelHeight)

    const [hover, setHover] = useState<boolean>(false)
    return <Tooltip
        title={
            <>
                Length: {computePathLength(points).toFixed(3)} mm <br />
                Resistance: {formatResistance(resistance)} = {formatResistanceConverted(resistance)}
            </>
        }
        open={hover}
    ><path
        d={`M ${points.map(p => `${p[0]},${p[1]}`).join('L')}`}
        stroke={theme.vars.palette.primary[500]}
        strokeWidth={props.channelWidth}
        fill="none"
        style={{ cursor: 'pointer', strokeLinecap: 'butt' }}
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