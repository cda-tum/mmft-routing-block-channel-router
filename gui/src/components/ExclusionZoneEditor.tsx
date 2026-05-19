import { Box, Button, Stack, Typography, useTheme } from "@mui/joy";
import { ExclusionStateHandle } from "../hooks/useExclusionState";
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { MicrometerInput } from "./MicrometerInput";
import { useState } from "react";

type Props = {
    exclusionState: ExclusionStateHandle;
    boardWidth: number;
    boardHeight: number;
};

export function ExclusionZoneEditor({ exclusionState, boardWidth, boardHeight }: Props) {
    const theme = useTheme();

    type FieldState = { fieldValue: string; parsedValue: number | undefined };

    const empty: FieldState = { fieldValue: '', parsedValue: undefined };

    const initFromNumber = (n: number | undefined): FieldState =>
        n === undefined || Number.isNaN(n)
            ? empty
            : { fieldValue: String(n), parsedValue: n };

    const [fields, setFields] = useState({
        x_min: initFromNumber(exclusionState.preview?.x_min),
        y_min: initFromNumber(exclusionState.preview?.y_min),
        width: initFromNumber(exclusionState.preview?.width),
        height: initFromNumber(exclusionState.preview?.height),
    });

    const updateField = (
        key: keyof typeof fields,
        fieldValue: string,
        parsedValue: number | undefined,
    ) => {
        setFields(prev => ({ ...prev, [key]: { fieldValue, parsedValue } }));

        if (exclusionState.preview && parsedValue !== undefined) {
            exclusionState.updatePreview({
                ...exclusionState.preview,
                [key]: parsedValue,
            });
        }
    };

    const fmt = (n: number) => parseFloat(n.toFixed(4));

    const { x_min: xv, y_min: yv, width: wv, height: hv } = {
        x_min: fields.x_min.parsedValue,
        y_min: fields.y_min.parsedValue,
        width:  fields.width.parsedValue,
        height: fields.height.parsedValue,
    };

    const errors = {
        x_min: xv === undefined
            ? 'Please enter a valid number.'
            : xv < 0
                ? 'Must be non-negative.'
                : xv > boardWidth
                    ? `Must not exceed board width.`
                    : undefined,

        y_min: yv === undefined
            ? 'Please enter a valid number.'
            : yv < 0
                ? 'Must be non-negative.'
                : yv > boardHeight
                    ? `Must not exceed board height.`
                    : undefined,

        width: wv === undefined
            ? 'Please enter a valid number.'
            : wv <= 0
                ? 'Must be greater than 0.'
                : xv !== undefined && fmt(xv + wv) > boardWidth
                    ? `X + Width exceeds board width.`
                    : undefined,

        height: hv === undefined
            ? 'Please enter a valid number.'
            : hv <= 0
                ? 'Must be greater than 0.'
                : yv !== undefined && fmt(yv + hv) > boardHeight
                    ? `Y + Height exceeds board height.`
                    : undefined,
    };

    const allValid = Object.values(errors).every(e => e === undefined);

    return (
        <Box
            padding={2}
            sx={{
                borderRadius: theme.radius.sm,
                border: '1px solid',
                borderColor: theme.vars.palette.background.level3,
                boxShadow: `0px 2px ${theme.vars.palette.background.level2}`,
                backgroundColor: theme.vars.palette.background.popup,
            }}
        >
            <Stack
                direction="column"
                spacing={4}
                useFlexGap
                alignItems='center'
            >
                <Stack direction="row" spacing={4} flexWrap='wrap' useFlexGap>
                    <Stack direction="row" spacing={4} flexGrow={1} flexWrap='wrap' useFlexGap>
                        <MicrometerInput
                            label="X (Lower Left Corner)"
                            placeholder="0.0"
                            value={fields.x_min.fieldValue}
                            error={errors.x_min}
                            onChange={(fv, pv) => updateField('x_min', fv, pv)}
                        />
                        <MicrometerInput
                            label="Y (Lower Left Corner)"
                            placeholder="0.0"
                            value={fields.y_min.fieldValue}
                            error={errors.y_min}
                            onChange={(fv, pv) => updateField('y_min', fv, pv)}
                        />
                    </Stack>
                    <Stack direction="row" spacing={4} flexGrow={1} flexWrap='wrap' useFlexGap>
                        <MicrometerInput
                            label="Width"
                            placeholder="1.0"
                            value={fields.width.fieldValue}
                            error={errors.width}
                            onChange={(fv, pv) => updateField('width', fv, pv)}
                        />
                        <MicrometerInput
                            label="Height"
                            placeholder="1.0"
                            value={fields.height.fieldValue}
                            error={errors.height}
                            onChange={(fv, pv) => updateField('height', fv, pv)}
                        />
                    </Stack>
                </Stack>

                <Stack
                    direction="row"
                    spacing={4}
                    flexWrap='wrap'
                    useFlexGap
                >
                    <Button
                        disabled={!exclusionState.preview || !allValid}
                        onClick={_ => {
                            exclusionState.acceptPreview();
                        }}
                    >
                        <Typography sx={{ color: theme.vars.palette.common.white }}>
                            <CheckIcon sx={{
                                verticalAlign: 'bottom',
                            }} /> Save</Typography>
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={_ => {
                            exclusionState.discardPreview();
                        }}
                    >
                        <Typography>
                            <ClearIcon sx={{
                                verticalAlign: 'bottom',
                            }} /> Discard</Typography>
                    </Button>

                    {exclusionState.preview && (
                        <Button
                            variant='outlined'
                            color="danger"
                            onClick={_ => {
                                if (exclusionState.preview) {
                                    exclusionState.removeExclusion(exclusionState.preview.id);
                                }
                            }}
                        >
                            <Typography>
                                <DeleteOutlineIcon sx={{
                                    verticalAlign: 'bottom',
                                }} /> Delete</Typography>
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
}
