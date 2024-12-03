import { BaseIcon } from "./BaseIcon"

export function MixedIcon(props: {
    width?: number | string,
    height?: number | string,
    maxWidth?: number | string
}) {
    return <BaseIcon
        {...props}
        objects={[{
            type: 'path',
            pathData: "M 0 30 L 10 30 L 20 40 L 20 70 L 0 70 M 0 90 L 30 90 L 50 70 L 100 70 M 100 50 L 60 50 L 20 10 L 0 10 M 65 7.5 L 65 25 L 100 25",
            width: 7.5
        }]}
    />
}