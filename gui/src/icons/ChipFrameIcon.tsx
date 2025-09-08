import { SvgIcon } from "@mui/joy";
import { SxProps } from "@mui/joy/styles/types";

export function ChipFrameIcon(props: {
    sx: SxProps
}) {
    return <SvgIcon sx={props.sx}>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M 2 6 L 22 6 L 22 18 L 2 18 z"
            />
        </svg>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M 6 10 L 18 10 L 18 14 L 6 14 z"
            />
        </svg>
    </SvgIcon>
}
