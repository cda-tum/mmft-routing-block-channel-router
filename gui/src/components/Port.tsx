import { useTheme } from "@mui/joy"
import { useState } from "react"

export function Port(props: {
    position: [number, number]
    diameter: number
    style?: React.CSSProperties
    hoverStyle?: React.CSSProperties
    onClick?: () => void
}) {
    const [hover, setHover] = useState<boolean>(false)
    const theme = useTheme()

    return <circle
        cx={props.position[0]}
        cy={props.position[1]}
        r={props.diameter / 2}
        strokeWidth={props.diameter / 10}
        stroke={theme.vars.palette.text.primary}
        style={{
            ...(props.style ?? {}),
            ...(hover ? props.hoverStyle : {})
        }}
        onClick={_ => {
            props.onClick?.()
        }}
        onPointerEnter={_ => {
            setHover(true)
        }}
        onPointerLeave={_ => {
            setHover(false)
        }}
    >

    </circle>
}