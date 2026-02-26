import { IsString, IsOptional, IsObject, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
