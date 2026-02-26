import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { User } from '../../common/entities/user.entity';

@Entity({ name: 'widget_placements' })
@Index('idx_widgets_owner', ['owner'])
@Unique('uq_owner_widgetkey', ['owner', 'widgetKey'])
export class WidgetPlacement {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  owner: User;

  @Column({ length: 255 })
  widgetKey: string;

  @Column('int')
  x: number;

  @Column('int')
  y: number;

  @Column('int')
  width: number;

  @Column('int')
  height: number;

  @Column('int', { default: 0 })
  zIndex: number;

  @Column({ type: 'json', nullable: true })
  config?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
