import { Box, Button, FormControl, FormLabel, Input, Stack, Typography, useTheme } from "@mui/joy";
import { ExclusionStateHandle } from "../hooks/useExclusionState";
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

type Props = {
    exclusionState: ExclusionStateHandle;
};

export function ExclusionZoneEditor({ exclusionState }: Props) {
    const theme = useTheme();

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
                <Stack
                    direction="row"
                    spacing={4}
                    flexWrap='wrap'
                    useFlexGap
                >
                    <FormControl>
                        <FormLabel htmlFor="xMin">X (lower-left)</FormLabel>
                        <Input
                            value={exclusionState.preview?.x_min ?? ''}
                            placeholder={'0.0'}
                            id="xMin"
                            onChange={e => {
                                if (exclusionState.preview) {
                                    exclusionState.updatePreview({
                                        ...exclusionState.preview,
                                        x_min: parseFloat(e.target.value),
                                    });
                                }
                            }}
                            sx={{
                                '& input': { textAlign: 'center' },
                                width: '10em',
                            }}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel htmlFor="yMin">Y (lower-left)</FormLabel>
                        <Input
                            value={exclusionState.preview?.y_min ?? ''}
                            placeholder={'0.0'}
                            id="yMin"
                            onChange={e => {
                                if (exclusionState.preview) {
                                    exclusionState.updatePreview({
                                        ...exclusionState.preview,
                                        y_min: parseFloat(e.target.value),
                                    });
                                }
                            }}
                            sx={{
                                '& input': { textAlign: 'center' },
                                width: '10em',
                            }}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel htmlFor="width">Width</FormLabel>
                        <Input
                            value={exclusionState.preview?.width ?? ''}
                            placeholder={'1.0'}
                            id="width"
                            onChange={e => {
                                if (exclusionState.preview) {
                                    exclusionState.updatePreview({
                                        ...exclusionState.preview,
                                        width: parseFloat(e.target.value),
                                    });
                                }
                            }}
                            sx={{
                                '& input': { textAlign: 'center' },
                                width: '10em',
                            }}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel htmlFor="height">Height</FormLabel>
                        <Input
                            value={exclusionState.preview?.height ?? ''}
                            placeholder={'1.0'}
                            id="height"
                            onChange={e => {
                                if (exclusionState.preview) {
                                    exclusionState.updatePreview({
                                        ...exclusionState.preview,
                                        height: parseFloat(e.target.value),
                                    });
                                }
                            }}
                            sx={{
                                '& input': { textAlign: 'center' },
                                width: '10em',
                            }}
                        />
                    </FormControl>
                </Stack>

                <Stack
                    direction="row"
                    spacing={4}
                    flexWrap='wrap'
                    useFlexGap
                >
                    <Button
                        disabled={!exclusionState.preview}
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
