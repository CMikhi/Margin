import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { CalendarEvent } from "./entities/calendar-event.entity";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { User } from "../common/entities/user.entity";

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarRepository: Repository<CalendarEvent>,
  ) {}

  private validateDateOrder(start: Date, end: Date) {
    if (end < start) throw new BadRequestException("endAt must be >= startAt");
  }

  async create(user: User, dto: CreateEventDto): Promise<CalendarEvent> {
    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    this.validateDateOrder(start, end);

    const payload: any = {
      owner: user,
      title: dto.title,
      description: dto.description ?? undefined,
      startAt: start,
      endAt: end,
      allDay: dto.allDay ?? false,
      recurrence: dto.recurrence ?? undefined,
    };

    const ev = this.calendarRepository.create(payload as any);
    return await this.calendarRepository.save(ev as any);
  }

  async findInRange(
    userId: string,
    startIso: string,
    endIso: string,
  ): Promise<CalendarEvent[]> {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      throw new BadRequestException("Invalid date");
    this.validateDateOrder(start, end);

    return await this.calendarRepository.find({
      where: { owner: { id: userId }, startAt: Between(start, end) },
      order: { startAt: "ASC" },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateEventDto,
  ): Promise<CalendarEvent> {
    const event = await this.calendarRepository.findOne({
      where: { id, owner: { id: userId } },
    });
    if (!event) throw new NotFoundException("Event not found");

    if (dto.startAt || dto.endAt) {
      const start = dto.startAt ? new Date(dto.startAt) : event.startAt;
      const end = dto.endAt ? new Date(dto.endAt) : event.endAt;
      this.validateDateOrder(start, end);
    }

    const updated = this.calendarRepository.merge(event, {
      title: dto.title ?? event.title,
      description: dto.description ?? event.description,
      startAt: dto.startAt ? new Date(dto.startAt) : event.startAt,
      endAt: dto.endAt ? new Date(dto.endAt) : event.endAt,
      allDay: typeof dto.allDay === "boolean" ? dto.allDay : event.allDay,
      recurrence: dto.recurrence ?? event.recurrence,
    });

    return await this.calendarRepository.save(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.calendarRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id AND "ownerId" = :userId', { id, userId })
      .execute();

    if (result.affected === 0) throw new NotFoundException("Event not found");
  }
}
