import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { AppPlatform } from '@prisma/client';

import { AppReleaseService } from './app-release.service';
@Controller('app-releases')
export class AppReleaseController {
  constructor(
    private readonly appReleaseService: AppReleaseService,
  ) {}

  // ==========================================
  // PUBLIC
  // ==========================================

  @Get()
  findAll() {
    return this.appReleaseService.findAll();
  }

  @Get(':platform')
  findByPlatform(
    @Param('platform') platform: AppPlatform,
  ) {
    return this.appReleaseService.findByPlatform(platform);
  }
}