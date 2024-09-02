import { FormLabel, Radio, radioClasses, RadioGroup, Sheet } from "@mui/joy";
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { RectilinearIcon } from "../icons/RectilinearIcon";
import { OctilinearIcon } from "../icons/OctilinearIcon";
import { MixedIcon } from "../icons/MixedIcon";

export type LayoutChoiceProps = {
    layout: string | undefined
    onChange: (e: string) => void
}

export function LayoutChoice(props: LayoutChoiceProps) {
    return <RadioGroup
        aria-label="platform"
        defaultValue={props.layout}
        value={props.layout}
        overlay
        name="layout"
        onChange={e => props.onChange(e.target.value)}
        sx={{
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
        </Sheet>
        <Sheet
            key={'Rectilinear'}
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
            <Radio id={'Rectilinear'} value={'Rectilinear'} checkedIcon={<CheckCircleRoundedIcon />} />
            <RectilinearIcon></RectilinearIcon>
            <FormLabel htmlFor={'Rectilinear'}>Rectilinear</FormLabel>
        </Sheet>

        <Sheet
            key={'Octilinear'}
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
            <Radio id={'Octilinear'} value={'Octilinear'} checkedIcon={<CheckCircleRoundedIcon />} />
            <OctilinearIcon></OctilinearIcon>
            <FormLabel htmlFor={'Octilinear'}>Octilinear</FormLabel>
        </Sheet>
    </RadioGroup>
}