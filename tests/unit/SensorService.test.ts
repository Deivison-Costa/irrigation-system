import { SensorService } from "../../src/core/services/SensorService";
import { SensorRepository } from "../../src/infrastructure/repositories/SensorRepository";
import { Sensor } from "../../src/core/entities/Sensor";

describe("SensorService", () => {
  let service: SensorService;
  let repository: SensorRepository;

  beforeEach(() => {
    repository = new SensorRepository();
    service = new SensorService(repository);
  });

  it("deve atualizar os dados do sensor corretamente", async () => {
    const updatedData = { temperature: 22, humidity: 55 };
    await service.updateSensorData(updatedData);

    const sensor = service.getSensorData();
    expect(sensor.temperature).toBe(22);
    expect(sensor.humidity).toBe(55);
  });

  it("deve retornar os dados do sensor", () => {
    const sensorData = service.getSensorData();
    expect(sensorData).toBeInstanceOf(Sensor);
  });
});
