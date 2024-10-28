import { useTheme } from "@mui/joy"

export type SVGObject = {
    type: 'object'
    object: React.ReactNode
}

export type PathObject = {
    type: 'path'
    pathData: string
    stroke?: string
    width: number
    fill?: string
    opacity?: number
}

export function LayoutIcon(props: {
    objects: (PathObject | SVGObject)[]
    width?: number
    height?: number
}) {
    const theme = useTheme()
    return <svg
        style={{
            width: '100%',
            height: '100%',
            backgroundColor: theme.vars.palette.background.surface
        }}
        viewBox="0 0 100 100"
    >
        {props.objects.map(obj => {
            if (obj.type === 'object') {
                return obj.object
            } else if (obj.type === 'path') {
                return <path
                    d={obj.pathData}
                    fill={obj.fill ?? "none"}
                    stroke={obj.stroke ?? theme.vars.palette.primary[500]}
                    strokeWidth={obj.width}
                    opacity={obj.opacity}
                />
            }
        }
        )}
    </svg>
}