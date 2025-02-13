import { Autocomplete, Box, FormControl, FormHelperText, FormLabel, Input } from "@mui/joy"
import { ReactNode, useId } from "react"
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { SxProps } from "@mui/joy/styles/types";

export type MicrometerProps = {
    label?: string
    description?: string
    defaultValue?: string | undefined
    value?: string | undefined
    error?: string | undefined
    warning?: string | undefined
    placeholder?: string | undefined
    autocompleteValues?: undefined | number[]
    explainIcon?: undefined | ReactNode
    sx?: SxProps
    marginY?: string | number
    onChange?: (fieldValue: string, parsedValue: number | undefined) => void
}

export function MicrometerInput(props: MicrometerProps) {
    const id = useId()

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
            ...props.sx
        },
        startDecorator: props.explainIcon ? <Box sx={{ width: '3em', height: '3em', margin: 1 }}>{props.explainIcon}</Box> : undefined,
        endDecorator: "mm",
    }

    const field = props.autocompleteValues !== undefined ? <Autocomplete
        freeSolo={true}
        disableClearable={true}
        options={props.autocompleteValues.map(o => o.toString())}
        inputValue={props.value}
        {...shared}
        onInputChange={(_, value) => {
            if (value !== null) {
                const i = parseFloat(value)
                props.onChange?.(value, i)
            }
        }}
    /> : <Input
        {...shared}
        onChange={e => {
            const value = e.target.value
            const i = parseFloat(value)
            props.onChange?.(value, i)
        }}
        style={{ flexGrow: 1 }}
    />
    return (
        <FormControl {...(props.error !== undefined ? { error: true } : {})}
            sx={{
                marginY: props.marginY ?? 2,
                flexGrow: 1
            }}
            color={props.warning ? 'warning' : undefined}
        >
            {props.label &&
                <FormLabel htmlFor={id}>{props.label}</FormLabel>
            }
            {field}
            {props.description && !props.error && !props.warning &&
                <FormHelperText
                    sx={{
                        marginX: 0
                    }}
                >{props.description}</FormHelperText>
            }
            {props.error &&
                <FormHelperText
                    sx={{
                        marginX: 0
                    }}
                >
                    <InfoOutlined />
                    {props.error}
                </FormHelperText>
            }
            {props.warning &&
                <FormHelperText
                    sx={{
                        marginX: 0
                    }}
                >
                    <InfoOutlined color='warning'/>
                    {props.warning}
                </FormHelperText>
            }
        </FormControl>
    )
}
