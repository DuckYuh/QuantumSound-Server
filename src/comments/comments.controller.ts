import { Controller, UseGuards, UseInterceptors, Post, Delete, Param, Body, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
    constructor(private commentsService: CommentsService) {}

    @Post('create/:trackId')
    @UseGuards(JwtAuthGuard)
    createComment(
        @Param('trackId') trackId: string,
        @Body('content') content: string,
        @Req() req
    ) {
        return this.commentsService.createComment(req.user.id, trackId, content);
    }

    @Delete('delete/:commentId')
    @UseGuards(JwtAuthGuard)
    deleteComment(
        @Param('commentId') commentId: string,
        @Req() req
    ) {
        return this.commentsService.deleteComment(req.user.id, commentId);
    }
}
