import { Controller, UseGuards, Post, Body, Request, Get, Query, Patch, Param, Delete } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/AuthenticatedRequest';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateEventDto) {
    const ev = await this.calendarService.create(req.user as any, dto as any);
    return { data: ev };
  }

  @Get()
  async findInRange(@Request() req: AuthenticatedRequest, @Query('start') start: string, @Query('end') end: string) {
    const events = await this.calendarService.findInRange(req.user.id, start, end);
    return { data: events };
  }

  @Patch(':id')
  async update(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateEventDto) {
    const ev = await this.calendarService.update(req.user.id, id, dto as any);
    return { data: ev };
  }

  @Delete(':id')
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.calendarService.remove(req.user.id, id);
    return { status: 'ok' };
  }
}
