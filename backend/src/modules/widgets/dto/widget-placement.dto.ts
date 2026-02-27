import { IsString, IsInt, IsOptional, IsObject, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WidgetPlacementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  widgetKey: string;

  @ApiProperty({ type: Number })
  @IsInt()
  x: number;

  @ApiProperty({ type: Number })
  @IsInt()
  y: number;

  @ApiProperty({ type: Number, minimum: 1 })
  @IsInt()
  @Min(1)
  width: number;

  @ApiProperty({ type: Number, minimum: 1 })
  @IsInt()
  @Min(1)
  height: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  zIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
