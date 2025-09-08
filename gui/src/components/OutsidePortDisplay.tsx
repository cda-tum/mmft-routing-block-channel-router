import * as React from "react";
import { useTheme } from "@mui/joy";

export type OutsidePortDisplayProps = {
    xMm: number
    yMm: number
    markerId?: number

    diameterMm?: number
    fontSizeMm?: number
    labelSide?: "auto" | "e" | "w" | "n" | "s"
    frameWmm?: number
    frameHmm?: number
    safeMarginMm?: number

    /** Allow hover (for label) and/or click. */
    interactive?: boolean
    clickable?: boolean
    onClick?: () => void

    id?: string
    className?: string
    style?: React.CSSProperties
};

export function OutsidePortDisplay({
                                       xMm, yMm, markerId,
                                       diameterMm = 2,
                                       fontSizeMm = 1.6,
                                       labelSide = "auto",
                                       frameWmm, frameHmm,
                                       safeMarginMm = 8,
                                       interactive = true,
                                       clickable = false,
                                       onClick,
                                       id, className, style,
                                   }: OutsidePortDisplayProps) {
    const t = useTheme()
    const [hover, setHover] = React.useState(false)

    const r = Math.max(0.1, diameterMm / 2)
    const gap = Math.max(0.2, r * 0.6)
    const lineH = fontSizeMm * 1.4

    const fill   = hover ? t.vars.palette.primary[300] : t.vars.palette.primary[400]
    const stroke = t.vars.palette.primary[700]
    const text   = t.vars.palette.text.primary

    let side: "e"|"w"|"n"|"s" = labelSide === "auto" ? "e" : labelSide
    if (labelSide === "auto" && frameWmm && frameHmm) {
        if (xMm > frameWmm - safeMarginMm) side = "w";
        else if (yMm > frameHmm - safeMarginMm) side = "n"
    }

    let tx = 0, ty = 0, anchor: "start"|"end"|"middle" = "start", baseline: "hanging"|"middle"|"auto" = "hanging"
    switch (side) {
        case "e": tx = r + gap; ty = -r; anchor = "start";  baseline = "hanging"; break
        case "w": tx = -(r + gap); ty = -r; anchor = "end"; baseline = "hanging"; break
        case "n": tx = 0; ty = -(r + gap + lineH*2); anchor = "middle"; baseline = "hanging"; break
        case "s": tx = 0; ty =  r + gap;              anchor = "middle"; baseline = "hanging"; break
    }

    const label1 = markerId != null ? `#${markerId}` : ""
    const label2 = `${xMm.toFixed(1)} mm, ${yMm.toFixed(1)} mm`

    const onKeyDown: React.KeyboardEventHandler<SVGGElement> = (e) => {
        if (!clickable || !onClick) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
    }

    return (
        <g
            id={id}
            className={className}
            transform={`translate(${xMm} ${yMm})`}
            style={{
                cursor: clickable ? "pointer" : "default",
                // Let this element receive hover even if the overlay container is pointerEvents: 'none'
                pointerEvents: interactive ? "auto" : "none",
                ...style,
            }}
            onClick={clickable ? onClick : undefined}
            onMouseEnter={interactive ? () => setHover(true) : undefined}
            onMouseLeave={interactive ? () => setHover(false) : undefined}
            onKeyDown={onKeyDown}
            tabIndex={clickable ? 0 : -1}
            role={clickable ? "button" : "img"}
            aria-label={`${label1 ? label1 + " — " : ""}${label2}`}
        >
            <title>{`${label1 ? label1 + " — " : ""}${label2}`}</title>

            <circle cx={0} cy={0} r={r} fill={fill} stroke={stroke} strokeWidth={Math.max(0.15, r*0.12)} />

            {/* Show label ONLY on hover */}
            {hover && (
                <text x={tx} y={ty} fill={text} fontSize={fontSizeMm} textAnchor={anchor} dominantBaseline={baseline}>
                    {label1 && <tspan x={tx}>{label1}</tspan>}
                    <tspan x={tx} dy={label1 ? lineH : 0}>{label2}</tspan>
                </text>
            )}
        </g>
    )
}
