import { IsOptional, IsString } from 'class-validator';

export class CreateAppReleaseDto {
  @IsString()
  version: string;

  @IsOptional()
  @IsString()
  releaseNotes?: string;
}