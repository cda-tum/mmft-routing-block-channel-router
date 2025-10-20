import * as React from "react";
import { Box } from "@mui/joy";

type ChipFrameProps = {
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    contentRef?: React.Ref<HTMLDivElement>;
    contentSx?: any;
    contentProps?: React.HTMLAttributes<HTMLDivElement>;
};

export function ChipFrame({ children, className, contentClassName, contentRef, contentSx, contentProps }: ChipFrameProps) {
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
                ref={contentRef}
                className={contentClassName}
                sx={{
                    position: "relative",
                    width: "100%",
                    boxSizing: "border-box",
                    ...contentSx,
                }}
                {...contentProps}
            >
                {children}
            </Box>
        </Box>
    );
}