import * as React from "react";
import {
    Box,
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Stack,
    Typography,
} from "@mui/joy";
import CheckIcon from "@mui/icons-material/Check";
import { GridConfig, snapToGrid } from "../utils/portGrid.ts";

export type OutsidePort = { id: number; xMm: number; yMm: number; port?: string };

export type OutsidePortSave = {
    xMm: number;
    yMm: number;
    port: string; // human-readable e.g. "A12"
};

type OutsidePortEditorProps = {
    marker: OutsidePort;
    displayNumber: number;
    gridConfig: GridConfig;
    innerWmm: number;
    innerHmm: number;
    onSave: (id: number, next: OutsidePortSave) => void;
    onDelete: (id: number) => void;
};

export function OutsidePortEditor({
                                      marker,
                                      displayNumber,
                                      gridConfig,
                                      innerWmm,
                                      innerHmm,
                                      onSave,
                                      onDelete,
                                  }: OutsidePortEditorProps) {

    // editable strings
    const [xStr, setXStr] = React.useState(String(marker.xMm));
    const [yStr, setYStr] = React.useState(String(marker.yMm));
    const [portStr, setPortStr] = React.useState("");

    // last-saved snapshot
    const [snapX, setSnapX] = React.useState(marker.xMm);
    const [snapY, setSnapY] = React.useState(marker.yMm);
    const [snapPort, setSnapPort] = React.useState("");

    React.useEffect(() => {
        setXStr(String(marker.xMm));
        setYStr(String(marker.yMm));
        const p = marker.port ?? "";
        setPortStr(p);
        setSnapX(marker.xMm);
        setSnapY(marker.yMm);
        setSnapPort(p);
    }, [marker.id]);

    const xNum = Number(xStr);
    const yNum = Number(yStr);
    const xEmpty = xStr.trim() === "";
    const yEmpty = yStr.trim() === "";
    const xNaN = Number.isNaN(xNum);
    const yNaN = Number.isNaN(yNum);
    const portEmpty = portStr.trim() === "";

    const xOut = !xNaN && !xEmpty && (xNum < 0 || xNum > innerWmm);
    const yOut = !yNaN && !yEmpty && (yNum < 0 || yNum > innerHmm);

    const hasError = xEmpty || yEmpty || xNaN || yNaN || xOut || yOut || portEmpty;
    const portError = portStr.trim() === "";

    // Enable Save only when something differs from the snapshot
    const dirty =
        !hasError &&
        (Number(xStr) !== snapX || Number(yStr) !== snapY || portStr !== snapPort);

    const handleSave = () => {
        if (hasError) return;

        // snap to nearest valid grid node in bounds
        const snapped = snapToGrid(xNum, yNum, gridConfig, { width: innerWmm, height: innerHmm });
        if (!snapped) return;

        // send to parent
        onSave(marker.id, { xMm: snapped.x, yMm: snapped.y, port: portStr });

        // reflect what was saved in the inputs
        const sx = +snapped.x.toFixed(2);
        const sy = +snapped.y.toFixed(2);
        setXStr(String(sx));
        setYStr(String(sy));

        // refresh snapshot -> Save disables until another change happens
        setSnapX(sx);
        setSnapY(sy);
        setSnapPort(portStr);
    };

    return (
        <Box /* …styling… */>
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
                    {xOut && <FormHelperText color="danger">0 – {innerWmm} mm</FormHelperText>}
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
                    {yOut && <FormHelperText color="danger">0 – {innerHmm} mm</FormHelperText>}
                </FormControl>

                <FormControl size="sm" sx={{ minWidth: 200 }}>
                    <FormLabel sx={{ color: portError ? 'danger.600' : undefined }}>
                        Port On Routing Board
                    </FormLabel>

                    <Input
                        type="text"
                        value={portStr}
                        onChange={(e) => setPortStr(e.target.value)}
                        placeholder="A1, C12, …"
                        color={portError ? 'danger' : 'neutral'}    // ← red border when required/empty
                        variant="outlined"
                        slotProps={{
                            input: {
                                'aria-invalid': portError || undefined,
                            },
                        }}
                    />

                    <FormHelperText
                        color="danger"
                        sx={{ visibility: portError ? 'visible' : 'hidden' }}
                    >
                        Required
                    </FormHelperText>
                </FormControl>


                <Stack direction="row" spacing={1}>
                    <Button
                        sx={{ my: 2 }}
                        variant="solid"
                        color="primary"
                        disabled={!dirty}
                        onClick={handleSave}
                        startDecorator={<CheckIcon />}
                    >
                        Save
                    </Button>
                    <Button
                        sx={{ my: 2 }}
                        variant="soft"
                        color="danger"
                        onClick={() => onDelete(marker.id)}
                    >
                        Delete
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}

