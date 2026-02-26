import { PartialType } from '@nestjs/mapped-types';
import { CreateNoteDto } from './create-note.dto';
import { IsOptional, IsObject, IsString, MaxLength } from 'class-validator';

export class UpdateNoteDto extends PartialType(CreateNoteDto) {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
