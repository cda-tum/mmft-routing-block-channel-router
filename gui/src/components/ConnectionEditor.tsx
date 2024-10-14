import { Button, FormControl, FormHelperText, FormLabel, Input, Typography, useTheme } from "@mui/joy";
import { useId } from "react";
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import { PortField, useConnectionState } from "../hooks/useConnectionState";

const minPorts = 2;
const maxPorts = 2;

export function ConnectionEditor(props: {
    connectionState: ReturnType<typeof useConnectionState>
}) {
    const theme = useTheme()

    return <>
        {
            props.connectionState.preview.ports.map((port, i) => <PortInput
                connectionState={props.connectionState}
                port={port}
                index={i}
            />)
        }

        <Button
            disabled={maxPorts !== undefined && props.connectionState.preview.ports.length >= maxPorts}
            onClick={_ => {
                props.connectionState.preview.addPort()
            }}
            sx={{
                margin: 1,
            }}
        >
            <Typography sx={{ color: theme.vars.palette.common.white }}>
                <AddIcon sx={{
                    verticalAlign: 'bottom'
                }} /> Add Port</Typography>
        </Button>

        <Button
            disabled={!props.connectionState.preview.isValid()}
            onClick={_ => {
                props.connectionState.preview.acceptPreview()
            }}
            sx={{
                margin: 1,
            }}
        >
            <Typography sx={{ color: theme.vars.palette.common.white }}>
                <AddIcon sx={{
                    verticalAlign: 'bottom'
                }} /> Save Connection</Typography>
        </Button>
    </>
}

export function PortInput(props: {
    port: PortField
    index: number
    connectionState: ReturnType<typeof useConnectionState>
}) {
    const id = useId()

    return <FormControl {...(props.port.error !== undefined ? { error: true } : {})}
        sx={{
            marginTop: '1em',
            marginBottom: '1em'
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
                    onClick={_ => {
                        props.connectionState.preview.removePort(props.index)
                    }}
                ><ClearIcon /></Button>
            } : {})}
        />
        {props.port.error !== undefined &&
            <FormHelperText>
                {props.port.error}
            </FormHelperText>
        }
    </FormControl>
}