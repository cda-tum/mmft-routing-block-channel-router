export type ExclusionID = number;

export type ExclusionZone = {
    id: ExclusionID;
    x_min: number;
    y_min: number;
    width: number;
    height: number;
};

export type ExclusionZoneState = Record<ExclusionID, ExclusionZone>;
