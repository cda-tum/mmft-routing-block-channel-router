import { Button, Tooltip, Typography, useTheme } from "@mui/joy"
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
    content: string | (() => string)
    mime: string
    fileName: string
} | {
    content: undefined
    mime: undefined | string
    fileName: undefined | string
    noContentMessage: string
})

export function DownloadButton(props: DownloadButtonProps) {
    const theme = useTheme()

    const disabled = props.content === undefined

    const button = <span><Button
        disabled={disabled}
        onClick={_ => {
            if (!disabled) {
                if (typeof props.content === 'function') {
                    download(props.content(), props.fileName, props.mime)
                } else {
                    download(props.content, props.fileName, props.mime)
                }
            }
        }}
    >
        <Typography sx={{ color: theme.vars.palette.common.white }}>
            <FileDownloadIcon sx={{
                verticalAlign: 'bottom'
            }} /> {props.label}</Typography>
    </Button></span>

    const wrapWithTooltip = 'noContentMessage' in props && props.noContentMessage !== undefined && disabled && props.content === undefined
    const maybeWrapped = wrapWithTooltip ? <Tooltip title={props.noContentMessage} variant="solid">{button}</Tooltip> : button

    return maybeWrapped
}