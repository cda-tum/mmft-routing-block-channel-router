import { Button, Tooltip, Typography, useTheme } from "@mui/joy"
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export function download(output: string | Uint8Array, fileName: string, mime: string) {
    const a = document.createElement('a')
    if (output instanceof Uint8Array) {
        const url = URL.createObjectURL(new Blob([new Uint8Array(output)], { type: mime }))
        a.href = url
        a.setAttribute("download", fileName)
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    } else {
        const dataStr = `data:${mime};charset=utf-8,` + encodeURIComponent(output)
        a.setAttribute("href", dataStr)
        a.setAttribute("download", fileName)
        document.body.appendChild(a)
        a.click()
        a.remove()
    }
}

type DownloadButtonProps = { label: string } & ({
    content: string | Uint8Array | (() => string | Uint8Array)
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
        sx={{
            margin: 1,
            marginX: 1,
        }}
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