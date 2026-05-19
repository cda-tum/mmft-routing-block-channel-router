import { FormControl, FormLabel, Radio, radioClasses, RadioGroup, Sheet } from "@mui/joy";
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { StarterPlatformIcon } from "../icons/StarterPlatformIcon";
import { NoneIcon } from "../icons/NoneIcon";
import { useId } from "react";

export type TemplateChoiceProps = {
    template: string | undefined
    onChange: (e: string) => void
}

export function TemplateChoice(props: TemplateChoiceProps) {
    const sheetShared = {
        width: '5em',
        minWidth: '6em',
        padding: '1em',
        borderRadius: 'md',
        boxShadow: 'sm',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
    }

    const labelShared = {
        m: 0,
        margin: 'auto'
    }

    const id = useId()
    return <FormControl
        sx={{
            marginTop: '1em',
            marginBottom: '1em',
            flexGrow: 1,
        }}
    >
        <FormLabel htmlFor={id}>Template</FormLabel>
        <RadioGroup
            id={id}
            aria-label="template"
            defaultValue={props.template}
            value={props.template}
            overlay
            name="template"
            onChange={e => props.onChange(e.target.value)}
            sx={{
                margin: 0,
                flexDirection: 'row',
                gap: 2,
                [`& .${radioClasses.checked}`]: {
                    [`& .${radioClasses.action}`]: {
                        inset: -1,
                        border: '3px solid',
                        borderColor: 'primary.500',
                    },
                },
                [`& .${radioClasses.radio}`]: {
                    display: 'contents',
                    '& > svg': {
                        zIndex: 2,
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        bgcolor: 'background.surface',
                        borderRadius: '50%',
                    },
                },
            }}
        >
            
            <Sheet
                key={'NoTemplate'}
                variant="outlined"
                sx={sheetShared}
            >
                <Radio id={'NoTemplate'} value={'NoTemplate'} checkedIcon={<CheckCircleRoundedIcon />} />
                <NoneIcon></NoneIcon>
                <FormLabel htmlFor={'NoTemplate'} sx={labelShared}>No template</FormLabel>
            </Sheet>

            <Sheet
                key={'STARTER'}
                variant="outlined"
                sx={sheetShared}
            >
                <Radio id={'STARTER'} value={'STARTER'} checkedIcon={<CheckCircleRoundedIcon />} />
                <StarterPlatformIcon></StarterPlatformIcon>
                <FormLabel htmlFor={'STARTER'} sx={labelShared}>STARTER platform</FormLabel>
            </Sheet>
        </RadioGroup>
    </FormControl>
}
