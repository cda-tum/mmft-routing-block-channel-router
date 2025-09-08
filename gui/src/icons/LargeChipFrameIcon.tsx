import { BaseIcon } from "./BaseIcon"

export function LargeChipFrameIcon(props: {
    width?: number | string,
    height?: number | string,
    maxWidth?: number | string
}) {
    return <BaseIcon
        {...props}
        objects={[
            {
                type: 'path',
                pathData: "M 8 8 L 92 8 L 92 92 L 8 92 Z",
                width: 8
            },
            {
                type: 'path',
                pathData: "M 28 28 L 72 28 L 72 72 L 28 72 Z",
                width: 5.5
            },
            // 3×3 grid of small dots inside the inner rectangle
            { type: 'path', pathData: "M 40 40 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 50 40 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 60 40 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 40 50 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 50 50 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 60 50 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 40 60 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 50 60 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 },
            { type: 'path', pathData: "M 60 60 m -2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0", width: 2 }
        ]}
    />
}