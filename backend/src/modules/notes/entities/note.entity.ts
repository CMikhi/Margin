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

@Entity({ name: "notes" })
@Index("idx_notes_owner", ["owner"])
@Index("gin_notes_metadata", ["metadata"]) // JSONB search - PostgreSQL will use GIN automatically for JSONB
export class Note {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  owner: User;

  @Column({ type: "text" })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt?: Date;
}
