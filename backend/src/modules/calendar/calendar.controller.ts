import { Controller, UseGuards, Post, Body, Request, Get, Query, Patch, Param, Delete, NotFoundException, HttpStatus, HttpCode } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/AuthenticatedRequest';
import { ApiTags, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CalendarEvent } from './entities/calendar-event.entity';
import { DbService } from '../db/db.service';

@Controller('calendar')
@ApiTags('Calendar')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly dbService: DbService,
  ) {}

  @Post()
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ type: CalendarEvent })
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateEventDto) {
    const user = await this.dbService.findOne(undefined, req.user.username);
    if (!user) throw new NotFoundException("User not found");
    const ev = await this.calendarService.create(user, dto);
    return { data: ev };
  }

  @Get()
  @ApiResponse({ type: CalendarEvent, isArray: true })
  @HttpCode(HttpStatus.OK)
  async findInRange(@Request() req: AuthenticatedRequest, @Query('start') start: string, @Query('end') end: string) {
    const events = await this.calendarService.findInRange(req.user.id, start, end);
    return { data: events };
  }

  @Patch(':id')
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ type: CalendarEvent})
  @HttpCode(HttpStatus.OK)
  async update(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateEventDto) {
    const ev = await this.calendarService.update(req.user.id, id, dto);
    return { data: ev };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.calendarService.remove(req.user.id, id);
  }
}
