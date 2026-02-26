import { IsString, IsOptional, IsBoolean, IsDateString, IsObject, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsObject()
  recurrence?: Record<string, any>;
}
