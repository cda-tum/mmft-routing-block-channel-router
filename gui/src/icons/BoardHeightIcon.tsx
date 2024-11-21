import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"

export function BoardHeightIcon(props: {
    width?: number,
    height?: number
}) {

    const theme = useTheme()

    return <BaseIcon
        {...props}
        objects={[{
            type: 'path',
            pathData: "M 5 20 L 95 20 L 95 80 L 5 80 Z",
            stroke: theme.vars.palette.text.icon,
            width: 5
        }, {
            type: 'path',
            pathData: "M 50 22.5 L 50 77.5",
            stroke: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 50 22.5 L 55 30 L 45 30 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }, {
            type: 'path',
            pathData: "M 50 77.5 L 55 70 L 45 70 Z",
            fill: theme.vars.palette.primary[500],
            width: 5
        }]}
    />
}