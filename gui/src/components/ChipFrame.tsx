import * as React from "react";
import { Box } from "@mui/joy";

type ChipFrameProps = {
    /** Padding between the frame border and free area of the chip around the routing board */
    minPadding?: number;

    // Optional minimum inner content size (in px).
    minContentSizePx?: { width?: number; height?: number };

    // Initial size on first mount */
    defaultSize?: { width?: number; height?: number };

    // Controlled external size (px)
    frameSizePx?: { width: number; height: number };

    // Optional container ref used to fill width on mount
    stageRef?: React.RefObject<HTMLElement>;

    fillWidthOnMount?: boolean;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
};

type ChipFrameState = {
    width: number;
    height: number;
};

export class ChipFrame extends React.PureComponent<ChipFrameProps, ChipFrameState> {
    static defaultProps = {
        minPadding: 15,
        fillWidthOnMount: false,
    };

    constructor(props: ChipFrameProps) {
        super(props);

        const initialW = props.frameSizePx?.width ?? props.defaultSize?.width ?? 400;
        const initialH = props.frameSizePx?.height ?? props.defaultSize?.height ?? 300;

        const { minWidthPx, minHeightPx } = this.computeMinSize(props);

        this.state = {
            width: Math.max(initialW, minWidthPx),
            height: Math.max(initialH, minHeightPx),
        };
    }

    componentDidMount() {
        const { stageRef, fillWidthOnMount } = this.props;
        if (fillWidthOnMount && stageRef?.current && !this.props.frameSizePx?.width) {
            const stageWidth = stageRef.current.clientWidth;
            const { minWidthPx } = this.computeMinSize(this.props);
            this.setState(s => ({ ...s, width: Math.max(stageWidth, minWidthPx) }));
        }
    }

    componentDidUpdate(prev: ChipFrameProps) {
        const { minWidthPx, minHeightPx } = this.computeMinSize(this.props);

        // Sync when controlled size changes (respect mins)
        if (this.props.frameSizePx) {
            const wChanged = this.props.frameSizePx.width !== prev.frameSizePx?.width;
            const hChanged = this.props.frameSizePx.height !== prev.frameSizePx?.height;
            if (wChanged || hChanged) {
                const width = Math.max(this.props.frameSizePx.width, minWidthPx);
                const height = Math.max(this.props.frameSizePx.height, minHeightPx);
                if (width !== this.state.width || height !== this.state.height) {
                    this.setState({ width, height });
                }
                return;
            }
        }

        // Re-clamp if minimum constraints increased
        const minsChanged =
            prev.minPadding !== this.props.minPadding ||
            prev.minContentSizePx?.width !== this.props.minContentSizePx?.width ||
            prev.minContentSizePx?.height !== this.props.minContentSizePx?.height;

        if (minsChanged) {
            if (this.state.width < minWidthPx || this.state.height < minHeightPx) {
                this.setState(s => ({
                    width: Math.max(s.width, minWidthPx),
                    height: Math.max(s.height, minHeightPx),
                }));
            }
        }
    }

    private computeMinSize(props: ChipFrameProps) {
        const pad = props.minPadding ?? 24;
        const innerMinW = Math.max(0, props.minContentSizePx?.width ?? 0);
        const innerMinH = Math.max(0, props.minContentSizePx?.height ?? 0);
        return {
            minWidthPx: innerMinW + pad * 2,
            minHeightPx: innerMinH + pad * 2,
        };
    }

    render() {
        const { minPadding = 24, children } = this.props;
        const { width, height } = this.state;

        return (
            <Box className={this.props.className}
                sx={{
                    position: "relative",
                    width,
                    height,
                    border: "2px solid",
                    borderColor: "neutral.outlinedColor",
                    boxSizing: "border-box",
                }}
            >
                <Box className={this.props.contentClassName}
                    sx={{
                        position: "absolute",
                        top: minPadding,
                        right: minPadding,
                        bottom: minPadding,
                        left: minPadding,
                        boxSizing: "border-box",
                    }}
                >
                    <Box sx={{ width: "100%", height: "100%" }}>{children}</Box>
                </Box>
            </Box>
        );
    }
}
