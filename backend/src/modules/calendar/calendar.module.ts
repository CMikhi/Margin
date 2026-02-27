import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CalendarService } from "./calendar.service";
import { CalendarController } from "./calendar.controller";
import { CalendarEvent } from "./entities/calendar-event.entity";
import { DbModule } from "../db/db.module";
import { JwtModule } from "../jwt/jwt.module";

@Module({
  imports: [TypeOrmModule.forFeature([CalendarEvent]), DbModule, JwtModule],
  providers: [CalendarService],
  controllers: [CalendarController],
  exports: [CalendarService],
})
export class CalendarModule {}
