import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;
}
