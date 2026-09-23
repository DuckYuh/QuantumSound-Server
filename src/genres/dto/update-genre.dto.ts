import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateGenreDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    name: string;
}
