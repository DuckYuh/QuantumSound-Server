import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateTagDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    name: string;
}
