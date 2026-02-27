import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../common/entities/user.entity';

@Entity({ name: 'calendar_events' })
@Index('idx_calendar_owner', ['owner'])
@Index('idx_calendar_start_at', ['startAt'])
export class CalendarEvent {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  owner: User;

  @Column({ length: 255 })
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column()
  startAt: Date;

  @Column()
  endAt: Date;

  @Column({ default: false })
  allDay: boolean;

  @Column({ type: 'json', nullable: true })
  recurrence?: Record<string, any>;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
