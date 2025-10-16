import {
    Autocomplete, Box, Button, FormControl, FormHelperText,
    FormLabel, Input
} from "@mui/joy";
import CheckIcon from "@mui/icons-material/Check";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import * as React from "react";
import { SxProps } from "@mui/joy/styles/types";

export type MicrometerWithConfirmProps = {
    label?: string;
    description?: string;
    value?: string;               // controlled value from parent (shown after confirm or external updates)
    defaultValue?: string;        // initial fallback
    error?: string;
    warning?: string;
    placeholder?: string;
    autocompleteValues?: number[] | undefined;
    explainIcon?: React.ReactNode;
    sx?: SxProps;
    marginY?: string | number;

    /** fires on click OK (or Enter). Use this instead of onChange. */
    onConfirm?: (fieldValue: string, parsedValue: number | undefined) => void;

    /** optional: observe typing without committing */
    onDraftChange?: (fieldValue: string, parsedValue: number | undefined) => void;

    /** disable OK unless draft actually differs from current value (default: true) */
    requireChangeToConfirm?: boolean;
    /** button label (default: "OK") */
    confirmLabel?: string;
};

export function ConfirmableMicrometerInput(props: MicrometerWithConfirmProps) {
    const id = React.useId();

    // draft value while typing
    const [draft, setDraft] = React.useState<string>(
        props.value ?? props.defaultValue ?? ""
    );

    // keep draft in sync if parent updates value externally
    React.useEffect(() => {
        if (props.value !== undefined) setDraft(props.value);
    }, [props.value]);

    const parseNum = (s: string) => {
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : undefined;
    };

    const changed = props.requireChangeToConfirm !== false
        ? draft !== (props.value ?? props.defaultValue ?? "")
        : true;

    const sharedInputSx: SxProps = {
        "& input": { textAlign: "right" },
        minHeight: 38,
        height: 38,
        ...props.sx,
    };

    const startDecorator = props.explainIcon
        ? <Box sx={{ width: "3em", height: "3em", m: 1 }}>{props.explainIcon}</Box>
        : undefined;

    const handleCommit = () => {
        props.onConfirm?.(draft, parseNum(draft));
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleCommit();
        }
        if (e.key === "Escape" && props.value !== undefined) {
            // revert to last confirmed / controlled value
            setDraft(props.value);
            props.onDraftChange?.(props.value, parseNum(props.value));
        }
    };

    const field = props.autocompleteValues
        ? (
            <Autocomplete
                freeSolo
                disableClearable
                options={props.autocompleteValues.map(o => o.toString())}
                inputValue={draft}
                onInputChange={(_, v) => {
                    if (v != null) {
                        setDraft(v);
                        props.onDraftChange?.(v, parseNum(v));
                    }
                }}
                slotProps={{
                    input: { id, placeholder: props.placeholder ?? props.label, onKeyDown: handleKeyDown }
                }}
                startDecorator={startDecorator}
                endDecorator="mm"
                sx={sharedInputSx}
            />
        )
        : (
            <Input
                id={id}
                value={draft}
                placeholder={props.placeholder ?? props.label}
                onChange={(e) => {
                    const v = e.target.value;
                    setDraft(v);
                    props.onDraftChange?.(v, parseNum(v));
                }}
                onKeyDown={handleKeyDown}
                startDecorator={startDecorator}
                endDecorator="mm"
                sx={sharedInputSx}
            />
        );

    return (
        <FormControl
            {...(props.error ? { error: true } : {})}
            sx={{ my: props.marginY ?? 2, flexGrow: 1 }}
            color={props.warning ? "warning" : undefined}
        >
            {props.label && <FormLabel htmlFor={id}>{props.label}</FormLabel>}

            <Box sx={{ display: "flex", gap: 1 }}>
                <Box sx={{ flex: 1 }}>{field}</Box>
                <Button
                    size="md"
                    variant="solid"
                    color="primary"
                    disabled={!changed}
                    onClick={handleCommit}
                    startDecorator={<CheckIcon />}
                    sx={{ minHeight: 70,
                        height: 70,
                        alignSelf: "flex-end",
                        fontSize: "1.1rem",
                    }}
                >
                    {props.confirmLabel ?? "OK"}
                </Button>
            </Box>

            {props.description && !props.error && !props.warning && (
                <FormHelperText sx={{ mx: 0 }}>{props.description}</FormHelperText>
            )}

            {props.error && (
                <FormHelperText sx={{ mx: 0 }}>
                    <InfoOutlined /> {props.error}
                </FormHelperText>
            )}

            {props.warning && (
                <FormHelperText sx={{ mx: 0 }}>
                    <InfoOutlined color="warning" /> {props.warning}
                </FormHelperText>
            )}
        </FormControl>
    );
}
