import { useTheme } from "@mui/joy"
import { BaseIcon } from "./BaseIcon"

export function StarterPlatformIcon(props: {
    width?: number | string,
    height?: number | string,
    maxWidth?: number | string
}) {

    const theme = useTheme()

    return <BaseIcon
        {...props}
        objects={[
            // Outer panel rectangle
            {
                type: 'object',
                object: <rect
                    x={5}
                    y={8}
                    width={90}
                    height={84}
                    rx={4}
                    ry={4}
                    style={{
                        stroke: theme.vars.palette.text.icon,
                        fill: 'none',
                        strokeWidth: 5
                    }}
                />
            },
            // Routing block rectangle
            {
                type: 'object',
                object: <rect
                    x={14}
                    y={36}
                    width={72}
                    height={14}
                    rx={1}
                    ry={1}
                    style={{
                        stroke: theme.vars.palette.primary[500],
                        fill: 'none',
                        strokeWidth: 3
                    }}
                />
            },
            // Dots - left group
            {
                type: 'object',
                object: <circle cx={22} cy={40} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={26} cy={40} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={30} cy={40} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={22} cy={46} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={26} cy={46} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={30} cy={46} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            },
            // Dots - center group
            {
                type: 'object',
                object: <circle cx={46} cy={40} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={50} cy={40} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={54} cy={40} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={46} cy={46} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={50} cy={46} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={54} cy={46} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            },
            // Dots - right group
            {
                type: 'object',
                object: <circle cx={70} cy={40} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={74} cy={40} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={78} cy={40} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={70} cy={46} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={74} cy={46} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={78} cy={46} r={1.3} style={{ fill: theme.vars.palette.primary[500] }} />
            },
            // Bottom left square
            {
                type: 'object',
                object: <rect
                    x={18}
                    y={64}
                    width={13}
                    height={13}
                    style={{
                        stroke: theme.vars.palette.text.icon,
                        fill: 'none',
                        strokeWidth: 3
                    }}
                />
            },
            // Bottom center square
            {
                type: 'object',
                object: <rect
                    x={43.5}
                    y={64}
                    width={13}
                    height={13}
                    style={{
                        stroke: theme.vars.palette.text.icon,
                        fill: 'none',
                        strokeWidth: 3
                    }}
                />
            },
            // Bottom right square
            {
                type: 'object',
                object: <rect
                    x={69}
                    y={64}
                    width={13}
                    height={13}
                    style={{
                        stroke: theme.vars.palette.text.icon,
                        fill: 'none',
                        strokeWidth: 3
                    }}
                />
            },
            // Top row - 6 small pump rectangles spanning panel width
            {
                type: 'object',
                object: <rect x={14} y={15} width={9} height={12} style={{ fill: theme.vars.palette.text.icon }} />
            }, {
                type: 'object',
                object: <rect x={26.5} y={15} width={9} height={12} style={{ fill: theme.vars.palette.text.icon }} />
            }, {
                type: 'object',
                object: <rect x={39} y={15} width={9} height={12} style={{ fill: theme.vars.palette.text.icon }} />
            }, {
                type: 'object',
                object: <rect x={51.5} y={15} width={9} height={12} style={{ fill: theme.vars.palette.text.icon }} />
            }, {
                type: 'object',
                object: <rect x={64} y={15} width={9} height={12} style={{ fill: theme.vars.palette.text.icon }} />
            }, {
                type: 'object',
                object: <rect x={76.5} y={15} width={9} height={12} style={{ fill: theme.vars.palette.text.icon }} />
            },
            // Mounting holes - left/right of routing block
            {
                type: 'object',
                object: <circle cx={10} cy={43} r={2} style={{ fill: theme.vars.palette.primary[500] }} />
            }, {
                type: 'object',
                object: <circle cx={90} cy={43} r={2} style={{ fill: theme.vars.palette.primary[500] }} />
            },
            // Mounting holes - between routing block and squares
            {
                type: 'object',
                object: <circle cx={25} cy={57} r={2} style={{ fill: theme.vars.palette.text.icon }} />
            }, {
                type: 'object',
                object: <circle cx={50} cy={57} r={2} style={{ fill: theme.vars.palette.text.icon }} />
            }, {
                type: 'object',
                object: <circle cx={75} cy={57} r={2} style={{ fill: theme.vars.palette.text.icon }} />
            },
            // Mounting holes - bottom row
            {
                type: 'object',
                object: <circle cx={25} cy={84} r={2} style={{ fill: theme.vars.palette.text.icon }} />
            }, {
                type: 'object',
                object: <circle cx={50} cy={84} r={2} style={{ fill: theme.vars.palette.text.icon }} />
            }, {
                type: 'object',
                object: <circle cx={75} cy={84} r={2} style={{ fill: theme.vars.palette.text.icon }} />
            }
        ]}
    />
}