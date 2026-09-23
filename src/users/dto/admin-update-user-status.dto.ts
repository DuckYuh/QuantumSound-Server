import { UserStatus } from "@prisma/client";
import { IsIn } from "class-validator";

export class AdminUpdateUserStatusDto {
    @IsIn([UserStatus.ACTIVE, UserStatus.BANNED])
    status: UserStatus;
}