import { BaseIcon } from "./BaseIcon"

export function LargeBoardIconNoFrame(props: {
    width?: number | string,
    height?: number | string,
    maxWidth?: number | string
}) {
    return <BaseIcon
        {...props}
        objects={[
            // Outer rectangle
            {
                type: 'path',
                pathData: "M 8 8 L 92 8 L 92 92 L 8 92 Z",
                width: 8
            },
            // Dots (3×3 grid) as circle paths
            { type: 'path', pathData: "M 30 30 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 50 30 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 70 30 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 30 50 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 50 50 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 70 50 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 30 70 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 50 70 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 70 70 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 }
        ]}
    />
}