import { FormControl, FormHelperText, FormLabel, Input } from "@mui/joy"
import { useId } from "react"
import InfoOutlined from '@mui/icons-material/InfoOutlined';

export type MicrometerProps = {
    label?: string
    description?: string
    defaultValue?: number | undefined
    value?: number | undefined
    error?: string | undefined
    placeholder?: string | undefined
    onChange?: (v: number | undefined) => void
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
                type="number"
                defaultValue={props.defaultValue}
                value={(props.value === 0 ? '0' : props.value) ?? ''}
                placeholder={props.placeholder ?? props.label}
                endDecorator="μm"
                id={id}
                onChange={e => {
                    const v = parseInt(e.target.value)
                    props.onChange?.(!Number.isSafeInteger(v) ? undefined : v)
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