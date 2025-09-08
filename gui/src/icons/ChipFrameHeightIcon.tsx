import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"

export function ChipFrameHeightIcon(props: {
    width?: number | string,
    height?: number | string,
    maxWidth?: number | string
}) {

    const theme = useTheme()

    return <BaseIcon
        {...props}
        objects={[
            // Outer frame
            {
                type: 'path',
                pathData: 'M 8 15 L 92 15 L 92 85 L 8 85 Z',
                stroke: theme.vars.palette.text.icon,
                fill: 'none',
                width: 5,
            },
            // Inner board (smaller, centered)
            {
                type: 'path',
                pathData: 'M 28 35 L 72 35 L 72 65 L 28 65 Z',
                stroke: theme.vars.palette.text.icon,
                fill: 'none',
                width: 5,
            },
            // Vertical arrow shaft (frame height)
            {
                type: 'path',
                pathData: 'M 50 20 L 50 80',
                stroke: theme.vars.palette.primary[500],
                width: 5,
            },
            // Arrowhead (top, pointing up)
            {
                type: 'path',
                pathData: 'M 50 15 L 47 20 L 53 20 Z',
                fill: theme.vars.palette.primary[500],
                width: 5,
            },
            // Arrowhead (bottom, pointing down)
            {
                type: 'path',
                pathData: 'M 50 85 L 47 80 L 53 80 Z',
                fill: theme.vars.palette.primary[500],
                width: 5,
            },
        ]}
    />

}