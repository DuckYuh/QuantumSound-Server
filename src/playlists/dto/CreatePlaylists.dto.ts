import { IsString, Length, IsOptional, IsEnum } from 'class-validator';
import { Visibility } from '@prisma/client';

export class CreatePlaylistDto {
    @IsString()
    @Length(1, 100)
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    @IsEnum(Visibility)
    visibility: Visibility;
}