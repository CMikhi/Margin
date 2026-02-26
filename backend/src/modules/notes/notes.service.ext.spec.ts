import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Note } from './entities/note.entity';

describe('NotesService extended', () => {
  let service: NotesService;
  let repo: any;
  const mockUser = { id: 'user-1' } as any;

  beforeEach(async () => {
    repo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), delete: jest.fn(), create: jest.fn(), merge: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: getRepositoryToken(Note), useValue: repo },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
  });

  it('findAll respects limit and offset', async () => {
    repo.find.mockResolvedValue([{ id: 'n1' }, { id: 'n2' }]);
    const res = await service.findAll('user-1', 2, 5);
    expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ take: 2, skip: 5 }));
    expect(res).toHaveLength(2);
  });

  it('findOne returns note when found', async () => {
    const note = { id: 'n1', owner: { id: 'user-1' } };
    repo.findOne.mockResolvedValue(note);
    const res = await service.findOne('user-1', 'n1');
    expect(res).toBe(note);
  });

  it('update updates and returns note', async () => {
    const orig = { id: 'n1', title: 'old', content: 'c', metadata: null };
    const merged = { ...orig, title: 'new' };
    repo.findOne.mockResolvedValue(orig);
    repo.merge.mockReturnValue(merged);
    repo.save.mockResolvedValue(merged);

    const res = await service.update('user-1', 'n1', { title: 'new' } as any);
    expect(repo.findOne).toHaveBeenCalled();
    expect(repo.merge).toHaveBeenCalledWith(orig, expect.objectContaining({ title: 'new' }));
    expect(res.title).toBe('new');
  });

  it('remove throws NotFoundException when nothing deleted', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('user-1', 'n1')).rejects.toThrow();
  });
});
