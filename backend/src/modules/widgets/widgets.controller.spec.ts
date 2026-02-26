import { Test, TestingModule } from "@nestjs/testing";
import { WidgetsController } from "./widgets.controller";
import { WidgetsService } from "./widgets.service";

describe("WidgetsController", () => {
  let controller: WidgetsController;
  const mockService = { findAll: jest.fn(), bulkReplace: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WidgetsController],
      providers: [{ provide: WidgetsService, useValue: mockService }],
    })
      .overrideGuard(require("../auth/guard/jwt-auth.guard").JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<WidgetsController>(WidgetsController);
  });

  it("findAll returns data", async () => {
    const req = { user: { id: "u1" } } as any;
    mockService.findAll.mockResolvedValue([{ id: "w1" }]);
    const res = await controller.findAll(req as any);
    expect(mockService.findAll).toHaveBeenCalledWith("u1");
    expect(res).toEqual({ data: [{ id: "w1" }] });
  });

  it("bulkReplace returns saved widgets", async () => {
    const req = { user: { id: "u1" } } as any;
    const dto = {
      widgets: [{ widgetKey: "w1", x: 0, y: 0, width: 1, height: 1 }],
    };
    mockService.bulkReplace.mockResolvedValue(dto.widgets);
    const res = await controller.bulkReplace(req as any, dto as any);
    expect(mockService.bulkReplace).toHaveBeenCalledWith(req.user, dto);
    expect(res).toEqual({ data: dto.widgets });
  });
});
