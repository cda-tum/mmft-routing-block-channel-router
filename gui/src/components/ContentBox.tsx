import { Box, useTheme } from "@mui/joy";
import { SxProps } from "@mui/joy/styles/types";

export function ContentBox(props: {
    children?: React.ReactNode
    sx: SxProps
}) {
    const theme = useTheme()
    return <Box
        sx={{
            backgroundColor: theme.vars.palette.background.surface,
            borderRadius: theme.radius.sm,
            border: '1px solid',
            borderColor: theme.vars.palette.background.level2,
            boxShadow: `0px 2px ${theme.vars.palette.background.level1}`,
            marginY: 2,
            ...props.sx
        }}>
            {props.children}
    </Box>
}