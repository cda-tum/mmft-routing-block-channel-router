import { Button, Typography, useTheme } from "@mui/joy"
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export function download(output: string, fileName: string, mime: string) {
    const dataStr = `data:${mime};charset=utf-8,` + encodeURIComponent(output)
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", fileName)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
}

type DownloadButtonProps = { label: string } & ({
    content: string
    mime: string
    fileName: string
} | {
    content: undefined
    mime: undefined | string
    fileName: undefined | string
})

export function DownloadButton(props: DownloadButtonProps) {
    const theme = useTheme()// required for firefox
    return <Button
        disabled={props.content === undefined}
        onClick={_ => {
            if (props.content !== undefined) {
                download(props.content, props.fileName, props.mime)
            }
        }}
        sx={{
            margin: 1,
            marginX: 2,
        }}
    >
        <Typography sx={{ color: theme.vars.palette.common.white }}>
            <FileDownloadIcon sx={{
                verticalAlign: 'bottom'
            }} /> {props.label}</Typography>
    </Button>
}