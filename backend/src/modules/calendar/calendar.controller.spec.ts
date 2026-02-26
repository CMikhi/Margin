import { Test, TestingModule } from "@nestjs/testing";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";

describe("CalendarController", () => {
  let controller: CalendarController;
  const mockService = {
    create: jest.fn(),
    findInRange: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [{ provide: CalendarService, useValue: mockService }],
    })
      .overrideGuard(require("../auth/guard/jwt-auth.guard").JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CalendarController>(CalendarController);
  });

  it("create returns created event", async () => {
    const req = { user: { id: "u1" } } as any;
    const dto = {
      title: "t",
      startAt: "2026-01-01T00:00:00Z",
      endAt: "2026-01-02T00:00:00Z",
    };
    mockService.create.mockResolvedValue({ id: "e1", ...dto });

    const res = await controller.create(req as any, dto as any);
    expect(mockService.create).toHaveBeenCalledWith(req.user, dto);
    expect(res).toEqual({
      data: { id: "e1", title: "t", startAt: dto.startAt, endAt: dto.endAt },
    });
  });

  it("findInRange calls service with start and end", async () => {
    const req = { user: { id: "u1" } } as any;
    mockService.findInRange.mockResolvedValue([]);
    const res = await controller.findInRange(
      req as any,
      "2026-01-01T00:00:00Z",
      "2026-02-01T00:00:00Z",
    );
    expect(mockService.findInRange).toHaveBeenCalledWith(
      "u1",
      "2026-01-01T00:00:00Z",
      "2026-02-01T00:00:00Z",
    );
    expect(res).toEqual({ data: [] });
  });

  it("update returns updated event", async () => {
    const req = { user: { id: "u1" } } as any;
    const dto = { title: "updated" } as any;
    mockService.update.mockResolvedValue({ id: "e1", title: "updated" });
    const res = await controller.update(req as any, "e1", dto);
    expect(mockService.update).toHaveBeenCalledWith("u1", "e1", dto);
    expect(res).toEqual({ data: { id: "e1", title: "updated" } });
  });

  it("remove returns ok", async () => {
    const req = { user: { id: "u1" } } as any;
    mockService.remove.mockResolvedValue(undefined);
    const res = await controller.remove(req as any, "e1");
    expect(mockService.remove).toHaveBeenCalledWith("u1", "e1");
    expect(res).toEqual({ status: "ok" });
  });
});
