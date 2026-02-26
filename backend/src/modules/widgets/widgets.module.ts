import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WidgetsService } from './widgets.service';
import { WidgetsController } from './widgets.controller';
import { WidgetPlacement } from './entities/widget-placement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WidgetPlacement])],
  providers: [WidgetsService],
  controllers: [WidgetsController],
  exports: [WidgetsService],
})
export class WidgetsModule {}
