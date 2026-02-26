import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WidgetPlacementDto } from './widget-placement.dto';

export class BulkUpdateWidgetsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetPlacementDto)
  widgets: WidgetPlacementDto[];
}
