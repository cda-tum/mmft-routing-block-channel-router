// OutsidePortEditor.tsx
import * as React from "react";
import {
    Box,
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Stack,
    Typography, useTheme,
} from "@mui/joy";
import CheckIcon from "@mui/icons-material/Check";

export type OutsidePort = { id: number; xMm: number; yMm: number };

type OutsidePortEditorProps = {
    marker: OutsidePort
    displayNumber: number,

    frameWmm?: number
    frameHmm?: number

    /** Save updated coordinates */
    onSave: (id: number, next: { xMm: number; yMm: number }) => void

    /** Delete this marker */
    onDelete: (id: number) => void
}

export function OutsidePortEditor({
                                      marker,
                                      displayNumber,
                                      frameWmm,
                                      frameHmm,
                                      onSave,
                                      onDelete,
                                  }: OutsidePortEditorProps) {
    const [xStr, setXStr] = React.useState<string>(String(marker.xMm))
    const [yStr, setYStr] = React.useState<string>(String(marker.yMm))

    const theme = useTheme()

    // Keep inputs in sync when selection changes
    React.useEffect(() => {
        setXStr(String(marker.xMm))
        setYStr(String(marker.yMm))
    }, [marker.id, marker.xMm, marker.yMm])

    const xNum = Number(xStr)
    const yNum = Number(yStr)

    const xEmpty = xStr.trim() === ""
    const yEmpty = yStr.trim() === ""
    const xNaN = Number.isNaN(xNum)
    const yNaN = Number.isNaN(yNum)

    const xOut =
        frameWmm != null && !xNaN && !xEmpty && (xNum < 0 || xNum > frameWmm)
    const yOut =
        frameHmm != null && !yNaN && !yEmpty && (yNum < 0 || yNum > frameHmm)

    const hasError = xEmpty || yEmpty || xNaN || yNaN || xOut || yOut

    const unchanged =
        !hasError && xNum === marker.xMm && yNum === marker.yMm

    const handleSave = () => {
        // Clamp to bounds if provided (instead of rejecting)
        const clamp = (v: number, min: number, max: number) =>
            Math.min(Math.max(v, min), max)

        const nx =
            frameWmm != null ? clamp(xNum, 0, frameWmm) : xNum
        const ny =
            frameHmm != null ? clamp(yNum, 0, frameHmm) : yNum

        onSave(marker.id, { xMm: nx, yMm: ny })
    }

    return (
        <Box
            padding={2}
            sx={{
                borderRadius: theme.radius.sm,
                border: '1px solid',
                borderColor: theme.vars.palette.background.level3,
                boxShadow: `0px 2px ${theme.vars.palette.background.level2}`,
                backgroundColor: theme.vars.palette.background.popup
            }}
            alignItems="center"
        >
            <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                flexWrap="wrap"
            >
                <Typography level="title-sm" sx={{ margin: 2, mr: 1, minWidth: 110 }}>
                    Outside Port #{displayNumber}
                </Typography>

                <FormControl size="sm" sx={{ minWidth: 160 }}>
                    <FormLabel>X (mm)</FormLabel>
                    <Input
                        type="number"
                        value={xStr}
                        onChange={(e) => setXStr(e.target.value)}
                        slotProps={{
                            input: {
                                step: 0.1,
                                min: frameWmm != null ? 0 : undefined,
                                max: frameWmm ?? undefined,
                            },
                        }}
                        endDecorator="mm"
                    />
                    {xOut && (
                        <FormHelperText color="danger">
                            0 – {frameWmm} mm
                        </FormHelperText>
                    )}
                </FormControl>

                <FormControl size="sm" sx={{ minWidth: 160 }}>
                    <FormLabel>Y (mm)</FormLabel>
                    <Input
                        type="number"
                        value={yStr}
                        onChange={(e) => setYStr(e.target.value)}
                        slotProps={{
                            input: {
                                step: 0.1,
                                min: frameHmm != null ? 0 : undefined,
                                max: frameHmm ?? undefined,
                            },
                        }}
                        endDecorator="mm"
                    />
                    {yOut && (
                        <FormHelperText color="danger">
                            0 – {frameHmm} mm
                        </FormHelperText>
                    )}
                </FormControl>

                <Stack direction="row" spacing={1}>
                    <Button
                        sx={{
                            marginY: 2,
                        }}
                        variant="outlined"
                        disabled={hasError || unchanged}
                        onClick={handleSave}
                    >
                        <Typography sx={{ color: theme.vars.palette.common.white }}>
                            <CheckIcon sx={{
                                verticalAlign: 'bottom'
                            }} /> Save </Typography>
                    </Button>
                    <Button
                        variant="outlined"
                        color="danger"
                        sx={{
                            marginY: 2,
                        }}
                        onClick={() => onDelete(marker.id)}
                    >
                        <Typography sx={{ color: theme.vars.palette.danger }}>
                             Delete </Typography>
                    </Button>
                </Stack>
            </Stack>
        </Box>
    )
}
