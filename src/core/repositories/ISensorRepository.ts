import { Sensor } from "../entities/Sensor";

export interface ISensorRepository {
  getSensorData(): Sensor;
  saveSensorData(sensor: Sensor): void;
}
