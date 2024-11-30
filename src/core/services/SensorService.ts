import { Sensor } from "../entities/Sensor";
import { UpdateSensorDataUseCase } from "../usecases/UpdateSensorDataUseCase";
import { UpdateGeolocationUseCase } from "../usecases/UpdateGeolocationUseCase";
import { CalculateEvapotranspirationUseCase } from "../usecases/CalculateEvapotranspirationUseCase";
import { ISensorRepository } from "../repositories/ISensorRepository";

export class SensorService {
  private updateSensorDataUseCase: UpdateSensorDataUseCase;
  private updateGeolocationUseCase: UpdateGeolocationUseCase;
  private sensorRepository: ISensorRepository;

  constructor(sensorRepository: ISensorRepository) {
    this.sensorRepository = sensorRepository;
    const calculateEvapotranspirationUseCase =
      new CalculateEvapotranspirationUseCase();
    this.updateSensorDataUseCase = new UpdateSensorDataUseCase(
      sensorRepository,
    );
    this.updateGeolocationUseCase = new UpdateGeolocationUseCase(
      sensorRepository,
      calculateEvapotranspirationUseCase,
    );
  }

  public async updateSensorData(data: Partial<Sensor>) {
    await this.updateSensorDataUseCase.execute(data);
  }

  public async updateGeolocation(
    latitude: number,
    longitude: number,
    altitude: number,
  ) {
    await this.updateGeolocationUseCase.execute(latitude, longitude, altitude);
  }

  public getSensorData(): Sensor {
    return this.sensorRepository.getSensorData();
  }
}
