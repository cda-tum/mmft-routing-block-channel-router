import * as React from "react";
import { useTheme } from "@mui/joy";

export type OutsidePortDisplayProps = {
    xMm: number;
    yMm: number;
    markerId?: number;

    diameterMm?: number;
    fontSizeMm?: number;
    labelSide?: "auto" | "e" | "w" | "n" | "s";
    frameWmm?: number;
    frameHmm?: number;
    safeMarginMm?: number;

    interactive?: boolean;
    clickable?: boolean;
    onClick?: (ev?: React.MouseEvent<SVGGElement>) => void;

    labelPaddingMm?: number;
    labelRadiusMm?: number;

    id?: string;
    className?: string;
    style?: React.CSSProperties;
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
                                       labelPaddingMm = 0.8,
                                       labelRadiusMm = 0.8,
                                       id, className,
                                   }: OutsidePortDisplayProps) {
    const t = useTheme();
    const [hover, setHover] = React.useState(false);

    const r = Math.max(0.1, diameterMm / 2);
    const gap = Math.max(0.2, r * 0.6);
    const lineH = fontSizeMm * 1.4;

    const fillDot   = hover ? t.vars.palette.primary[300] : t.vars.palette.primary[400];
    const strokeDot = t.vars.palette.primary[700];
    const textFill  = t.vars.palette.text.primary;

    // decide label side (edge-aware)
    let side: "e"|"w"|"n"|"s" = labelSide === "auto" ? "e" : labelSide;
    if (labelSide === "auto" && frameWmm && frameHmm) {
        if (xMm > frameWmm - safeMarginMm) side = "w";
        else if (yMm > frameHmm - safeMarginMm) side = "n";
    }

    // anchor position for TOP of first line
    let tx = 0, ty = 0, anchor: "start"|"end"|"middle" = "start", baseline: "hanging"|"middle"|"auto" = "hanging";
    switch (side) {
        case "e": tx = r + gap;       ty = -r;                    anchor = "start";  baseline = "hanging"; break;
        case "w": tx = -(r + gap);    ty = -r;                    anchor = "end";    baseline = "hanging"; break;
        case "n": tx = 0;             ty = -(r + gap + lineH*2);  anchor = "middle"; baseline = "hanging"; break;
        case "s": tx = 0;             ty =  r + gap;              anchor = "middle"; baseline = "hanging"; break;
    }

    const label1 = markerId != null ? `#${markerId}` : "";
    const label2 = `${xMm.toFixed(1)} mm, ${yMm.toFixed(1)} mm`;

    // Measure the text to size the background rect
    const textRef = React.useRef<SVGTextElement | null>(null);
    const [box, setBox] = React.useState<{w:number; h:number} | null>(null);

    // width estimate as fallback
    const approxWidth = React.useMemo(() => {
        const est = (s: string) => s.length * fontSizeMm * 0.6;
        return Math.max(label1 ? est(label1) : 0, est(label2));
    }, [label1, label2, fontSizeMm]);
    const approxHeight = (label1 ? 2 : 1) * lineH;

    React.useLayoutEffect(() => {
        if (hover && textRef.current) {
            try {
                const bb = textRef.current.getBBox();
                setBox({ w: bb.width, h: bb.height });
            } catch {
                setBox(null);
            }
        } else if (!hover) {
            setBox(null);
        }
    }, [hover, label1, label2, fontSizeMm, lineH, tx, ty, anchor]);

    // compute rect from anchor and measured/fallback size
    const w = (box?.w ?? approxWidth);
    const h = (box?.h ?? approxHeight);
    const pad = labelPaddingMm;
    const rectW = w + 2 * pad;
    const rectH = h + 2 * pad;

    let rectX = tx - pad;
    if (anchor === "end")   rectX = tx - (w + pad);
    if (anchor === "middle") rectX = tx - (w / 2) - pad;
    const rectY = ty - pad;

    const bgFill   = 'var(--joy-palette-background-level1)';
    const bgStroke = 'var(--joy-palette-neutral-outlinedBorder)';

    const onKeyDown: React.KeyboardEventHandler<SVGGElement> = (e) => {
        if (!clickable || !onClick) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
    };

    return (
        <g
            id={id}
            className={className}
            transform={`translate(${xMm} ${yMm})`}
            style={{ pointerEvents: "auto", cursor: "pointer", outline: "none" }}
            onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();      // avoid focusing the <g> & avoid background click
                onClick?.();
            }}
            onMouseEnter={interactive ? () => setHover(true) : undefined}
            onMouseLeave={interactive ? () => setHover(false) : undefined}
            onKeyDown={onKeyDown}
            tabIndex={clickable ? 0 : -1}
            role={clickable ? "button" : "img"}
            aria-label={`${label1 ? label1 + " — " : ""}${label2}`}
            onClick={
                clickable
                    ? (e) => {
                        e.stopPropagation();        // don't trigger background click
                        onClick?.(e);               // tell BoardDisplay which marker was hit
                    }
                    : undefined
            }
        >
            <title>{`${label1 ? label1 + " — " : ""}${label2}`}</title>

            <circle cx={0} cy={0} r={r} fill={fillDot} stroke={strokeDot} strokeWidth={Math.max(0.15, r*0.12)} />

            {hover && (
                <>
                    {/* background bubble */}
                    <rect
                        x={rectX}
                        y={rectY}
                        width={rectW}
                        height={rectH}
                        rx={labelRadiusMm}
                        ry={labelRadiusMm}
                        fill={bgFill}
                        stroke={bgStroke}
                        strokeWidth={0.3}
                    />
                    {/* text on top */}
                    <text
                        ref={textRef}
                        x={tx}
                        y={ty}
                        fill={textFill}
                        fontSize={fontSizeMm}
                        textAnchor={anchor}
                        dominantBaseline={baseline}
                    >
                        {label1 && <tspan x={tx}>{label1}</tspan>}
                        <tspan x={tx} dy={label1 ? lineH : 0}>{label2}</tspan>
                    </text>
                </>
            )}
        </g>
    );
}
