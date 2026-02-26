import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Note } from './entities/note.entity';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';

describe('NotesService', () => {
  let service: NotesService;
  let repo: Repository<Note> & { findOne?: jest.Mock };

  const mockUser: User = { id: 'user-1', username: 'u', password: 'p', role: 'user', createdAt: new Date() } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: getRepositoryToken(Note), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), delete: jest.fn(), create: jest.fn(), merge: jest.fn() } },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    repo = module.get(getRepositoryToken(Note));
  });

  it('should create a note', async () => {
    const dto = { title: 't', content: 'c' } as any;
    repo.create.mockReturnValue({ title: dto.title, content: dto.content });
    repo.save.mockResolvedValue({ id: 'note-1', title: dto.title, content: dto.content });

    const res = await service.create(mockUser, dto);
    expect(res).toHaveProperty('id', 'note-1');
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException for missing note on findOne', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('user-1', 'note-1')).rejects.toThrow();
  });
});
