import { Controller, Post, Body, UseGuards, Request, Get, Query, Param, Patch, Delete, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/AuthenticatedRequest';
import { ApiTags, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Note } from './entities/note.entity';

@Controller('notes')
@ApiTags('Notes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiBody({ type: CreateNoteDto })
  @ApiResponse({ type: Note })
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateNoteDto) {
    const note = await this.notesService.create(req.user as any, dto);
    return { data: note };
  }

  @Get()
  @ApiResponse({ type: Note, isArray: true })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    const notes = await this.notesService.findAll(req.user.id, limit, offset);
    return { data: notes };
  }

  @Get(':id')
  @ApiResponse({ type: Note })
  async findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const note = await this.notesService.findOne(req.user.id, id);
    return { data: note };
  }

  @Patch(':id')
  @ApiBody({ type: UpdateNoteDto })
  @ApiResponse({ type: Note })
  async update(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateNoteDto) {
    const note = await this.notesService.update(req.user.id, id, dto);
    return { data: note };
  }

  @Delete(':id')
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.notesService.remove(req.user.id, id);
    return { status: 'ok' };
  }
}
