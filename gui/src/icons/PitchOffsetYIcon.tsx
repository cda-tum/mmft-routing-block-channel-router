import { useTheme } from "@mui/joy"
import { LayoutIcon } from "./LayoutIcon"
import { arrowPath } from "./ArrowPath"

export function PitchOffsetYIcon(props: {
    width?: number,
    height?: number
}) {

    const theme = useTheme()

    const arrow = arrowPath([50, 10], [50, 50])

    return <LayoutIcon
        {...props}
        objects={[{
            type: 'object',
            object: <circle 
                cx={50}
                cy={50}
                r={20}
                style={{
                    stroke: theme.vars.palette.text.icon,
                    fill: 'none',
                    strokeWidth: 3.5
                }}
            />
        }, {
            type: 'path',
            pathData: "M 5 95 L 5 5 L 95 5",
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