import { useTheme } from "@mui/joy"
import { LayoutIcon } from "./LayoutIcon"

export function PitchIcon(props: {
    width?: number,
    height?: number
}) {

    const theme = useTheme()

    return <LayoutIcon
        {...props}
        objects={[{
            type: 'object',
            object: <circle 
                cx={20}
                cy={20}
                r={10}
                style={{
                    stroke: theme.vars.palette.text.icon,
                    fill: 'none',
                    strokeWidth: 5
                }}
            />
        }, {
            type: 'object',
            object: <circle 
                cx={80}
                cy={20}
                r={10}
                style={{
                    stroke: theme.vars.palette.text.icon,
                    fill: 'none',
                    strokeWidth: 5
                }}
            />
        }, {
            type: 'object',
            object: <circle 
                cx={20}
                cy={80}
                r={10}
                style={{
                    stroke: theme.vars.palette.text.icon,
                    fill: 'none',
                    strokeWidth: 5
                }}
            />
        }, /*{
            type: 'object',
            object: <circle 
                cx={80}
                cy={80}
                r={10}
                style={{
                    stroke: theme.vars.palette.text.icon,
                    fill: 'none',
                    strokeWidth: 5
                }}
            />
        },*/ {
            type: 'path',
            pathData: "M 22.5 20 L 77.5 20",
            stroke: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 22.5 20 L 32.5 15 L 32.5 25 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 77.5 20 L 67.5 15 L 67.5 25 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }, /*{
            type: 'path',
            pathData: "M 22.5 80 L 78 80",
            stroke: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 22.5 80 L 32.5 75 L 32.5 85 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 77.5 80 L 67.5 75 L 67.5 85 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        },*/ {
            type: 'path',
            pathData: "M 20 22.5 L 20 77.5",
            stroke: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 20 22.5 L 15 32.5 L 25 32.5 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 20 77.5 L 15 67.5 L 25 67.5 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }, /*{
            type: 'path',
            pathData: "M 80 22.5 L 80 77.5",
            stroke: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 80 22.5 L 75 32.5 L 85 32.5 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 80 77.5 L 75 67.5 L 85 67.5 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }*/]}
    />
}