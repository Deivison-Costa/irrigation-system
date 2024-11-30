import { ISensorRepository } from "../repositories/ISensorRepository";
import { CalculateEvapotranspirationUseCase } from "./CalculateEvapotranspirationUseCase";

export class UpdateGeolocationUseCase {
  constructor(
    private sensorRepository: ISensorRepository,
    private calculateEvapotranspirationUseCase: CalculateEvapotranspirationUseCase,
  ) {}

  public async execute(latitude: number, longitude: number, altitude: number) {
    const sensor = this.sensorRepository.getSensorData();
    const geolocation = { latitude, longitude, altitude };

    await this.calculateEvapotranspirationUseCase.execute(sensor, geolocation);

    return geolocation;
  }
}
