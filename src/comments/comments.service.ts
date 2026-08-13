import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CommentsService {
    constructor(private prisma: PrismaService) {}

    async createComment(userId: string, trackId: string, content: string) {
        return this.prisma.comment.create({
            data: {
                userId,
                trackId,
                content,
            },
        });
    }

    async deleteComment(userId: string, commentId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw new Error('Comment not found');
        }
        const isCommentOwner = comment.userId === userId;

        const track = await this.prisma.track.findUnique({
            where: { id: comment.trackId },
        });
        if (!track) {
            throw new Error('Track not found');
        }
        const isTrackOwner = track.artistId === userId;

        if (!isCommentOwner && !isTrackOwner) {
            throw new ForbiddenException(
                "You don't have permission to delete this comment",
            );
        }
        return this.prisma.comment.delete({
            where: { id: commentId },
        });
    }
}
