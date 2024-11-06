import { Tooltip, useTheme } from "@mui/joy"
import { useState } from "react"
import { portIndexToString } from "../utils/ports"

export function PortDisplay(props: {
    index: [number, number]
    position: [number, number]
    diameter: number
    clickable: boolean
    style?: React.CSSProperties
    onClick?: () => void
}) {
    const [hover, setHover] = useState<boolean>(false)
    const theme = useTheme()

    // Style when port can be clicked
    const baseStyle: React.CSSProperties = {
        strokeLinejoin: 'round',
        strokeLinecap: 'round'
    }

    // Style when port can be clicked
    const selectableStyle: React.CSSProperties = {
        
    }

    // Style when port cannot be clicked
    const notSelectableStyle: React.CSSProperties = {
        cursor: 'not-allowed',
        opacity: 0.5
    }

    // Style when port is hovered
    const hoveredStyle: React.CSSProperties = {
        strokeDasharray: undefined,
        fill: theme.vars.palette.primary[300],
        cursor: 'pointer'
    }

    return <Tooltip
        title={portIndexToString(props.index)}
        open={hover}
    ><circle
        cx={props.position[0]}
        cy={props.position[1]}
        r={props.diameter / 2}
        style={{
            stroke: theme.vars.palette.text.tertiary,
            strokeWidth: props.diameter / 10,
            ...baseStyle,
            ...(props.style ?? {}),
            ...(hover ? hoveredStyle : {}),
            ...(props.clickable ? selectableStyle : notSelectableStyle),
        }}
        onClick={_ => {
            if(props.clickable) {
                props.onClick?.()
            }
        }}
        onPointerEnter={_ => {
            setHover(true)
        }}
        onPointerLeave={_ => {
            setHover(false)
        }}
    >

        </circle>

    </Tooltip>
}