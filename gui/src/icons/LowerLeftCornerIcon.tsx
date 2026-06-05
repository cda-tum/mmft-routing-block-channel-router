import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"

export function LowerLeftCornerIcon(props: {
    width?: number | string,
    height?: number | string,
    maxWidth?: number | string
}) {

    const theme = useTheme()

    return <BaseIcon
        {...props}
        objects={[{
            // L-shape: lower-left corner of a rectangle
            type: 'path',
            pathData: "M 25 25 L 25 75 L 75 75",
            stroke: theme.vars.palette.text.icon,
            width: 5
        }, {
            // Diagonal arrow shaft, pointing from upper-right toward the corner
            type: 'path',
            pathData: "M 70 30 L 31 69",
            stroke: theme.vars.palette.primary[500],
            width: 5
        }, {
            // Arrowhead at (31, 69), pointing toward (25, 75)
            type: 'path',
            pathData: "M 31 69 L 40 66 L 34 60 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }, {
            // Blue dot on the corner itself
            type: 'path',
            pathData: "M 21 75 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }]}
    />
}