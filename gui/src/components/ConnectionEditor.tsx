import { Button, FormControl, FormHelperText, FormLabel, Input, Stack, Typography, useTheme } from "@mui/joy";
import { useId } from "react";
import AddIcon from '@mui/icons-material/Add';
import { PortField, useConnectionState } from "../hooks/useConnectionState";
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const minPorts: number = 2;
const maxPorts: number = 2;

export function ConnectionEditor(props: {
    connectionState: ReturnType<typeof useConnectionState>
}) {
    const theme = useTheme()

    const isExistingConnection = props.connectionState.hasConnection(props.connectionState.preview.connection) !== undefined

    return <Stack
        direction="row"
        spacing={4}
        flexWrap='wrap'
        useFlexGap
        marginY={4}
        alignItems='center'
    >
        {
            props.connectionState.preview.ports.map((port, i) => <PortInput
                connectionState={props.connectionState}
                port={port}
                index={i}
            />)
        }

        {
            minPorts !== maxPorts &&
            <Button
                disabled={maxPorts !== undefined && props.connectionState.preview.ports.length >= maxPorts}
                onClick={_ => {
                    props.connectionState.preview.addPort()
                }}
            >
                <Typography sx={{ color: theme.vars.palette.common.white }}>
                    <AddIcon sx={{
                        verticalAlign: 'bottom'
                    }} /> Add Port</Typography>
            </Button>
        }

        <Button
            variant="outlined"
            onClick={_ => {
                props.connectionState.preview.setActive(false)
            }}
        >
            <Typography sx={{ color: theme.vars.palette.common.white }}>
                <ClearIcon sx={{
                    verticalAlign: 'bottom'
                }} /> Discard {isExistingConnection ? 'Changes' : ''}</Typography>
        </Button>

        <Button
            disabled={!props.connectionState.preview.isValid()}
            onClick={_ => {
                props.connectionState.preview.acceptPreview()
            }}
        >
            <Typography sx={{ color: theme.vars.palette.common.white }}>
                <CheckIcon sx={{
                    verticalAlign: 'bottom'
                }} /> Save {isExistingConnection ? 'Changes' : ''}</Typography>
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
                <Typography sx={{ color: theme.vars.palette.common.white }}>
                    <DeleteOutlineIcon sx={{
                        verticalAlign: 'bottom'
                    }} /> Remove </Typography>
            </Button>
        }
    </Stack>
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