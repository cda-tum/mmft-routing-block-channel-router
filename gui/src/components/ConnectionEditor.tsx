import { Box, Button, FormControl, FormHelperText, FormLabel, Input, Stack, Tooltip, Typography, useTheme } from "@mui/joy";
import { useId } from "react";
import { PortField, useConnectionState } from "../hooks/useConnectionState";
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export const minPorts: number = 2;
export const maxPorts: number = 4;

export function ConnectionEditor(props: {
    connectionState: ReturnType<typeof useConnectionState>
}) {
    const theme = useTheme()

    const isExistingConnection = props.connectionState.hasConnection(props.connectionState.preview.connection) !== undefined

    const canAddPorts = !(maxPorts !== undefined && props.connectionState.preview.ports.length >= maxPorts)
    const canSave = props.connectionState.preview.isValid()

    return <Box
        padding={2}
        sx={{
            borderRadius: theme.radius.sm,
            border: '1px solid',
            borderColor: theme.vars.palette.background.level3,
            boxShadow: `0px 2px ${theme.vars.palette.background.level2}`,
            backgroundColor: theme.vars.palette.background.popup
        }}
    ><Stack
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
                {
                    props.connectionState.preview.ports.map((port, i) => <PortInput
                        connectionState={props.connectionState}
                        port={port}
                        index={i}
                    />)
                }

            </Stack>

            <Stack
                direction="row"
                spacing={4}
                flexWrap='wrap'
                useFlexGap
            >
                {canSave ?
                    <Button
                        disabled={!canSave}
                        onClick={_ => {
                            props.connectionState.preview.acceptPreview()
                        }}
                    >
                        <Typography sx={{ color: theme.vars.palette.common.white }}>
                            <CheckIcon sx={{
                                verticalAlign: 'bottom'
                            }} /> Save {isExistingConnection ? 'Changes' : ''}</Typography>
                    </Button> : <Tooltip title="Errors must be fixed before saving is possible." variant="solid"><span><Button
                        disabled={!canSave}
                        onClick={_ => {
                            props.connectionState.preview.acceptPreview()
                        }}
                    >
                        <Typography sx={{ color: theme.vars.palette.common.white }}>
                            <CheckIcon sx={{
                                verticalAlign: 'bottom'
                            }} /> Save {isExistingConnection ? 'Changes' : ''}</Typography>
                    </Button></span></Tooltip>
                }

                {
                    minPorts !== maxPorts &&
                        canAddPorts ? <Button
                            disabled={!canAddPorts}
                            onClick={_ => {
                                props.connectionState.preview.addPort()
                            }}
                            variant="outlined"
                        >
                        <Typography sx={maxPorts !== undefined && props.connectionState.preview.ports.length >= maxPorts ? { color: theme.vars.palette.common.white } : {}}>
                            <AddCircleOutlineIcon sx={{
                                verticalAlign: 'bottom'
                            }} /> Port</Typography>
                    </Button> : <Tooltip title="The maximum number of ports is reached." variant="solid"><span><Button
                        disabled={!canAddPorts}
                        onClick={_ => {
                            props.connectionState.preview.addPort()
                        }}
                        variant="outlined"
                    >
                        <Typography sx={maxPorts !== undefined && props.connectionState.preview.ports.length >= maxPorts ? { color: theme.vars.palette.common.white } : {}}>
                            <AddCircleOutlineIcon sx={{
                                verticalAlign: 'bottom'
                            }} /> Port</Typography>
                    </Button></span></Tooltip>
                }

                <Button
                    variant="outlined"
                    onClick={_ => {
                        props.connectionState.preview.setActive(false)
                    }}
                >
                    <Typography>
                        <ClearIcon sx={{
                            verticalAlign: 'bottom'
                        }} /> Discard {isExistingConnection ? 'Changes' : ''}</Typography>
                </Button>

                {isExistingConnection &&
                    <Button
                        variant='outlined'
                        color="danger"
                        onClick={_ => {
                            props.connectionState.removeConnection(props.connectionState.preview.connection)
                            props.connectionState.preview.setActive(false)
                        }}
                    >
                        <Typography>
                            <DeleteOutlineIcon sx={{
                                verticalAlign: 'bottom'
                            }} /> Delete</Typography>
                    </Button>
                }
            </Stack>
        </Stack></Box>
}

export function PortInput(props: {
    port: PortField
    index: number
    connectionState: ReturnType<typeof useConnectionState>
}) {
    const id = useId()

    return <FormControl {...(props.port.error !== undefined ? { error: true } : {})}
        sx={{

        }}
    >
        <FormLabel htmlFor={id}>Port</FormLabel>
        <Input
            value={props.port.fieldValue}
            placeholder={'A1, C12, ...'}
            id={id}
            onChange={e => {
                props.connectionState.preview.updatePort(props.index, e.target.value)
            }}
            sx={{
                '& input':
                    { textAlign: 'center' },
                width: '10em'
            }}
            {...(props.connectionState.preview.ports.length > minPorts ? {
                endDecorator: <Button
                    variant='outlined'
                    color="danger"
                    onClick={_ => {
                        props.connectionState.preview.removePort(props.index)
                    }}
                ><DeleteOutlineIcon /></Button>
            } : {})}
        />
        {props.port.error !== undefined &&
            <FormHelperText>
                {props.port.error}
            </FormHelperText>
        }
    </FormControl>
}