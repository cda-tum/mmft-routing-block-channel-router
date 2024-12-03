import { Box, useTheme } from "@mui/joy";

export function ContentBox(props: {
    children?: React.ReactNode
}) {
    const theme = useTheme()
    return <Box
        sx={{
            backgroundColor: theme.vars.palette.background.surface,
            borderRadius: theme.radius.sm,
            border: '1px solid',
            borderColor: theme.vars.palette.background.level2,
            boxShadow: `0px 2px ${theme.vars.palette.background.level1}`,
            marginY: 2
        }}>
            {props.children}
    </Box>
}