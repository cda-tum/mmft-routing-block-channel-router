import { SvgIcon } from "@mui/joy";
import { SxProps } from "@mui/joy/styles/types";

export function RoutingExclusionIcon(props: {
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
            {/* Channel sequence, scaled to 60% around (12, 12) */}
            <path
                stroke="none"
                fill="rgb(from currentColor r g b / calc(alpha / 2))"
                d="M 4.8 7.2 L 13.2 7.2 L 13.2 13.2 L 19.2 13.2 L 19.2 16.8 L 9.6 16.8 L 9.6 10.8 L 4.8 10.8 z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M 4.8 7.2 L 13.2 7.2 L 13.2 13.2 L 19.2 13.2"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M 4.8 10.8 L 9.6 10.8 L 9.6 16.8 L 19.2 16.8"
            />
            {/* "Forbidden" overlay: circle + diagonal slash */}
            <circle cx="12" cy="12" r="10.5" />
            <path
                strokeLinecap="round"
                d="M 4.58 4.58 L 19.42 19.42"
            />
        </svg>
    </SvgIcon>
}