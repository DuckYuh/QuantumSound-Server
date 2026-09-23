import { IsEnum } from "class-validator";
import { UserRole } from "@prisma/client";

export class AdminUpdateUserRoleDto {
    @IsEnum(UserRole)
    role: UserRole;
}