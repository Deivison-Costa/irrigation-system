import { Sensor } from "../entities/Sensor";
import { ISensorRepository } from "../repositories/ISensorRepository";

export class UpdateSensorDataUseCase {
  constructor(private sensorRepository: ISensorRepository) {}

  public async execute(data: Partial<Sensor>) {
    const currentSensorData = this.sensorRepository.getSensorData();
    const updatedSensor = { ...currentSensorData, ...data };

    this.sensorRepository.saveSensorData(updatedSensor);

    return updatedSensor;
  }
}
