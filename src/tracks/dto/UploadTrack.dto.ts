import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { Visibility } from 'generated/prisma/client';

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

    @IsNotEmpty()
    @IsString()
    albumId: string;
}