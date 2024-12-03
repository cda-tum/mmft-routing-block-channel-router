import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"
import { arrowPath } from "./ArrowPath"

export function PortDiameterIcon(props: {
    width?: number | string,
    height?: number | string,
    maxWidth?: number | string
}) {

    const theme = useTheme()

    const arrow = arrowPath([25, 25], [75, 75])

    return <BaseIcon
        {...props}
        objects={[{
            type: 'object',
            object: <circle 
                cx={50}
                cy={50}
                r={40}
                style={{
                    stroke: theme.vars.palette.text.icon,
                    fill: 'none',
                    strokeWidth: 5
                }}
            />
        },
        
        {
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