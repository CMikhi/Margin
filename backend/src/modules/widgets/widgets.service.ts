import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { WidgetPlacement } from "./entities/widget-placement.entity";
import { BulkUpdateWidgetsDto } from "./dto/bulk-update-widgets.dto";
import { User } from "../common/entities/user.entity";

@Injectable()
export class WidgetsService {
  constructor(
    @InjectRepository(WidgetPlacement)
    private readonly widgetRepo: Repository<WidgetPlacement>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(userId: string): Promise<WidgetPlacement[]> {
    return await this.widgetRepo.find({ where: { owner: { id: userId } } });
  }
  /**
   * Replace all widget placements for a user in a single transaction
   * Uses UPSERT approach to handle existing widgets gracefully
   */
  async bulkReplace(
    user: User,
    dto: BulkUpdateWidgetsDto,
  ): Promise<WidgetPlacement[]> {
    if (!dto.widgets || !Array.isArray(dto.widgets))
      throw new BadRequestException("Missing widgets");

    // Validate payload size and duplicates before entering transaction
    const MAX_WIDGETS = 200;
    if (dto.widgets.length > MAX_WIDGETS)
      throw new BadRequestException("Too many widgets");

    const keys = dto.widgets.map((w) => w.widgetKey);
    const dup = keys.find((k, i) => keys.indexOf(k) !== i);
    if (dup)
      throw new BadRequestException(`Duplicate widgetKey in payload: ${dup}`);

    return await this.dataSource.transaction(async (manager) => {
      const widgetRepo = manager.getRepository(WidgetPlacement);

      // First, delete all existing widgets for this user that are not in the new set
      const existingWidgets = await widgetRepo.find({
        where: { owner: { id: user.id } },
      });

      // Find widgets to delete (existing but not in new set)
      const newWidgetKeys = dto.widgets.map((w) => w.widgetKey);
      const widgetsToDelete = existingWidgets.filter(
        (existing) => !newWidgetKeys.includes(existing.widgetKey),
      );

      if (widgetsToDelete.length > 0) {
        const idsToDelete = widgetsToDelete
          .map((w) => w.id)
          .filter((id): id is string => !!id);

        if (idsToDelete.length > 0) {
          await widgetRepo.delete(idsToDelete);
          console.log(
            `Deleted ${widgetsToDelete.length} obsolete widgets for user ${user.id}`,
          );
        }
      }

      // Now upsert the new widgets
      const results: WidgetPlacement[] = [];

      for (const widgetDto of dto.widgets) {
        // Try to find existing widget
        const existing = existingWidgets.find(
          (w) => w.widgetKey === widgetDto.widgetKey,
        );

        if (existing && existing.id) {
          // Update existing widget
          await widgetRepo.update(existing.id, {
            x: widgetDto.x,
            y: widgetDto.y,
            width: widgetDto.width,
            height: widgetDto.height,
            zIndex: widgetDto.zIndex ?? 0,
            config: widgetDto.config ?? undefined,
          });

          // Fetch the updated widget
          const updated = await widgetRepo.findOne({
            where: { id: existing.id },
          });
          if (updated) results.push(updated);
        } else {
          // Create new widget
          const newWidget = widgetRepo.create({
            owner: user,
            widgetKey: widgetDto.widgetKey,
            x: widgetDto.x,
            y: widgetDto.y,
            width: widgetDto.width,
            height: widgetDto.height,
            zIndex: widgetDto.zIndex ?? 0,
            config: widgetDto.config ?? undefined,
          });

          const saved = await widgetRepo.save(newWidget);
          results.push(saved);
        }
      }

      console.log(
        `Successfully upserted ${results.length} widgets for user ${user.id}`,
      );
      return results;
    });
  }
}
