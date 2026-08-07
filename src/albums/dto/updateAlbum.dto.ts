import { IsEnum, IsString, IsOptional } from "class-validator";
import { AlbumType, AlbumStatus } from "@prisma/client";

export class UpdateAlbumDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsEnum(AlbumType)
    type?: AlbumType;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(AlbumStatus)
    status?: AlbumStatus;
}