import {
  IsOptional,
  IsDateString,
  IsBoolean,
  IsString,
  MaxLength,
  IsObject,
} from "class-validator";

export class UpdateEventDto {
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  recurrence?: Record<string, any>;
}
