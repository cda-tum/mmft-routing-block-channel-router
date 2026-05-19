import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"
import { arrowPath } from "./ArrowPath"

export function ChannelHeightIcon(props: {
    width?: number | string,
    height?: number | string,
    maxWidth?: number | string
}) {

    const theme = useTheme()

    const arrow = arrowPath([50, 30], [50, 70])

    return <BaseIcon
        {...props}
        objects={[{
            type: 'path',
            pathData: "M 5 25 L 95 25",
            stroke: theme.vars.palette.text.icon,
            width: 5
        }, {
            type: 'path',
            pathData: "M 5 50 L 95 50",
            stroke: theme.vars.palette.text.icon,
            width: 50,
            opacity: 0.3
        }, {
            type: 'path',
            pathData: "M 5 75 L 95 75",
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