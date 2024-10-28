import { FormControl, FormLabel, Radio, radioClasses, RadioGroup, Sheet } from "@mui/joy";
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { RectilinearIcon } from "../icons/RectilinearIcon";
import { OctilinearIcon } from "../icons/OctilinearIcon";
import { useId } from "react";

export type LayoutChoiceProps = {
    layout: string | undefined
    onChange: (e: string) => void
}

export function LayoutChoice(props: LayoutChoiceProps) {
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
        <FormLabel htmlFor={id}>Layout</FormLabel>
        <RadioGroup
            id={id}
            aria-label="layout"
            defaultValue={props.layout}
            value={props.layout}
            overlay
            name="layout"
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
                key={'Rectilinear'}
                variant="outlined"
                sx={sheetShared}
            >
                <Radio id={'Rectilinear'} value={'Rectilinear'} checkedIcon={<CheckCircleRoundedIcon />} />
                <RectilinearIcon></RectilinearIcon>
                <FormLabel htmlFor={'Rectilinear'} sx={labelShared}>Rectilinear</FormLabel>
            </Sheet>

            <Sheet
                key={'Octilinear'}
                variant="outlined"
                sx={sheetShared}
            >
                <Radio id={'Octilinear'} value={'Octilinear'} checkedIcon={<CheckCircleRoundedIcon />} />
                <OctilinearIcon></OctilinearIcon>
                <FormLabel htmlFor={'Octilinear'} sx={labelShared}>Octilinear</FormLabel>
            </Sheet>
        </RadioGroup>
    </FormControl>
}

/* Not fully supported in backend
<Sheet
    key={'Mixed'}
    variant="outlined"
    sx={{
        borderRadius: 'md',

        boxShadow: 'sm',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        p: 2,
        minWidth: 120,
    }}
>
    <Radio id={'Mixed'} value={'Mixed'} checkedIcon={<CheckCircleRoundedIcon />} />
    <MixedIcon></MixedIcon>
    <FormLabel htmlFor={'Mixed'}>Mixed</FormLabel>
</Sheet>*/
