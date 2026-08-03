import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { Visibility } from '@prisma/client';
import { Transform } from "class-transformer";

export class UploadTrackDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    coverImage: string;

    @IsNotEmpty()
    visibility: Visibility;

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

    @IsNotEmpty()
    @IsString()
    albumId: string;
}