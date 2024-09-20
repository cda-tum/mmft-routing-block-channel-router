import { FormControl, FormHelperText, FormLabel, Input } from "@mui/joy"
import { useId } from "react"
import InfoOutlined from '@mui/icons-material/InfoOutlined';

export type MicrometerProps = {
    label?: string
    description?: string
    defaultValue?: string | undefined
    value?: string | undefined
    error?: string | undefined
    placeholder?: string | undefined
    onChange?: (fieldValue: string, parsedValue: number | undefined) => void
}

export function MicrometerInput(props: MicrometerProps) {
    const id = useId()
    return (
        <FormControl {...(props.error !== undefined ? { error: true } : {})}
            sx={{
                marginTop: '1em',
                marginBottom: '1em'
            }}
        >
            {props.label &&
                <FormLabel htmlFor={id}>{props.label}</FormLabel>
            }
            <Input
                defaultValue={props.defaultValue}
                value={props.value}
                placeholder={props.placeholder ?? props.label}
                endDecorator="μm"
                id={id}
                onChange={e => {
                    const value = e.target.value
                    const isNumber = parseFloat(value).toString() === value && Number.isSafeInteger(parseFloat(value))
                    const i = parseFloat(value)
                    props.onChange?.(value, isNumber ? i : undefined)
                }}
                sx={{
                    '& input':
                        { textAlign: 'right' }
                }}
            />
            {props.description && !props.error &&
                <FormHelperText>{props.description}</FormHelperText>
            }
            {props.error &&
                <FormHelperText>
                    <InfoOutlined />
                    {props.error}
                </FormHelperText>
            }
        </FormControl>
    )
}
