import { useState } from "react";
import { ExclusionZone, ExclusionZoneState, ExclusionID } from "../utils/exclusions";

export type ExclusionStateHandle = {
    exclusionState: ExclusionZoneState;
    preview: ExclusionZone | null;
    addExclusionFromParams: (x_min: number, y_min: number, width: number, height: number) => void;
    removeExclusion: (id: ExclusionID) => void;
    selectForEditing: (id: ExclusionID) => void;
    updatePreview: (zone: ExclusionZone) => void;
    acceptPreview: () => void;
    discardPreview: () => void;
};

export function useExclusionState(): ExclusionStateHandle {
    const [exclusions, setExclusions] = useState<ExclusionZoneState>({});
    const [preview, setPreview] = useState<ExclusionZone | null>(null);

    const addExclusionFromParams = (x_min: number, y_min: number, width: number, height: number) => {
        setExclusions(prev => {
            const id = Object.keys(prev).length;
            const zone: ExclusionZone = { id, x_min, y_min, width, height };
            return { ...prev, [id]: zone };
        });
    };

    const removeExclusion = (id: ExclusionID) => {
        setExclusions(prev => {
            const normalized: ExclusionZoneState = {};
            Object.values(prev)
                .filter(z => z.id !== id)
                .sort((a, b) => a.id - b.id)
                .forEach((zone, index) => {
                    normalized[index] = { ...zone, id: index };
                });
            return normalized;
        });
        setPreview(prev => {
            if (!prev || prev.id === id) return null;
            // Shift down IDs of zones that came after the deleted one
            const newId = prev.id > id ? prev.id - 1 : prev.id;
            return { ...prev, id: newId };
        });
    };

    const selectForEditing = (id: ExclusionID) => {
        const zone = exclusions[id];
        if (zone) setPreview({ ...zone });
    };

    const updatePreview = (zone: ExclusionZone) => {
        setPreview(zone);
    };

    const acceptPreview = () => {
        if (preview) {
            setExclusions(prev => ({ ...prev, [preview.id]: preview }));
        }
        setPreview(null);
    };

    const discardPreview = () => {
        setPreview(null);
    };

    return {
        exclusionState: exclusions,
        preview,
        addExclusionFromParams,
        removeExclusion,
        selectForEditing,
        updatePreview,
        acceptPreview,
        discardPreview,
    };
}
