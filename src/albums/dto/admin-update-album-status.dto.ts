import { IsIn } from 'class-validator';
import { ADMIN_ALBUM_STATUSES, AdminAlbumStatus } from './admin-album-query.dto';

export class AdminUpdateAlbumStatusDto {
    @IsIn(ADMIN_ALBUM_STATUSES)
    status: AdminAlbumStatus;
}
