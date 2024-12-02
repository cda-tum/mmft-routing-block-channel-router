import { FormControl, FormLabel, Radio, radioClasses, RadioGroup, Sheet } from "@mui/joy";
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { RectilinearIcon } from "../icons/RectilinearIcon";
import { OctilinearIcon } from "../icons/OctilinearIcon";
import { useId } from "react";
import { MicrometerInput } from "./MicrometerInput";
import { InputParameterValues, Value } from "../utils/input-parameters";
import { ChannelCapButtIcon } from "../icons/ChannelCapButtIcon";
import { ChannelCapSquareIcon } from "../icons/ChannelCapSquareIcon";
import { ChannelCapCustomIcon } from "../icons/ChannelCapCustomIcon";

export type OutputChannelCapChoiceProps = {
    channelCap: string | undefined
    channelCapCustom: Value<InputParameterValues['channelCapCustom']>
    onChangeChannelCap: (e: string) => void
    onChangeChannelCapCustom: (fieldValue: string, parsedValue: number | undefined) => void
}

export function OutputChannelCapChoice(props: OutputChannelCapChoiceProps) {
    const sheetShared = {
        //width: '5em',
        //minWidth: '6em',
        padding: '1em',
        borderRadius: 'md',
        boxShadow: 'sm',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        flexShrink: 1,
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
        <FormLabel htmlFor={id}>Channel Cap</FormLabel>
        <RadioGroup
            id={id}
            aria-label="channelCap"
            defaultValue={props.channelCap}
            value={props.channelCap}
            overlay
            name="channelCap"
            onChange={e => props.onChangeChannelCap(e.target.value)}
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
                key={'Butt'}
                variant="outlined"
                sx={sheetShared}
            >
                <Radio id={'Butt'} value={'Butt'} checkedIcon={<CheckCircleRoundedIcon />} />
                <ChannelCapButtIcon/>
                <FormLabel htmlFor={'Butt'} sx={labelShared}>Butt</FormLabel>
            </Sheet>

            <Sheet
                key={'Square'}
                variant="outlined"
                sx={sheetShared}
            >
                <Radio id={'Square'} value={'Square'} checkedIcon={<CheckCircleRoundedIcon />} />
                <ChannelCapSquareIcon/>
                <FormLabel htmlFor={'Square'} sx={labelShared}>Square</FormLabel>
            </Sheet>

            <Sheet
                key={'Custom'}
                variant="outlined"
                sx={sheetShared}
            >
                <Radio id={'Custom'} value={'Custom'} checkedIcon={<CheckCircleRoundedIcon />} />
                <ChannelCapCustomIcon/>
                <FormLabel htmlFor={'Custom'} sx={{ ...labelShared, ...{ visibility: 'hidden' } }} >Custom</FormLabel>
                <MicrometerInput
                    label="Custom"
                    value={props.channelCapCustom.fieldValue}
                    error={props.channelCapCustom.error ? props.channelCapCustom.errorMessage : undefined}
                    warning={props.channelCapCustom.warning}
                    onChange={(fv, pv) => props.onChangeChannelCapCustom(fv, pv)}
                    description="Extra length behind port center."
                    sx={{
                        zIndex: 3,
                    }}
                />
            </Sheet>
        </RadioGroup>
    </FormControl>
}
