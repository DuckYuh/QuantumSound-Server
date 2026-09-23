import { TrackStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class AdminUpdateTrackStatusDto {
    @IsEnum(TrackStatus)
    status: TrackStatus;
}
