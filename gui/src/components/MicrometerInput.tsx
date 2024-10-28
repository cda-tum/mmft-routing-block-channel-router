import { Autocomplete, Box, FormControl, FormHelperText, FormLabel, Input } from "@mui/joy"
import { ReactNode, useId, useState } from "react"
import InfoOutlined from '@mui/icons-material/InfoOutlined';

export type MicrometerProps = {
    label?: string
    description?: string
    defaultValue?: string | undefined
    value?: string | undefined
    error?: string | undefined
    placeholder?: string | undefined
    autocompleteValues?: undefined | number[]
    explainIcon?: undefined | ReactNode
    onChange?: (fieldValue: string, parsedValue: number | undefined) => void
}

export function MicrometerInput(props: MicrometerProps) {
    const id = useId()

    const minWidth = '16em'

    const shared = {
        value: props.value,
        placeholder: props.placeholder ?? props.label,
        id,
        defaultValue: props.defaultValue,
        sx: {
            '& input':
            {
                textAlign: 'right',
            },
            minWidth,
        },
        startDecorator: <Box sx={{ width: '3em', height: '3em', margin: 1 }}>{props.explainIcon}</Box>,
        endDecorator: "μm",
    }

    const field = props.autocompleteValues !== undefined ? <Autocomplete
        freeSolo={true}
        disableClearable={true}
        options={props.autocompleteValues.map(o => o.toString())}
        inputValue={props.value}
        {...shared}
        onInputChange={(_, value) => {
            if (value !== null) {
                const isNumber = parseFloat(value).toString() === value && Number.isSafeInteger(parseFloat(value))
                const i = parseFloat(value)
                props.onChange?.(value, isNumber ? i : undefined)
            }
        }}
    /> : <Input
        {...shared}
        onChange={e => {
            const value = e.target.value
            const isNumber = parseFloat(value).toString() === value && Number.isSafeInteger(parseFloat(value))
            const i = parseFloat(value)
            props.onChange?.(value, isNumber ? i : undefined)
        }}
        style={{ flexGrow: 1 }}
    />
    return (
        <FormControl {...(props.error !== undefined ? { error: true } : {})}
            sx={{
                marginTop: '1em',
                marginBottom: '1em',
                flexGrow: 1
            }}
        >
            {props.label &&
                <FormLabel htmlFor={id}>{props.label}</FormLabel>
            }
            {field}
            {props.description && !props.error &&
                <FormHelperText
                    sx={{
                        minWidth
                    }}
                >{props.description}</FormHelperText>
            }
            {props.error &&
                <FormHelperText
                    sx={{
                        minWidth
                    }}
                >
                    <InfoOutlined />
                    {props.error}
                </FormHelperText>
            }
        </FormControl>
    )
}
