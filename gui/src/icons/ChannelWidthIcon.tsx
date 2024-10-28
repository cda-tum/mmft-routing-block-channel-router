import { useTheme } from "@mui/joy"
import { LayoutIcon } from "./LayoutIcon"
import { arrowPath } from "./ArrowPath"

export function ChannelWidthIcon(props: {
    width?: number,
    height?: number
}) {

    const theme = useTheme()

    const arrow = arrowPath([30, 50], [70, 50])

    return <LayoutIcon
        {...props}
        objects={[{
            type: 'path',
            pathData: "M 25 5 L 25 95",
            stroke: theme.vars.palette.text.icon,
            width: 5
        }, {
            type: 'path',
            pathData: "M 50 5 L 50 95",
            stroke: theme.vars.palette.text.icon,
            width: 50,
            opacity: 0.3
        }, {
            type: 'path',
            pathData: "M 75 5 L 75 95",
            stroke: theme.vars.palette.text.icon,
            width: 5
        }, {
            type: 'path',
            pathData: arrow.line,
            stroke: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: arrow.arrows[0],
            fill: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: arrow.arrows[1],
            fill: theme.vars.palette.primary[500],
            width: 5
        }]}
    />
}