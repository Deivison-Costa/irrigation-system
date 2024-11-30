import { CalculateEvapotranspirationUseCase } from "../../src/core/usecases/CalculateEvapotranspirationUseCase";
import { Sensor } from "../../src/core/entities/Sensor";

jest.mock("axios", () => ({
  get: jest.fn(() => ({
    data: { main: { temp_max: 303, temp_min: 293 } },
  })),
}));

describe("CalculateEvapotranspirationUseCase", () => {
  let useCase: CalculateEvapotranspirationUseCase;
  let sensor: Sensor;
  let geolocation: { latitude: number; longitude: number; altitude: number };

  beforeEach(() => {
    useCase = new CalculateEvapotranspirationUseCase();
    sensor = new Sensor(25, 60, 5, 1013, 10000, 30);
    geolocation = { latitude: -23.55, longitude: -46.63, altitude: 760 };
  });

  it("deve calcular a evapotranspiração de referência", async () => {
    await useCase.execute(sensor, geolocation);

    expect(sensor.ETo).toBeGreaterThan(0);
  });
});
