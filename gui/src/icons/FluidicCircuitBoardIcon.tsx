import { SvgIcon } from "@mui/joy"
import { SxProps } from "@mui/joy/styles/types"

export function FluidicCircuitBoardIcon(props: {
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
            {/* Board outline */}
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M 2 6 L 22 6 L 22 18 L 2 18 Z"
            />
            {/* Central S-trace */}
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M 10 6 L 10 10 L 14 14 L 14 18"
            />
            {/* Short top-right trace */}
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M 17 6 L 17 9 L 20 12"
            />
            {/* Bottom-left trace - opposite diagonal */}
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M 4 15 L 7 12 L 7 9"
            />
        </svg>
    </SvgIcon>
}