import { useTheme } from "@mui/joy"

export function LayoutIcon(props: {
    pathData: string
}) {
    const theme = useTheme()
    return <svg
        style={{
            margin: '0.5em',
            backgroundColor: theme.vars.palette.background.surface
        }}
        viewBox="0 0 100 100"
    >
        <path
            d={props.pathData}
            fill="none"
            stroke={theme.vars.palette.primary[500]}
            strokeWidth="7.5"
        >

        </path>
    </svg>
}