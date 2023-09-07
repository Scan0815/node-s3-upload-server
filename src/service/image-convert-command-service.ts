import {ICrop, TColorSpaces, TFlags, TGravity, TInterlace} from "../interfaces/imageConverter";

export class ImageConverter {
    static Flag(flag: TFlags) {
        const flags = {
            None: '',
            IgnoreAspectRatio: '!',
            OnlyShrinkLarger: '>',
            OnlyEnlargeSmaller: '<',
            FillGivenArea: '^',
            PercentageResize: '%',
            PixelCountLimit: '@'
        }
        return flags[flag];
    }

    resize(width: number | null, height: number | null, flag: TFlags = "None") {
        return `-resize ${(width !== null) ? width : ''}x${(height !== null) ? height : ''}${ImageConverter.Flag(flag)}`;
    }

    scale(width: number | null, height: number | null, flag: TFlags = "None") {
        return `-scale ${(width !== null) ? width : ''}x${(height !== null) ? height : ''}${ImageConverter.Flag(flag)}`;
    }

    interlace(interlace: TInterlace) {
        return `-interlace ${interlace}`;
    }

    quality(quality: number = 100) {
        return `-quality ${quality}`;
    }

    gaussian() {
        return '-filter Gaussian';
    }

    public sigma(factor: number) {
        return `-define filter:sigma=${factor}`;
    }

    limit(memory: number) {
        return `-limit memory ${memory}MiB`;
    }

    gravity(gravity: TGravity) {
        return `-gravity ${gravity}`;
    }

    rePage() {
        return `+repage`;
    }

    strip() {
        return `-strip`;
    }

    colorSpace(space: TColorSpaces = "RGB") {
        return `-colorspace ${space}`;
    }

    autoLevel() {
        return `-auto-level`;
    }

    autoOrient() {
        return `-auto-orient`;
    }

    src(path: string) {
        return `${path}`;
    }

    destination(destination: string, fileType: string = "jpg") {
        return `${destination}`;
    }

    crop(crop: ICrop) {
        const width = crop['x2'] - crop['x1'];
        const height = crop['y2'] - crop['y1'];
        return `-crop ${width}x${height}+${crop['x1']}+${crop['y1']}`
    }

    getConvertString(commands: string[]) {
        return commands.join(" ");
    }
}
