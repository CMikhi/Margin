import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../common/entities/user.entity';

@Entity({ name: 'notes' })
@Index('idx_notes_owner', ['owner'])
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  owner: User;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  content: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
