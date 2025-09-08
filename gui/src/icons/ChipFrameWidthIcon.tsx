import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"

export function ChipFrameWidthIcon(props: {
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
            // Horizontal arrow shaft (frame width)
            {
                type: 'path',
                pathData: 'M 12 50 L 88 50',
                stroke: theme.vars.palette.primary[500],
                width: 5,
            },
            // Arrowhead (left, pointing left)
            {
                type: 'path',
                pathData: 'M 8 50 L 13 47 L 13 53 Z',
                fill: theme.vars.palette.primary[500],
                width: 5,
            },
            // Arrowhead (right, pointing right)
            {
                type: 'path',
                pathData: 'M 92 50 L 87 47 L 87 53 Z',
                fill: theme.vars.palette.primary[500],
                width: 5,
            },
        ]}
    />


}