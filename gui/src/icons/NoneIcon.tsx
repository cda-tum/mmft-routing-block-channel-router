import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"

export function NoneIcon(props: {
    width?: number | string,
    height?: number | string,
    maxWidth?: number | string
}) {

    const theme = useTheme()

    return <BaseIcon
        {...props}
        objects={[
            {
                type: 'object',
                object: <circle
                    cx={50}
                    cy={50}
                    r={35}
                    style={{
                        stroke: theme.vars.palette.primary[500],
                        fill: 'none',
                        strokeWidth: 8
                    }}
                />
            },
            {
                type: 'path',
                pathData: "M 25.25 25.25 L 74.75 74.75",
                width: 8
            }
        ]}
    />
}