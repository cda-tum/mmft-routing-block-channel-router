import { BaseIcon } from "./BaseIcon"

export function RectilinearIcon(props: {
    width?: number | string,
    height?: number | string,
    maxWidth?: number | string
}) {
    return <BaseIcon
        {...props}
        objects={[{
            type: 'path',
            pathData: "M 0 30 L 20 30 L 20 70 L 0 70 M 0 90 L 40 90 L 40 70 L 100 70 M 100 50 L 40 50 L 40 10 L 0 10 M 60 7.5 L 60 30 L 100 30",
            width: 7.5
        }]}
    />
}