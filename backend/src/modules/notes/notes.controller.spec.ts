import { Test, TestingModule } from "@nestjs/testing";
import { NotesController } from "./notes.controller";
import { NotesService } from "./notes.service";

describe("NotesController", () => {
  let controller: NotesController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [{ provide: NotesService, useValue: mockService }],
    })
      .overrideGuard(require("../auth/guard/jwt-auth.guard").JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<NotesController>(NotesController);
  });

  it("create returns created note", async () => {
    const req = { user: { id: "u1" } } as any;
    const dto = { title: "t", content: "c" };
    mockService.create.mockResolvedValue({ id: "n1", ...dto });

    const res = await controller.create(req, dto as any);
    expect(mockService.create).toHaveBeenCalledWith(req.user, dto);
    expect(res).toEqual({ data: { id: "n1", title: "t", content: "c" } });
  });

  it("findAll returns list", async () => {
    const req = { user: { id: "u1" } } as any;
    mockService.findAll.mockResolvedValue([{ id: "n1" }]);
    const res = await controller.findAll(req as any, 10, 0);
    expect(mockService.findAll).toHaveBeenCalledWith("u1", 10, 0);
    expect(res).toEqual({ data: [{ id: "n1" }] });
  });

  it("findOne returns note", async () => {
    const req = { user: { id: "u1" } } as any;
    mockService.findOne.mockResolvedValue({ id: "n1" });
    const res = await controller.findOne(req as any, "n1");
    expect(mockService.findOne).toHaveBeenCalledWith("u1", "n1");
    expect(res).toEqual({ data: { id: "n1" } });
  });

  it("update returns updated note", async () => {
    const req = { user: { id: "u1" } } as any;
    const dto = { title: "updated" } as any;
    mockService.update.mockResolvedValue({ id: "n1", title: "updated" });
    const res = await controller.update(req as any, "n1", dto);
    expect(mockService.update).toHaveBeenCalledWith("u1", "n1", dto);
    expect(res).toEqual({ data: { id: "n1", title: "updated" } });
  });

  it("remove returns ok", async () => {
    const req = { user: { id: "u1" } } as any;
    mockService.remove.mockResolvedValue(undefined);
    const res = await controller.remove(req as any, "n1");
    expect(mockService.remove).toHaveBeenCalledWith("u1", "n1");
    expect(res).toEqual({ status: "ok" });
  });
});
