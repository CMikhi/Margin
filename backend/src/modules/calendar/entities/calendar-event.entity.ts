import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { User } from "../../common/entities/user.entity";

@Entity({ name: "calendar_events" })
@Index("idx_calendar_owner", ["owner"])
@Index("idx_calendar_start_at", ["startAt"])
@Index("idx_calendar_end_at", ["endAt"])
@Index("idx_calendar_all_day", ["allDay"])
@Index("idx_calendar_owner_dates", ["owner", "startAt", "endAt"]) // Composite for date range queries
@Index("gin_calendar_recurrence", ["recurrence"]) // JSONB search
export class CalendarEvent {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  owner: User;

  @Column({ length: 255 })
  title: string;

  @Column("text", { nullable: true })
  description?: string;

  @Column({ type: "timestamptz" })
  startAt: Date;

  @Column({ type: "timestamptz" })
  endAt: Date;

  @Column({ default: false })
  allDay: boolean;

  @Column({ type: "jsonb", nullable: true })
  recurrence?: Record<string, any>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt?: Date;
}
