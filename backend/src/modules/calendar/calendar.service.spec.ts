import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CalendarEvent } from './entities/calendar-event.entity';

describe('CalendarService', () => {
  let service: CalendarService;
  const repoMock = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), delete: jest.fn(), create: jest.fn(), merge: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        { provide: getRepositoryToken(CalendarEvent), useValue: repoMock },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it('should reject invalid date ranges on create', async () => {
    const dto = { title: 't', startAt: '2026-01-02T00:00:00Z', endAt: '2026-01-01T00:00:00Z' } as any;
    await expect(service.create({ id: 'u' } as any, dto)).rejects.toThrow();
  });
});
