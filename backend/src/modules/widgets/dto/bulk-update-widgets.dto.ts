import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WidgetPlacementDto } from './widget-placement.dto';
import { ApiProperty } from '@nestjs/swagger';

export class BulkUpdateWidgetsDto {
  @ApiProperty({ type: [WidgetPlacementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetPlacementDto)
  widgets: WidgetPlacementDto[];
}
