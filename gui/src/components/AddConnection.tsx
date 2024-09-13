import { Box, FormControl, FormHelperText, FormLabel, Input } from "@mui/joy";
import { Port, portIndexToString, PortKey, portStringToIndex } from "../utils/ports";
import { useEffect, useId, useState } from "react";
import { BoardEdit } from "../BoardUI";

export function AddConnection(props: {
    boardEdit: BoardEdit
    portIsInRange: (port: PortKey) => boolean
    portIsFree: (port: PortKey) => boolean
    onAdd: (from: Port, to: Port) => void
}) {

    const [startPort, setStartPort] = useState<PortKey | undefined>()
    const [startPortError, setStartPortError] = useState<string | undefined>()

    const [endPort, setEndPort] = useState<PortKey | undefined>()
    const [endPortError, setEndPortError] = useState<string | undefined>()

    const [startIsFirst, setStartIsFirst] = useState<boolean>(true)

    return <Box>
        <PortInput
            label={"Start"}
            onChange={(portKey) => {
                setStartPort(undefined)
                if (!props.portIsInRange(portKey)) {
                    setStartPortError('Port is out of bounds.')
                } else if (!props.portIsFree(portKey)) {
                    setStartPortError('Port is already taken.')
                } else {
                    setStartPortError(undefined)
                    setStartPort(portKey)
                }
            }}
            error={startPortError}
            value={startPort}
        ></PortInput>

        <PortInput
            label={"End"}
            onChange={(portKey) => {
                setEndPort(undefined)
                if (!props.portIsInRange(portKey)) {
                    setEndPortError('Port is out of bounds.')
                } else if (!props.portIsFree(portKey)) {
                    setEndPortError('Port is already taken.')
                } else {
                    setEndPortError(undefined)
                    setEndPort(portKey)
                }
            }}
            error={endPortError}
            value={endPort}
        ></PortInput>
    </Box>
}

export function PortInput(props: {
    label?: string
    value?: PortKey
    error?: string
    onChange?: (port: PortKey) => void
}) {
    const [value, setValue] = useState<string | undefined>()

    useEffect(() => {
        if(props.value !== undefined) {
            const str = portIndexToString(props.value)
            if(str !== undefined) {
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
                    props.onChange?.(index as PortKey)
                }
            }}
            sx={{
                '& input':
                    { textAlign: 'center' }
            }}
        />
        {error &&
            <FormHelperText>
                {error}
            </FormHelperText>
        }
    </FormControl>
}