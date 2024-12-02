import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"
import { arrowPath } from "./ArrowPath"

export function ChannelSpacingIcon(props: {
    width?: number,
    height?: number
}) {

    const theme = useTheme()

    const arrow = arrowPath([27.5, 50], [72.5, 50])

    return <BaseIcon
        {...props}
        objects={[{
            type: 'path',
            pathData: "M 5 5 L 5 95",
            stroke: theme.vars.palette.text.icon,
            width: 3
        }, {
            type: 'path',
            pathData: "M 15 5 L 15 95",
            stroke: theme.vars.palette.text.icon,
            width: 20,
            opacity: 0.3
        }, {
            type: 'path',
            pathData: "M 25 5 L 25 95",
            stroke: theme.vars.palette.text.icon,
            width: 3
        }, {
            type: 'path',
            pathData: "M 95 5 L 95 95",
            stroke: theme.vars.palette.text.icon,
            width: 3
        }, {
            type: 'path',
            pathData: "M 85 5 L 85 95",
            stroke: theme.vars.palette.text.icon,
            width: 20,
            opacity: 0.3
        }, {
            type: 'path',
            pathData: "M 75 5 L 75 95",
            stroke: theme.vars.palette.text.icon,
            width: 3
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