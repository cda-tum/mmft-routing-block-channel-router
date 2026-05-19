import { useRef, useState } from "react";
import { Button, Menu, MenuItem, Typography, useTheme } from "@mui/joy";
import { ArrowDropDown } from "@mui/icons-material";
import { useExclusionState } from "../hooks/useExclusionState";
import { ExclusionZoneEditor } from "./ExclusionZoneEditor";

// -----------------------------------------------------------------------
// USAGE EXAMPLE — copy the relevant parts into your actual parent component
// -----------------------------------------------------------------------

export function ExclusionZoneUsageExample() {
    const theme = useTheme();

    // 1. Call the hook once at the parent level that owns both the dropdown
    //    and the editor. Never call it again lower down the tree.
    const exclusionState = useExclusionState();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLButtonElement>(null);

    const zones = Object.values(exclusionState.exclusionState);

    return (
        <div>

            {/* 2. Call addExclusionFromParams from wherever a new zone is created,
                    e.g. a canvas click handler or another button. */}
            <button onClick={() => exclusionState.addExclusionFromParams(0, 0, 1, 1)}>
                Add Exclusion Zone
            </button>

            {/* 3. Dropdown button — lists every zone by ID.
                    Selecting one calls selectForEditing, which loads it into
                    preview and causes the editor below to appear. */}
            <Button
                ref={dropdownRef}
                disabled={zones.length === 0}
                onClick={e => {
                    setDropdownOpen(!dropdownOpen);
                    e.stopPropagation();
                }}
                sx={{ marginY: 2 }}
            >
                <Typography sx={{ color: theme.vars.palette.common.white }}>
                    {exclusionState.preview !== null
                        ? <>Zone {exclusionState.preview.id}</>
                        : <>Select Exclusion Zone</>
                    }
                    <ArrowDropDown sx={{ verticalAlign: 'bottom' }} />
                </Typography>
            </Button>
            <Menu
                open={dropdownOpen}
                onClose={() => setDropdownOpen(false)}
                anchorEl={dropdownRef.current}
                sx={{ maxHeight: 300 }}
            >
                {zones.map(zone => (
                    <MenuItem
                        key={zone.id}
                        onClick={() => {
                            exclusionState.selectForEditing(zone.id);
                            setDropdownOpen(false);
                        }}
                    >
                        <Typography sx={{ color: theme.vars.palette.text.primary }}>
                            Zone {zone.id}
                        </Typography>
                    </MenuItem>
                ))}
            </Menu>

            {/* 4. Editor is only mounted when a zone is selected for editing.
                    Deleting or discarding inside the editor sets preview to null,
                    which unmounts it automatically. */}
            {exclusionState.preview !== null && (
                <ExclusionZoneEditor exclusionState={exclusionState} />
            )}

        </div>
    );
}
