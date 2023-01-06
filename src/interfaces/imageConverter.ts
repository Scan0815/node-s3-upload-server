export type TFlags = "None"|"IgnoreAspectRatio"|"OnlyShrinkLarger"|"OnlyEnlargeSmaller"|"FillGivenArea"|"PercentageResize"|"PixelCountLimit";
export type TColorSpaces =    'CMY'|'CMYK'|'Gray'|'HCL'|'HCLp'|'HSB'|'HSI'|'HSL'|'HSV'|'HWB'
    |'Lab'|'LCHab'|'LCHuv'|'LMS'|'Log'|'Luv'|'OHTA'|'Rec601YCbCr'|'Rec709YCbCr'|'RGB'
    |'scRGB'|'sRGB'|'Transparent'|'xyY'|'XYZ'|'YCbCr'|'YCC'|'YDbDr'|'YIQ'|'YPbPr'|'YUV';
export type  TGravity = 'NorthWest'|'North'|'NorthEast'|'West'|'Center'|'East'|'SouthWest'|'South'|'SouthEast';
export type TInterlace = 'None'|'Line'|'Plane'|'Partition';
export interface ICrop {
    x1: number,
    y1: number,
    x2: number,
    y2: number
};
