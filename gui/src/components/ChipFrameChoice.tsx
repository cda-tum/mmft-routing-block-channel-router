import { FormControl, FormLabel, Radio, radioClasses, RadioGroup, Sheet } from "@mui/joy";
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useId } from "react";
import {LargeChipFrameIcon} from "../icons/LargeChipFrameIcon.tsx";
import {LargeBoardIconNoFrame} from "../icons/LargeBoardIconNoFrame.tsx";

export type ChipFrameChoiceProps = {
    chipFrame: string | undefined
    onChange: (e: string) => void
}

export function ChipFrameChoice(props: ChipFrameChoiceProps) {
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
        <FormLabel htmlFor={id}>Frame Around Board</FormLabel>
        <RadioGroup
            id={id}
            aria-label="chipFrame"
            defaultValue={props.chipFrame}
            value={props.chipFrame}
            overlay
            name="chipFrame"
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
                key={'WithFrame'}
                variant="outlined"
                sx={sheetShared}
            >
                <Radio id={'WithFrame'} value={'WithFrame'} checkedIcon={<CheckCircleRoundedIcon />} />
                <LargeChipFrameIcon></LargeChipFrameIcon>
                <FormLabel htmlFor={'WithFrame'} sx={labelShared}>With Frame</FormLabel>
            </Sheet>

            <Sheet
                key={'NoFrame'}
                variant="outlined"
                sx={sheetShared}
            >
                <Radio id={'NoFrame'} value={'NoFrame'} checkedIcon={<CheckCircleRoundedIcon />} />
                <LargeBoardIconNoFrame></LargeBoardIconNoFrame>
                <FormLabel htmlFor={'NoFrame'} sx={labelShared}>No Frame</FormLabel>
            </Sheet>
        </RadioGroup>
    </FormControl>
}

