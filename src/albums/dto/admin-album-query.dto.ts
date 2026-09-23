import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const ADMIN_ALBUM_STATUSES = ['PROCESSING', 'RELEASED', 'BLOCKED'] as const;
export type AdminAlbumStatus = (typeof ADMIN_ALBUM_STATUSES)[number];

export class AdminAlbumQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsIn(ADMIN_ALBUM_STATUSES)
    status?: AdminAlbumStatus;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 20;
}
