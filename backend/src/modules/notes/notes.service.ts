import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Note } from "./entities/note.entity";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { User } from "../common/entities/user.entity";

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
  ) {}

  async create(user: User, dto: CreateNoteDto): Promise<Note> {
    // TypeORM DeepPartial typing prefers undefined to null for optional fields
    const payload: any = {
      owner: user,
      title: dto.title,
      content: dto.content ?? "",
      metadata: dto.metadata ?? undefined,
    };

    const note = this.noteRepository.create(payload);

    return await this.noteRepository.save(note as any);
  }

  async findAll(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<Note[]> {
    const findOptions: any = {
      where: { owner: { id: userId } },
      order: { createdAt: "DESC" },
    };

    if (typeof limit === "number") findOptions.take = limit;
    if (typeof offset === "number") findOptions.skip = offset;

    return await this.noteRepository.find(findOptions);
  }

  async findOne(userId: string, id: string): Promise<Note> {
    const note = await this.noteRepository.findOne({
      where: { id, owner: { id: userId } },
    });
    if (!note) throw new NotFoundException("Note not found");
    return note;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.noteRepository.findOne({
      where: { id, owner: { id: userId } },
    });
    if (!note) throw new NotFoundException("Note not found");

    // Create new object to avoid mutating original
    const updated = this.noteRepository.merge(note, {
      title: dto.title ?? note.title,
      content: dto.content ?? note.content,
      metadata: dto.metadata ?? note.metadata,
    });

    return await this.noteRepository.save(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.noteRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id AND "ownerId" = :userId', { id, userId })
      .execute();

    if (result.affected === 0) throw new NotFoundException("Note not found");
  }
}
