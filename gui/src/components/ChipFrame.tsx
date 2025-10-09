import * as React from "react";
import { Box } from "@mui/joy";

type ChipFrameProps = {
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
};

export function ChipFrame({ children, className, contentClassName }: ChipFrameProps) {
    return (
        <Box
            className={className}
            sx={{
                position: "relative",
                width: "100%",
                border: "2px solid",
                borderColor: "neutral.outlinedColor",
                borderRadius: "2px",
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            <Box
                className={contentClassName}
                sx={{
                    position: "relative",
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                {children}
            </Box>
        </Box>
    );
}