import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateGenreDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    name: string;
}
