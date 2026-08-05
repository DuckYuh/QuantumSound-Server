import { IsUUID } from 'class-validator';

export class AddTrackDto {
    @IsUUID()
    trackId: string;

    @IsUUID()
    playlistId: string;
}