import { Box, Button, FormControl, FormHelperText, FormLabel, Input, Typography, useTheme } from "@mui/joy";
import { Port, portIndexToString, PortKey, portStringToIndex } from "../utils/ports";
import { useEffect, useId, useState } from "react";
import { BoardEdit } from "../BoardUI";
import AddIcon from '@mui/icons-material/Add';

export function AddConnection(props: {
    boardEdit: BoardEdit
    setBoardEdit: (f: ((e: BoardEdit) => BoardEdit) | BoardEdit) => void
    portIsInRange: (port: PortKey) => boolean
    portIsFree: (port: PortKey) => boolean
    onAdd: (from: PortKey, to: PortKey) => void
}) {

    const theme = useTheme()

    const [startPort, setStartPort] = useState<PortKey | undefined>()
    const [startPortError, setStartPortError] = useState<string | undefined>()

    const [endPort, setEndPort] = useState<PortKey | undefined>()
    const [endPortError, setEndPortError] = useState<string | undefined>()

    useEffect(() => {

    }, [startPort, endPort])

    const canAdd = startPort === undefined || endPort === undefined

    return <Box>
        <PortInput
            label={"Start"}
            onChange={(portKey) => {
                setStartPort(undefined)
                if (portKey !== undefined) {
                    if (!props.portIsInRange(portKey)) {
                        setStartPortError('Port is out of bounds.')
                    } else if (!props.portIsFree(portKey)) {
                        setStartPortError('Port is already taken.')
                    } else {
                        setStartPortError(undefined)
                        setStartPort(portKey)
                    }
                }
            }}
            error={startPortError}
            value={startPort}
        ></PortInput>

        <PortInput
            label={"End"}
            onChange={(portKey) => {
                setEndPort(undefined)
                if (portKey !== undefined) {
                    if (!props.portIsInRange(portKey)) {
                        setEndPortError('Port is out of bounds.')
                    } else if (!props.portIsFree(portKey)) {
                        setEndPortError('Port is already taken.')
                    } else {
                        setEndPortError(undefined)
                        setEndPort(portKey)
                    }
                }
            }}
            error={endPortError}
            value={endPort}
        ></PortInput>

        <Button
            disabled={canAdd}
            onClick={_ => {
                if (startPort !== undefined && endPort !== undefined) {
                    props.onAdd(startPort, endPort)
                }
            }}
            sx={{
                margin: 1,
                marginX: 2,
            }}
        >
            <Typography sx={{ color: theme.vars.palette.common.white }}>
                <AddIcon sx={{
                    verticalAlign: 'bottom'
                }} /> Add</Typography>
        </Button>
    </Box>
}

export function PortInput(props: {
    label?: string
    value?: PortKey
    error?: string
    onChange?: (port: PortKey | undefined) => void
}) {
    const [value, setValue] = useState<string | undefined>()

    useEffect(() => {
        if (props.value !== undefined) {
            const str = portIndexToString(props.value)
            if (str !== undefined) {
                setValue(str)
            }
            setValue(undefined)
        } else {
            setValue(undefined)
        }
    }, [props.value])

    const [error, setError] = useState<string | undefined>(undefined)

    useEffect(() => {
        setError(props.error)
    }, [props.error])

    const id = useId()
    return <FormControl {...(error !== undefined ? { error: true } : {})}
        sx={{
            marginTop: '1em',
            marginBottom: '1em'
        }}
    >
        <FormLabel htmlFor={id}>{props.label}</FormLabel>
        <Input
            value={value}
            placeholder={'A1, C12,'}
            id={id}
            onChange={e => {
                const index = portStringToIndex(e.target.value)
                if (index === undefined) {
                    setError('Invalid port name.')
                } else {
                    setError(undefined)
                }
                props.onChange?.(index as PortKey | undefined)
            }}
            sx={{
                '& input':
                    { textAlign: 'center' },
                width: 150
            }}
        />
        {error &&
            <FormHelperText>
                {error}
            </FormHelperText>
        }
    </FormControl>
}