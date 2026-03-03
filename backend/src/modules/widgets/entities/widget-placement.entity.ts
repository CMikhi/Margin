import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from "typeorm";
import { User } from "../../common/entities/user.entity";

@Entity({ name: "widget_placements" })
@Index("idx_widgets_owner", ["owner"])
@Index("idx_widgets_position", ["x", "y"]) // Spatial queries
@Index("idx_widgets_z_index", ["zIndex"]) // Layer ordering
@Index("gin_widgets_config", ["config"]) // JSONB search
@Unique("uq_owner_widgetkey", ["owner", "widgetKey"])
export class WidgetPlacement {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  owner: User;

  @Column({ length: 255 })
  widgetKey: string;

  @Column({ type: "integer", unsigned: false })
  x: number;

  @Column({ type: "integer", unsigned: false })
  y: number;

  @Column({ type: "integer", unsigned: false })
  width: number;

  @Column({ type: "integer", unsigned: false })
  height: number;

  @Column({ type: "integer", unsigned: false, default: 0 })
  zIndex: number;

  @Column({ type: "jsonb", nullable: true })
  config?: Record<string, any>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt?: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt?: Date;
}
