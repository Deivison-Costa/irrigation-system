import { Sensor } from "../entities/Sensor";
import axios from "axios";
import env from "../../env/env";

export class CalculateEvapotranspirationUseCase {
  private apiOWKey = env.OPEN_WEATHER_API_KEY;

  public async execute(
    sensor: Sensor,
    geolocation: { latitude: number; longitude: number; altitude: number },
  ) {
    const { temperature, humidity, windSpeed, pressure, luminosity } = sensor;

    if (!temperature || !humidity || !windSpeed || !pressure || !luminosity) {
      console.log(
        "Aguardando todas as leituras para calcular a evapotranspiração...",
      );
      return;
    }

    try {
      const temperatureData = await this.getTemperatureDataFromAPI(
        geolocation.latitude,
        geolocation.longitude,
      );
      const temperatureMaxKelvin = temperatureData.temp_max;
      const temperatureMinKelvin = temperatureData.temp_min;

      // Calculando variáveis intermediárias
      const TmaxC = temperatureMaxKelvin - 273.15;
      const TminC = temperatureMinKelvin - 273.15;
      const Tmean = (TmaxC + TminC) / 2;
      const Rs = this.calculateSolarRadiation(luminosity);
      const Rns = this.calculateNetSolarRadiation(Rs);
      const J = this.getJulianDay();
      const latitude = geolocation.latitude * (Math.PI / 180);
      const Ra = this.calculateExtraterrestrialRadiation(latitude, J);
      const Rso = this.calculateClearSkyRadiation(Ra, geolocation.altitude);
      const Rnl = this.calculateNetLongwaveRadiation(
        temperatureMaxKelvin,
        temperatureMinKelvin,
        Rs,
        Rso,
        humidity,
      );
      const Rn = this.calculateNetRadiation(Rns, Rnl);
      const delta = this.calculateDelta(Tmean);
      const gamma = this.calculatePsychrometricConstant(pressure);
      const es = this.calculateSaturationVaporPressure(TmaxC, TminC);
      const ea = this.calculateActualVaporPressure(humidity, TminC);
      const ETo = this.calculateETo(
        Rn,
        0, // G (Fluxo de calor do solo) = 0
        delta,
        gamma,
        Tmean,
        windSpeed,
        es,
        ea,
      );

      // Atualizando as variáveis intermediárias no sensor
      sensor.TmaxC = TmaxC;
      sensor.TminC = TminC;
      sensor.Tmean = Tmean;
      sensor.Rs = Rs;
      sensor.Rns = Rns;
      sensor.Ra = Ra;
      sensor.Rso = Rso;
      sensor.Rnl = Rnl;
      sensor.Rn = Rn;
      sensor.delta = delta;
      sensor.gamma = gamma;
      sensor.es = es;
      sensor.ea = ea;
      sensor.ETo = ETo;

      console.log(`Evapotranspiração de Referência (ETo): ${ETo.toFixed(6)} mm/dia`);

    } catch (error) {
      console.error("Erro ao calcular a evapotranspiração:", error);
    }
  }

  private async getTemperatureDataFromAPI(
    latitude: number,
    longitude: number,
  ): Promise<{ temp_max: number; temp_min: number }> {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=standard&appid=${this.apiOWKey}`;
    const response = await axios.get(url);
    const { temp_max, temp_min } = response.data.main;
    return { temp_max, temp_min };
  }

  private calculateSolarRadiation(luminosity: number): number {
    return (luminosity / 120) * 0.0864; // MJ m^-2 day^-1
  }

  private calculateNetSolarRadiation(Rs: number): number {
    return 0.77 * Rs;
  }

  private calculateExtraterrestrialRadiation(
    latitude: number,
    J: number,
  ): number {
    const Gsc = 0.082; // MJ m^-2 min^-1
    const dr = 1 + 0.033 * Math.cos((2 * Math.PI * J) / 365);
    const delta = 0.409 * Math.sin((2 * Math.PI * J) / 365 - 1.39);
    const omega_s = Math.acos(-Math.tan(latitude) * Math.tan(delta));
    return (
      ((24 * 60) / Math.PI) *
      Gsc *
      dr *
      (omega_s * Math.sin(latitude) * Math.sin(delta) +
        Math.cos(latitude) * Math.cos(delta) * Math.sin(omega_s))
    );
  }

  private calculateClearSkyRadiation(Ra: number, altitude: number): number {
    return (0.75 + 2e-5 * altitude) * Ra;
  }

  private calculateNetLongwaveRadiation(
    TmaxK: number,
    TminK: number,
    Rs: number,
    Rso: number,
    humidity: number,
  ): number {
    const sigma = 4.903e-9; // Stefan-Boltzmann constant MJ K^-4 m^-2 day^-1
    const TminC = TminK - 273.15;
    const ea =
      (humidity / 100) * this.calculateSaturationVaporPressure(TminC, TminC);
    return (
      sigma *
      ((TmaxK ** 4 + TminK ** 4) / 2) *
      (0.34 - 0.14 * Math.sqrt(ea)) *
      (1.35 * (Rs / Rso) - 0.35)
    );
  }

  private calculateNetRadiation(Rns: number, Rnl: number): number {
    return Rns - Rnl;
  }

  private calculateDelta(Tmean: number): number {
    return (
      (4098 * (0.6108 * Math.exp((17.27 * Tmean) / (Tmean + 237.3)))) /
      Math.pow(Tmean + 237.3, 2)
    );
  }

  private calculatePsychrometricConstant(pressure: number): number {
    return 0.665e-3 * pressure; // kPa °C^-1
  }

  private calculateSaturationVaporPressure(
    TmaxC: number,
    TminC: number,
  ): number {
    return (
      (0.6108 * Math.exp((17.27 * TmaxC) / (TmaxC + 237.3)) +
        0.6108 * Math.exp((17.27 * TminC) / (TminC + 237.3))) /
      2
    );
  }

  private calculateActualVaporPressure(
    humidity: number,
    TminC: number,
  ): number {
    const esTmin = 0.6108 * Math.exp((17.27 * TminC) / (TminC + 237.3)); // Saturation vapor pressure at Tmin
    return (humidity / 100) * esTmin;
  }

  private calculateETo(
    Rn: number,
    G: number,
    delta: number,
    gamma: number,
    Tmean: number,
    windSpeed: number,
    es: number,
    ea: number,
  ): number {
    return (
      (0.408 * delta * (Rn - G) +
        gamma * (900 / (Tmean + 273)) * windSpeed * (es - ea)) /
      (delta + gamma * (1 + 0.34 * windSpeed))
    );
  }

  private getJulianDay(): number {
    return Math.floor(
      (new Date().getTime() -
        new Date(new Date().getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }
}
