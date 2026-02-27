import { Controller, UseGuards, Get, Request, Put, Body, NotFoundException, HttpStatus, HttpCode } from '@nestjs/common';
import { WidgetsService } from './widgets.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/AuthenticatedRequest';
import { BulkUpdateWidgetsDto } from './dto/bulk-update-widgets.dto';
import { ApiTags, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { WidgetPlacement } from './entities/widget-placement.entity';
import { DbService } from '../db/db.service';

@Controller('widgets')
@ApiTags('Widgets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class WidgetsController {
  constructor(
    private readonly widgetsService: WidgetsService,
    private readonly dbService: DbService,
  ) {}

  @Get()
  @ApiResponse({ type: WidgetPlacement, isArray: true })
  async findAll(@Request() req: AuthenticatedRequest) {
    const widgets = await this.widgetsService.findAll(req.user.id);
    return { data: widgets };
  }

  @Put()
  @ApiBody({ type: BulkUpdateWidgetsDto })
  @ApiResponse({ type: WidgetPlacement, isArray: true })
  @HttpCode(HttpStatus.OK)
  async bulkReplace(@Request() req: AuthenticatedRequest, @Body() dto: BulkUpdateWidgetsDto) {
    const user = await this.dbService.findOne(undefined, req.user.username);
    if (!user) throw new NotFoundException("User not found");
    const saved = await this.widgetsService.bulkReplace(user, dto);
    return { data: saved };
  }
}
