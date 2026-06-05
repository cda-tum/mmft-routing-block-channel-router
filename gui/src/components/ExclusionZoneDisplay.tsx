import { Tooltip } from "@mui/joy";
import { useState } from "react";
import { ExclusionZone, ExclusionZoneState } from "../utils/exclusions";

export function ExclusionZoneDisplay(props: {
    exclusionState: ExclusionZoneState;
    boardHeight: number;
}) {
    return <>
        {Object.values(props.exclusionState).map(zone => (
            <ExclusionZoneRect
                key={zone.id}
                zone={zone}
                boardHeight={props.boardHeight}
            />
        ))}
    </>;
}

function ExclusionZoneRect(props: {
    zone: ExclusionZone;
    boardHeight: number;
}) {
    const [hover, setHover] = useState(false);
    const { zone, boardHeight } = props;

    // SVG origin is top-left, zone origin is bottom-left -> flip y-axis
    const svgY = boardHeight - zone.y_min - zone.height;

    const rx = 0.1;       // corner radius in mm
    const inset = 0.05;    // gap between inner and outer frames in mm

    // Skip inner frame if zone is too small to contain it
    const showInner = zone.width > 4 * inset && zone.height > 4 * inset;

    return (
        <>
            {/* Outer frame — slightly expanded */}
            <rect
                x={zone.x_min - inset}
                y={svgY - inset}
                width={zone.width + 2 * inset}
                height={zone.height + 2 * inset}
                rx={rx + inset}
                stroke="red"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                fill="none"
            />

            {/* Inner frame — slightly inset */}
            {showInner && (
                <rect
                    x={zone.x_min + inset}
                    y={svgY + inset}
                    width={zone.width - 2 * inset}
                    height={zone.height - 2 * inset}
                    rx={Math.max(0, rx - inset)}
                    stroke="red"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    fill="none"
                />
            )}

            {/* Transparent hit area for the tooltip */}
            <Tooltip
                title={<>Zone {zone.id} - {zone.width} × {zone.height} mm</>}
                open={hover}
            >
                <rect
                    x={zone.x_min}
                    y={svgY}
                    width={zone.width}
                    height={zone.height}
                    rx={rx}
                    fill="transparent"
                    onPointerEnter={() => setHover(true)}
                    onPointerLeave={() => setHover(false)}
                />
            </Tooltip>
        </>
    );
}
