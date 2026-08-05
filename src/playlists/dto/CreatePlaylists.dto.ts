import { IsString, Length, IsOptional, IsEnum } from 'class-validator';

export class CreatePlaylistDto {
    @IsString()
    @Length(1, 100)
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
}