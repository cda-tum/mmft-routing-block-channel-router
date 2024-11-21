import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"
import { arrowPath } from "./ArrowPath"

export function ChannelCapCustomIcon(props: {
    width?: number,
    height?: number
}) {

    const theme = useTheme()

    const arrow = arrowPath([55, 50], [85, 50])

    return <BaseIcon
        {...props}
        objects={[{
            type: 'path',
            pathData: "M 50 30 L 50 70",
            stroke: theme.vars.palette.text.icon,
            strokeDashArray: '3',
            width: 3
        }, {
            type: 'object',
            object: <circle 
                cx={50}
                cy={50}
                r={30}
                style={{
                    stroke: theme.vars.palette.text.icon,
                    fill: 'none',
                    strokeWidth: 3
                }}
            />
        }, {
            type: 'path',
            pathData: "M 5 30 L 90 30 L 90 70 L 5 70",
            stroke: theme.vars.palette.primary[500],
            width: 3
        }, {
            type: 'object',
            object: <circle 
                cx={50}
                cy={50}
                r={3}
                style={{
                    fill: theme.vars.palette.text.icon,
                    strokeWidth: 3
                }}
            />
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