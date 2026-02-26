import { Test, TestingModule } from '@nestjs/testing';
import { WidgetsService } from './widgets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WidgetPlacement } from './entities/widget-placement.entity';
import { DataSource } from 'typeorm';

const repoMock = { find: jest.fn() };
const dsMock = { transaction: jest.fn() } as any;

describe('WidgetsService', () => {
  let service: WidgetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetsService,
        { provide: getRepositoryToken(WidgetPlacement), useValue: repoMock },
        { provide: DataSource, useValue: dsMock },
      ],
    }).compile();

    service = module.get<WidgetsService>(WidgetsService);
  });

  it('should return list from findAll', async () => {
    repoMock.find.mockResolvedValue([]);
    const res = await service.findAll('u1');
    expect(res).toEqual([]);
  });
});
