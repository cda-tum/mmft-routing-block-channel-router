import { SvgIcon } from "@mui/joy";
import { SxProps } from "@mui/joy/styles/types";

export function ChannelIcon(props: {
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
                stroke="none"
                fill="rgb(from currentColor r g b / calc(alpha / 2))"
                d="M 0 4 L 14 4 L 14 14 L 24 14 L 24 20 L 8 20 L 8 10 L 0 10 z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M 0 4 L 14 4 L 14 14 L 24 14"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M 0 10 L 8 10 L 8 20 L 24 20"
            />
        </svg>
    </SvgIcon>
}
