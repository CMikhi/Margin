import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotesService } from "./notes.service";
import { NotesController } from "./notes.controller";
import { Note } from "./entities/note.entity";
import { AuthModule } from "../auth/auth.module";
import { DbModule } from "../db/db.module";
import { JwtModule } from "../jwt/jwt.module";

@Module({
  imports: [TypeOrmModule.forFeature([Note]), AuthModule, JwtModule, DbModule],
  providers: [NotesService],
  controllers: [NotesController],
  exports: [NotesService],
})
export class NotesModule {}
