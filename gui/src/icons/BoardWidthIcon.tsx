import { useTheme } from "@mui/joy"
import { LayoutIcon } from "./LayoutIcon"

export function BoardWidthIcon(props: {
    width?: number,
    height?: number
}) {

    const theme = useTheme()

    return <LayoutIcon
        {...props}
        objects={[{
            type: 'path',
            pathData: "M 5 20 L 95 20 L 95 80 L 5 80 Z",
            stroke: theme.vars.palette.text.icon,
            width: 5
        }, {
            type: 'path',
            pathData: "M 7.5 50 L 92.5 50",
            stroke: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 7.5 50 L 15 45 L 15 55 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 92.5 50 L 85 45 L 85 55 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }]}
    />
}