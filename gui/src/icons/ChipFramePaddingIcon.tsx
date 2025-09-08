import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"

export function ChipFramePaddingIcon(props: {
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

            // Padding arrow (horizontal) between inner right edge (x=72) and outer right edge (x=92)
            // Arrow shaft
            {
                type: 'path',
                pathData: 'M 76 50 L 88 50',
                stroke: theme.vars.palette.primary[500],
                width: 5,
            },
            // Arrowhead at inner edge (points LEFT toward x=72)
            {
                type: 'path',
                pathData: 'M 72 50 L 76 47 L 76 53 Z',
                fill: theme.vars.palette.primary[500],
                width: 5,
            },
            // Arrowhead at outer edge (points RIGHT toward x=92)
            {
                type: 'path',
                pathData: 'M 92 50 L 88 47 L 88 53 Z',
                fill: theme.vars.palette.primary[500],
                width: 5,
            },
        ]}
    />
}