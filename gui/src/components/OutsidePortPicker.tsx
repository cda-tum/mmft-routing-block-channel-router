import * as React from "react";
import {
    Dropdown,
    Menu,
    MenuItem,
    MenuButton,
    ListDivider,
    Typography,
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
                                      onUpdate,
                                      onDelete,
                                      renderEditor,
                                      buttonLabel = "Select Outside Port",
                                  }: OutsidePortPickerProps) {
    const selected = markers.find(m => m.id === selectedId) ?? null

    return (
        <div>
            <Dropdown>
                <MenuButton
                    sx={{
                        marginY: 2,
                    }}
                    disabled={markers.length === 0}
                >
                    {selected ? `Outside Port: #${selected.id}` : buttonLabel}
                    <ArrowDropDown sx={{ verticalAlign: 'bottom' }} />
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
                            <Typography level="body-sm" sx={{ mr: 1, minWidth: 36 }}>#{idx + 1}</Typography>
                            <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                                {m.xMm.toFixed(1)} mm, {m.yMm.toFixed(1)} mm
                            </Typography>
                        </MenuItem>
                    ))}

                    {selected && (onDelete || onUpdate) && <ListDivider />}

                    {selected && onDelete && (
                        <MenuItem onClick={() => onDelete(selected.id)} color="danger">
                            Delete selected
                        </MenuItem>
                    )}
                </Menu>
            </Dropdown>

            {selected && renderEditor && (
                <div style={{ marginTop: 12 }}>
                    {renderEditor(selected, {
                        update: next => onUpdate?.(selected.id, next),
                        remove: () => onDelete?.(selected.id),
                    })}
                </div>
            )}
        </div>
    )
}
