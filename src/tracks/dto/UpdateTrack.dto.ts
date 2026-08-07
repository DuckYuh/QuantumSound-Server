import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { Visibility, TrackStatus } from '@prisma/client';
import { Transform } from "class-transformer";

export class UpdateTrackDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    visibility?: Visibility;

    @IsOptional()
    @Transform(({ value }) =>
        Array.isArray(value) ? value : value ? [value] : []
    )
    @IsArray()
    @IsString({ each: true })
    genres?: string[];

    @IsOptional()
    @Transform(({ value }) =>
        Array.isArray(value) ? value : value ? [value] : []
    )
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    status?: TrackStatus;
}