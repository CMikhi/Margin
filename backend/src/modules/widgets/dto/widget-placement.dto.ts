import { IsString, IsInt, IsOptional, IsObject, MaxLength, Min } from 'class-validator';

export class WidgetPlacementDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(255)
  widgetKey: string;

  @IsInt()
  x: number;

  @IsInt()
  y: number;

  @IsInt()
  @Min(1)
  width: number;

  @IsInt()
  @Min(1)
  height: number;

  @IsOptional()
  @IsInt()
  zIndex?: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
