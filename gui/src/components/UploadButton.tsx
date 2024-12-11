import { Button, Typography, useTheme } from "@mui/joy"
import { useRef } from "react";
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { SxProps } from "@mui/joy/styles/types";

type UploadButtonProps = {
    label: string,
    onError?: () => void,
    onSuccess: (content: string) => void
    sx?: SxProps
}

export function UploadButton(props: UploadButtonProps) {
    const theme = useTheme()

    const tempInput = useRef<HTMLInputElement>(null);

    return <>
        <input
            type="file"
            name="upload"
            ref={tempInput}
            style={{
                display: 'none'
            }}
            onChange={(e) => {
                if (e.target.files === null) {
                    return
                }
                const file = e.target.files[0];

                const reader = new FileReader();
                reader.readAsText(file, 'UTF-8');

                reader.onload = readerEvent => {
                    if (readerEvent.target === null) {
                        return
                    }
                    const content = readerEvent.target.result as string
                    try {
                        props.onSuccess(content)
                    } catch (e) {
                        props.onError?.()
                    }
                }

                if (tempInput.current) {
                    tempInput.current.value = ''
                }
            }}
        />
        <Button
            onClick={_ => {
                tempInput.current?.click()
            }}
            sx={props.sx}
        >
            <Typography sx={{ color: theme.vars.palette.common.white }}>
                <FileUploadIcon sx={{
                    verticalAlign: 'bottom'
                }} /> {props.label}</Typography>
        </Button>
    </>
}         
