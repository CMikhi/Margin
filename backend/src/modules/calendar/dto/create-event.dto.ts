import { IsString, IsOptional, IsBoolean, IsDateString, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  recurrence?: Record<string, any>;
}
