import { Controller, UseGuards, Get, Request, Put, Body } from '@nestjs/common';
import { WidgetsService } from './widgets.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/AuthenticatedRequest';
import { BulkUpdateWidgetsDto } from './dto/bulk-update-widgets.dto';

@Controller('widgets')
@UseGuards(JwtAuthGuard)
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    const widgets = await this.widgetsService.findAll(req.user.id);
    return { data: widgets };
  }

  @Put()
  async bulkReplace(@Request() req: AuthenticatedRequest, @Body() dto: BulkUpdateWidgetsDto) {
    const saved = await this.widgetsService.bulkReplace(req.user as any, dto as any);
    return { data: saved };
  }
}
