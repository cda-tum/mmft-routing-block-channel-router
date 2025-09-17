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
    innerWmm: number;
    innerHmm: number;
    onSave: (id: number, next: OutsidePortProps) => SaveResult | Promise<SaveResult>;
    onDelete: (id: number) => void;
};

export function OutsidePortEditor({
                                      marker, displayNumber, gridConfig, innerWmm, innerHmm, onSave, onDelete,
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

    // Clear port error as the user types
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

    const xOut = !xNaN && !xEmpty && (xNum < 0 || xNum > innerWmm);
    const yOut = !yNaN && !yEmpty && (yNum < 0 || yNum > innerHmm);

    // Only true input errors (bounds/empty) block the Save
    const hasError = xEmpty || yEmpty || xNaN || yNaN || xOut || yOut || portEmpty;

    // Enable Save only if something changed
    const changed =
        !hasError &&
        (Number(xStr) !== snapX || Number(yStr) !== snapY || portStr !== snapPort);

    const handleSave = async () => {
        if (hasError) return;

        // Snap to nearest valid grid node inside bounds
        const snapped = snapToGrid(xNum, yNum, gridConfig, { width: innerWmm, height: innerHmm });
        if (!snapped) return;

        const normalizedPort = portStr.trim().toUpperCase();

        // Ask parent to upsert (validates duplicates, etc.)
        const res = await Promise.resolve(onSave(
            marker.id,
            { xMm: snapped.x, yMm: snapped.y, port: normalizedPort }
        ));

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

    const portHasError = portEmpty || !!portHelp;

    return (
        <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Typography level="title-sm" sx={{ m: 2, mr: 1, minWidth: 140 }}>
                    Outside Port #{displayNumber}
                </Typography>

                <FormControl size="sm" sx={{ minWidth: 160 }}>
                    <FormLabel>X (mm)</FormLabel>
                    <Input
                        type="number"
                        value={xStr}
                        onChange={(e) => setXStr(e.target.value)}
                        slotProps={{ input: { step: 0.1, min: 0, max: innerWmm } }}
                        endDecorator="mm"
                    />
                    <FormHelperText sx={{ visibility: xOut ? "visible" : "hidden" }}>
                        {xOut ? `0 – ${innerWmm} mm` : " "}
                    </FormHelperText>
                </FormControl>

                <FormControl size="sm" sx={{ minWidth: 160 }}>
                    <FormLabel>Y (mm)</FormLabel>
                    <Input
                        type="number"
                        value={yStr}
                        onChange={(e) => setYStr(e.target.value)}
                        slotProps={{ input: { step: 0.1, min: 0, max: innerHmm } }}
                        endDecorator="mm"
                    />
                    <FormHelperText sx={{ visibility: yOut ? "visible" : "hidden" }}>
                        {yOut ? `0 – ${innerHmm} mm` : " "}
                    </FormHelperText>
                </FormControl>

                <FormControl size="sm" sx={{ minWidth: 200 }}>
                    <FormLabel sx={{ color: portHasError ? "danger.600" : undefined }}>
                        Port On Routing Board
                    </FormLabel>
                    <Input
                        type="text"
                        value={portStr}
                        onChange={(e) => setPortStr(e.target.value)}
                        placeholder="A1, C12, …"
                        color={portHasError ? "danger" : "neutral"}
                        variant="outlined"
                        slotProps={{ input: { "aria-invalid": portHasError || undefined } }}
                    />
                    <FormHelperText color="danger" sx={{ visibility: portHasError ? "visible" : "hidden" }}>
                        {portHelp ?? "Required"}
                    </FormHelperText>
                </FormControl>

                <Stack direction="row" spacing={1}>
                    <Button
                        sx={{ my: 2 }}
                        variant="solid"
                        color="primary"
                        disabled={!changed}
                        onClick={handleSave}
                        startDecorator={<CheckIcon />}
                    >
                        Save
                    </Button>
                    <Button sx={{ my: 2 }} variant="soft" color="danger" onClick={() => onDelete(marker.id)}>
                        Delete
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
