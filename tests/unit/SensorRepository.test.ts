import { SensorRepository } from "../../src/infrastructure/repositories/SensorRepository";
import { Sensor } from "../../src/core/entities/Sensor";

describe("SensorRepository", () => {
  let repository: SensorRepository;

  beforeEach(() => {
    repository = new SensorRepository();
  });

  it("deve retornar dados do sensor por padrão", () => {
    const sensorData = repository.getSensorData();
    expect(sensorData).toBeInstanceOf(Sensor);
  });

  it("deve salvar e retornar os dados do sensor atualizados", () => {
    const updatedSensor = new Sensor(25, 60, 5, 1013, 800, 30);
    repository.saveSensorData(updatedSensor);

    const sensorData = repository.getSensorData();
    expect(sensorData.temperature).toBe(25);
    expect(sensorData.humidity).toBe(60);
  });
});
