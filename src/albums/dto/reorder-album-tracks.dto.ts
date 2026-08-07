import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderAlbumTracksDto {
    @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    trackIds: string[];
}
