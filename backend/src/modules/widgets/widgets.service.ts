import {
  Injectable,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { WidgetPlacement } from "./entities/widget-placement.entity";
import { BulkUpdateWidgetsDto } from "./dto/bulk-update-widgets.dto";
import { WidgetPlacementDto } from "./dto/widget-placement.dto";
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
      // Delete existing explicitly by ownerId
      await manager
        .createQueryBuilder()
        .delete()
        .from(WidgetPlacement)
        .where('"ownerId" = :userId', { userId: user.id })
        .execute();

      const entities = dto.widgets.map((w: WidgetPlacementDto) => {
        return manager.create(WidgetPlacement, {
          owner: user,
          widgetKey: w.widgetKey,
          x: w.x,
          y: w.y,
          width: w.width,
          height: w.height,
          zIndex: w.zIndex ?? 0,
          config: w.config ?? undefined,
        });
      });

      const saved = await manager.save(entities);
      return saved;
    });
  }
}
