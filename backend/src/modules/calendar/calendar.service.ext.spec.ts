import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CalendarEvent } from './entities/calendar-event.entity';

describe('CalendarService extended', () => {
  let service: CalendarService;
  let repo: any;

  beforeEach(async () => {
    repo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), delete: jest.fn(), create: jest.fn(), merge: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        { provide: getRepositoryToken(CalendarEvent), useValue: repo },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it('findInRange validates dates and calls repository', async () => {
    repo.find.mockResolvedValue([]);
    const res = await service.findInRange('u1', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z');
    expect(repo.find).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  it('update throws NotFound when event missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.update('u1', 'e1', {} as any)).rejects.toThrow();
  });
});
