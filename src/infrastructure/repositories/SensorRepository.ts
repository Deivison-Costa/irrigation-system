import { Sensor } from "../../core/entities/Sensor";
import { ISensorRepository } from "../../core/repositories/ISensorRepository";

export class SensorRepository implements ISensorRepository {
  private sensor: Sensor;

  constructor() {
    this.sensor = new Sensor();
  }

  getSensorData(): Sensor {
    return this.sensor;
  }

  saveSensorData(sensor: Sensor): void {
    this.sensor = sensor;
  }
}
