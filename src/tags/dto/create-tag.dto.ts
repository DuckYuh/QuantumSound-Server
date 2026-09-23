import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateTagDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    name: string;
}
