import { useTheme } from "@mui/joy"
import { Port } from "./Port"
import { useMemo } from "react"
import { PortKey } from "../utils/ports"
import { useConnectionState } from "../hooks/useConnectionState"

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
    onClickPort: (port: PortKey) => void
}) {
    const theme = useTheme()

    const connectionState = useConnectionState()

    const strokeWidth = useMemo(() => props.portDiameter / 10, [props.portDiameter])
    const margin = useMemo(() => strokeWidth / 2, [strokeWidth])
    const viewBox = useMemo(() => `${-margin} ${-margin} ${props.boardWidth + 2 * margin} ${props.boardHeight + 2 * margin}`, [margin, props.boardWidth, props.boardHeight])

    const ports = useMemo(() =>
        [...Array(props.columns).keys()].flatMap(x => [...Array(props.rows).keys()].map(y => {
            return {
                index: [x, y] as PortKey,
                position: [props.pitchOffsetX + x * props.pitch, props.pitchOffsetY + y * props.pitch] as [number, number],
                onClick: () => {
                    props.onClickPort([x, y])
                },
                selectable: true
            }
        })), [props.columns, props.rows, props.pitchOffsetX, props.pitchOffsetY, props.pitch, props.onClickPort])

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
            ports.map(port => <Port
                key={port.index[1] * props.columns + port.index[0]}
                index={port.index}
                position={port.position}
                diameter={props.portDiameter}
                onClick={port.onClick}
                selectable={port.selectable}
            >

            </Port>)
        }
    </>

    return <svg
        width="100%"
        viewBox={viewBox}
    >
        {contents}
    </svg>
}