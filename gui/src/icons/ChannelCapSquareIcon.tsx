import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"

export function ChannelCapSquareIcon(props: {
    width?: number | string,
    height?: number | string,
    maxWidth?: number | string
}) {

    const theme = useTheme()

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
                    strokeWidth: 3
                }}
            />
        }, {
            type: 'path',
            pathData: "M 5 30 L 70 30 L 70 70 L 5 70",
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
        }]}
    />
}