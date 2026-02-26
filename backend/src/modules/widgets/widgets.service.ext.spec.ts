import { Test, TestingModule } from '@nestjs/testing';
import { WidgetsService } from './widgets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WidgetPlacement } from './entities/widget-placement.entity';
import { DataSource } from 'typeorm';

describe('WidgetsService extended', () => {
  let service: WidgetsService;
  let repo: any;
  const dsMock = { transaction: jest.fn() } as any;

  beforeEach(async () => {
    repo = { find: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetsService,
        { provide: getRepositoryToken(WidgetPlacement), useValue: repo },
        { provide: DataSource, useValue: dsMock },
      ],
    }).compile();

    service = module.get<WidgetsService>(WidgetsService);
  });

  it('bulkReplace calls transaction and returns saved', async () => {
    const widgets = [{ widgetKey: 'w1', x: 0, y: 0, width: 1, height: 1 }];
    dsMock.transaction.mockImplementation(async (cb) => {
      const manager = { delete: jest.fn(), create: (cls, obj) => obj, save: jest.fn().mockResolvedValue(widgets) };
      return await cb(manager);
    });

    const res = await service.bulkReplace({ id: 'u1' } as any, { widgets } as any);
    expect(dsMock.transaction).toHaveBeenCalled();
    expect(res).toEqual(widgets);
  });
});
