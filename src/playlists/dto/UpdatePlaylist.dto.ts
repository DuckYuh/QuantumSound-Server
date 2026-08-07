import { IsString, Length, IsOptional, IsEnum } from 'class-validator';
import { Visibility } from '@prisma/client';

export class UpdatePlaylistDto {
    @IsOptional()
    @IsString()
    @Length(1, 100)
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(Visibility)
    visibility?: Visibility;

    @IsOptional()
    @IsString()
    coverUrl?: string;
}