import * as React from "react";
import {
    Box, Button, FormControl, FormHelperText, FormLabel, Input, Stack, Typography,
} from "@mui/joy";
import CheckIcon from "@mui/icons-material/Check";
import { GridConfig, snapToGrid } from "../utils/portGrid.ts";

export type OutsidePort = { id: number; xMm: number; yMm: number; port?: string };

export type OutsidePortProps = {
    xMm: number;
    yMm: number;
    port: string;
};

export type SaveResult =
    | { ok: true; connectionId?: number }
    | { ok: false; error: string };

type OutsidePortEditorProps = {
    marker: OutsidePort;
    displayNumber: number;
    gridConfig: GridConfig;
    frameWmm: number;
    frameHmm: number;
    gapsMm: {leftMm: number; topMm: number; rightMm: number; bottomMm: number;};
    boardWmm: number;
    boardHmm: number;
    onSave: (id: number, next: OutsidePortProps) => SaveResult | Promise<SaveResult>;
    onDelete: (id: number) => void;
};

export function OutsidePortEditor({
                                      marker, displayNumber, gridConfig, frameWmm, frameHmm, onSave, onDelete, gapsMm, boardWmm, boardHmm,
                                  }: OutsidePortEditorProps) {

    // editable strings
    const [xStr, setXStr] = React.useState(String(marker.xMm));
    const [yStr, setYStr] = React.useState(String(marker.yMm));
    const [portStr, setPortStr] = React.useState(marker.port ?? "");

    // last-saved snapshot
    const [snapX, setSnapX] = React.useState(marker.xMm);
    const [snapY, setSnapY] = React.useState(marker.yMm);
    const [snapPort, setSnapPort] = React.useState(marker.port ?? "");

    // inline error message for the Port field
    const [portHelp, setPortHelp] = React.useState<string | null>(null);

    // Reset when selection changes
    React.useEffect(() => {
        setXStr(String(marker.xMm));
        setYStr(String(marker.yMm));
        const p = marker.port ?? "";
        setPortStr(p);
        setSnapX(marker.xMm);
        setSnapY(marker.yMm);
        setSnapPort(p);
        setPortHelp(null); // clear any previous error
    }, [marker.id]);

    React.useEffect(() => {
        if (portHelp) setPortHelp(null);
    }, [portStr]);

    const xNum = Number(xStr);
    const yNum = Number(yStr);

    const xEmpty = xStr.trim() === "";
    const yEmpty = yStr.trim() === "";
    const xNaN = Number.isNaN(xNum);
    const yNaN = Number.isNaN(yNum);
    const portEmpty = portStr.trim() === "";

    const xOut = !xNaN && !xEmpty && (xNum < 0 || xNum > frameWmm);
    const yOut = !yNaN && !yEmpty && (yNum < 0 || yNum > frameHmm);

    // Only true input errors (bounds/empty) block the Save
    const hasError = xEmpty || yEmpty || xNaN || yNaN || xOut || yOut || portEmpty;

    // Enable Save only if something changed
    const changed =
        !hasError &&
        (Number(xStr) !== snapX || Number(yStr) !== snapY || portStr !== snapPort);

    const handleSave = async () => {
        if (hasError) return;

        // Snap to nearest valid grid node inside bounds
        const snapped = snapToGrid(xNum, yNum, gridConfig, { width: frameWmm, height: frameHmm });
        if (!snapped) return;

        const normalizedPort = portStr.trim().toUpperCase();

        // Ask parent to upsert (validates duplicates)
        const res = await onSave(
            marker.id,
            {xMm: snapped.x, yMm: snapped.y, port: normalizedPort}
        );

        if (!res.ok) {
            // Show parent-provided error (e.g., "Port already used")
            setPortHelp(res.error || "Invalid port");
            return;
        }

        // Reflect snapped values and refresh snapshot, Save disables
        const sx = +snapped.x.toFixed(2);
        const sy = +snapped.y.toFixed(2);
        setXStr(String(sx));
        setYStr(String(sy));
        setPortStr(normalizedPort);

        setSnapX(sx);
        setSnapY(sy);
        setSnapPort(normalizedPort);
        setPortHelp(null);
    };

    const leftEdge = gapsMm.leftMm;
    const higherEdge = gapsMm.topMm;
    const rightEdge = gapsMm.leftMm + boardWmm;
    const lowerEdge = gapsMm.topMm + boardHmm;
    const coordinatesWithinBoard = xNum >= leftEdge && xNum <= rightEdge && yNum >= higherEdge && yNum <= lowerEdge
    const portHasError = portEmpty || !!portHelp;

    const xInvalid = xStr.trim() === "" || Number.isNaN(xNum) || xNum < 0 || xNum > frameWmm || coordinatesWithinBoard;
    const xMsg = xInvalid ? `Must be between 0 and ${frameWmm} mm outside the board` : "X coordinate in millimeters";

    const yInvalid = yStr.trim() === "" || Number.isNaN(xNum) || yNum < 0 || yNum > frameHmm || coordinatesWithinBoard;
    const yMsg = yInvalid ? `Must be between 0 and ${frameHmm} mm outside the board` : "Y coordinate in millimeters";

    let portMsg: string;

    if (portEmpty) {
        portMsg = "Please specify a valid port within bounds";
    } else if (portHelp) {
        portMsg = "Must be in bounds and correct format";
    } else {
        portMsg = "Destination port inside board";
    }

    return (
        <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Typography
                    level="title-sm"
                    sx={{
                        m: 2,
                        mr: 1,
                        minWidth: 140,
                        alignSelf: "center",
                    }}
                >
                    Outside Port #{displayNumber}
                </Typography>

                <FormControl size="sm" sx={{ minWidth: 160 }}>
                    <FormLabel sx={{ color: xInvalid ? "danger.600" : undefined }}>
                        Horizontal Position
                    </FormLabel>

                    <Input
                        type="number"
                        value={xStr}
                        onChange={(e) => setXStr(e.target.value)}
                        slotProps={{ input: { step: 0.1, min: 0, max: frameWmm, "aria-invalid": xInvalid || undefined } }}
                        color={xInvalid ? "danger" : "neutral"}
                        variant="outlined"
                        sx={{
                            minWidth: 270,
                            minHeight: 38,
                            height: 38 }}
                    />

                    <FormHelperText
                        sx={{
                            color: xInvalid ? "danger" : "neutral",
                            fontSize: "0.75rem",
                        }}
                    >
                        {xMsg}
                    </FormHelperText>
                </FormControl>

                <FormControl size="sm" sx={{ minWidth: 160 }}>
                    <FormLabel sx={{ color: yInvalid ? "danger.600" : undefined }}>
                        Vertical Position
                    </FormLabel>
                    <Input
                        type="number"
                        value={yStr}
                        onChange={(e) => setYStr(e.target.value)}
                        slotProps={{ input: { step: 0.1, min: 0, max: frameHmm, "aria-invalid": yInvalid || undefined } }}
                        color={yInvalid ? "danger" : "neutral"}
                        endDecorator="mm"
                        sx={{
                            minWidth: 270,
                            minHeight: 38,
                            height: 38,
                        }}
                    />
                    <FormHelperText sx={{
                        color: xInvalid ? "danger" : "neutral",
                        fontSize: "0.75rem",
                    }}>
                        {yMsg}
                    </FormHelperText>
                </FormControl>

                <FormControl size="sm" sx={{ minWidth: 200 }}>
                    <FormLabel sx={{ color: portHasError ? "danger.600" : undefined }}>
                        Destination Port
                    </FormLabel>
                    <Input
                        type="text"
                        value={portStr}
                        onChange={(e) => setPortStr(e.target.value)}
                        placeholder="A1, C12, …"
                        color={portHasError ? "danger" : "neutral"}
                        variant="outlined"
                        slotProps={{ input: { "aria-invalid": portHasError || undefined } }}
                        sx={{
                            minWidth: 220,
                            minHeight: 38,
                            height: 38,
                        }}
                    />
                    <FormHelperText color={portHasError ? "danger" : "neutral"}>
                        {portMsg}
                    </FormHelperText>
                </FormControl>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="solid"
                        color="primary"
                        disabled={!changed}
                        onClick={handleSave}
                        startDecorator={<CheckIcon />}
                        sx={{
                            minHeight: 38,
                            height: 38,
                        }}
                    >
                        Save
                    </Button>
                    <Button
                        variant="soft"
                        color="danger"
                        onClick={() => onDelete(marker.id)}
                        sx={{
                            minHeight: 38,
                            height: 38,
                        }}
                    >
                        Delete
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
