import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RefreshTokenService {
    private readonly refreshTokenTtlMs =
        30 * 24 * 60 * 60 * 1000; // 30 days

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate a cryptographically secure refresh token.
     */
    generateToken(): string {
        return randomBytes(64).toString('base64url');
    }

    /**
     * Hash the refresh token before storing it in the database.
     */
    hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    /**
     * Create a refresh session for a user/device.
     * Returns the raw token only to the caller.
     */
    async createSession(
        userId: string,
        deviceName?: string,
    ): Promise<{ refreshToken: string; sessionId: string }> {
        const refreshToken = this.generateToken();
        const tokenHash = this.hashToken(refreshToken);
        const expiresAt = new Date(
            Date.now() + this.refreshTokenTtlMs,
        );

        const session = await this.prisma.refreshSession.create({
            data: {
                userId,
                tokenHash,
                deviceName,
                expiresAt,
            },
            select: {
                id: true,
            },
        });

        return {
            refreshToken,
            sessionId: session.id,
        };
    }

    async rotateToken(
        rawToken: string,
    ): Promise<{
        userId: string;
        refreshToken: string;
        sessionId: string;
    }> {
        const tokenHash = this.hashToken(rawToken);
        const now = new Date();

        const session = await this.prisma.refreshSession.findUnique({
            where: { tokenHash },
            include: { user: true },
        });

        if (
            !session ||
            session.revokedAt ||
            session.expiresAt <= now ||
            session.user.status !== 'ACTIVE'
        ) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const newRefreshToken = this.generateToken();
        const newTokenHash = this.hashToken(newRefreshToken);
        const newExpiresAt = new Date(
            Date.now() + this.refreshTokenTtlMs,
        );

        const result = await this.prisma.$transaction(async (tx) => {
            // Chỉ cho phép một request sử dụng token cũ thành công.
            const revoked = await tx.refreshSession.updateMany({
                where: {
                    id: session.id,
                    revokedAt: null,
                    expiresAt: { gt: now },
                },
                data: {
                    revokedAt: now,
                    lastUsedAt: now,
                },
            });

            if (revoked.count !== 1) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const newSession = await tx.refreshSession.create({
                data: {
                    userId: session.userId,
                    tokenHash: newTokenHash,
                    deviceName: session.deviceName,
                    expiresAt: newExpiresAt,
                },
                select: { id: true },
            });

            return newSession;
        });

        return {
            userId: session.userId,
            refreshToken: newRefreshToken,
            sessionId: result.id,
        };
    }

    async revokeToken(rawToken: string): Promise<void> {
        const tokenHash = this.hashToken(rawToken);

        await this.prisma.refreshSession.updateMany({
            where: {
                tokenHash,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }
}