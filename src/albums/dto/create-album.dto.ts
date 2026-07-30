import { IsEnum, IsString, IsOptional } from "class-validator";
import { AlbumType } from "@prisma/client";

export class CreateAlbumDto {
    @IsString()
    title:string;

    @IsEnum(AlbumType)
    type:AlbumType;

    @IsString()
    @IsOptional()
    description?:string;

    @IsOptional()
    @IsString()
    coverImage?: string;
}