import * as React from "react";
import {
    Dropdown,
    Menu,
    MenuItem,
    MenuButton,
    Typography, useTheme,
} from "@mui/joy";
import {ArrowDropDown} from "@mui/icons-material";

export type OutsidePort = { id: number; xMm: number; yMm: number }

type OutsidePortPickerProps = {
    markers: OutsidePort[]
    selectedId?: number | null
    onSelect: (id: number) => void
    onUpdate?: (id: number, next: Partial<Pick<OutsidePort, "xMm"|"yMm">>) => void
    onDelete?: (id: number) => void
    renderEditor?: (
        marker: OutsidePort,
        api: { update: (next: Partial<Pick<OutsidePort, "xMm"|"yMm">>) => void; remove: () => void }
    ) => React.ReactNode
    buttonLabel?: string
}

export function OutsidePortPicker({
                                      markers,
                                      selectedId,
                                      onSelect,
                                  }: OutsidePortPickerProps) {

    const selectedIndex = React.useMemo(
        () => markers.findIndex(m => m.id === selectedId),
        [markers, selectedId]
    );

    const theme = useTheme()

    const buttonLabel = <Typography sx={{
        color: theme.vars.palette.text.primary
    }}>Select Outside Port</Typography>

    return (
        <div>
            <Dropdown>
                <MenuButton
                    sx={{
                        marginY: 2,
                        color: theme.vars.palette.text.primary,
                        backgroundColor: "#3070B3",
                        ":hover": {
                            backgroundColor: "#2a619c"
                        }
                    }}
                    disabled={markers.length === 0}
                >
                    {selectedIndex >= 0 ? <Typography sx={{
                        color: theme.vars.palette.text.primary
                    }}>Outside Port: #{selectedIndex + 1}</Typography> : buttonLabel}
                    <ArrowDropDown sx={{ verticalAlign: 'bottom', color: 'white'}} />

                </MenuButton>

                <Menu placement="bottom-start" sx={{
                    marginY: 2,
                }}>
                    {markers.length === 0 && <MenuItem disabled>No markers yet</MenuItem>}

                    {markers.map((m, idx) => (
                        <MenuItem
                            key={m.id}
                            onClick={() => onSelect(m.id)}
                            selected={m.id === selectedId}
                        >
                            <Typography level="body-sm" sx={{ mr: 1, minWidth: 36 }}>
                                #{idx + 1}
                            </Typography>
                            <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                                {m.xMm.toFixed(1)} mm, {m.yMm.toFixed(1)} mm
                            </Typography>
                        </MenuItem>
                    ))}
                </Menu>
            </Dropdown>
        </div>
    )
}
