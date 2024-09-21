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

      const J = Math.floor(
        (new Date().getTime() -
          new Date(new Date().getFullYear(), 0, 0).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const t = () =>
        parseFloat(
          (new Date().getHours() + new Date().getMinutes() / 60).toFixed(2),
        );
      const t1 = 1 / 3600;
      const latitude = geolocation.latitude * (Math.PI / 180);
      const longitudeZ = -15 * (new Date().getTimezoneOffset() / 60);
      const longitudeM = geolocation.longitude;
      const seaZ = geolocation.altitude;

      const solarAngle = this.calculateSolarAngles(
        J,
        t(),
        longitudeZ,
        longitudeM,
        t1,
      );

      const Rs = this.calculateSolarRadiation(luminosity);
      console.log("Radiação solar [MJ m^-2 day-1]:", Rs);
      const Rns = this.calculateNetSolarRadiation(Rs);
      console.log("Radiação solar líquida [W/m^2]:", Rns);
      const Ra = this.calculateExtraterrestrialRadiation(
        latitude,
        solarAngle.omega1,
        solarAngle.omega2,
      );
      console.log("Radiação extraterrestre [MJ m^-2 day^-1]:", Ra);
      const Rso = this.calculateClearSkyRadiation(Ra, seaZ);
      console.log("Radiação solar de céu limpo [MJ m^-2 day^-1]:", Rso);
      const Rnl = this.calculateNetLongwaveRadiation(
        temperatureMaxKelvin,
        temperatureMinKelvin,
        Rs,
        Rso,
      );
      console.log("Radiação solar de ondas longas [MJ m^-2 day^-1]:", Rnl);
      const Rn = this.calculateNetRadiation(Rns, Rnl);
      console.log("Radiação líquida [MJ m^-2 day^-1]:", Rn);
      const es = this.calculateSaturationVaporPressure(
        temperatureMaxKelvin,
        temperatureMinKelvin,
      );
      console.log("Pressão de saturação [kPa]:", es);
      const ea_actual = this.calculateActualVaporPressure(temperature);
      console.log("Pressão de vapor atual [kPa]:", ea_actual);
      const delta = this.calculateDelta(temperature);
      console.log("Variação da pressão de saturação [kPa C°^-1]:", delta);
      const G = this.calculateSoilHeatFlux(Rn);
      console.log("Fluxo de calor do solo [MJ m^-2 day^-1]:", G);
      const gamma = this.calculatePsychrometricConstant(pressure);
      console.log("Constante psicométrica [kPa C°^-1]:", gamma);
      const ETo = this.calculateETo(
        Rn,
        G,
        delta,
        gamma,
        temperature,
        windSpeed,
        es,
        ea_actual,
      );
      sensor.ETo = ETo;

      console.log(
        `Evapotranspiração de Referência (ETo): ${ETo.toFixed(2)} mm/dia`,
      );
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
    console.log("Temperatura max e min [Kelvin]:", temp_max, "e", temp_min);
    return { temp_max, temp_min };
  }

  private calculateSc(J: number): number {
    const b = (2 * Math.PI * (J - 81)) / 364;
    const Sc =
      0.1645 * Math.sin(2 * b) - 0.1255 * Math.cos(b) - 0.025 * Math.sin(b);
    return Sc;
  }

  private calculateOmega(
    t: number,
    Lz: number,
    Lm: number,
    Sc: number,
  ): number {
    return (Math.PI / 12) * (t + 0.06667 * (Lz - Lm) + Sc - 12);
  }

  private calculateOmega1AndOmega2(
    omega: number,
    t1: number,
  ): { omega1: number; omega2: number } {
    const delta = (Math.PI * t1) / 24;
    const omega1 = omega - delta;
    const omega2 = omega + delta;
    return { omega1, omega2 };
  }

  public calculateSolarAngles(
    J: number,
    t: number,
    Lz: number,
    Lm: number,
    t1: number,
  ): { omega1: number; omega2: number } {
    const Sc = this.calculateSc(J);
    const omega = this.calculateOmega(t, Lz, Lm, Sc);
    const { omega1, omega2 } = this.calculateOmega1AndOmega2(omega, t1);
    return { omega1, omega2 };
  }

  private calculateSolarRadiation(luminosity: number): number {
    return (luminosity / 120) * 0.0864; // MJ m^2
  }

  private calculateNetSolarRadiation(Rs: number): number {
    return 0.77 * Rs;
  }

  private calculateExtraterrestrialRadiation(
    latitude: number,
    solarAngleInitial: number,
    solarAngleFinal: number,
  ): number {
    const Gsc = 0.082; // MJ/m²/min, constante solar
    const J = Math.floor(
      (new Date().getTime() -
        new Date(new Date().getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    console.log("Dia do ano:", J);
    const dr = 1 + (0.033 * Math.cos((2 * Math.PI * J) / 365));
    console.log("Distância relativa terra-sol:", dr);
    const delta_m = 0.409 * Math.sin((2 * Math.PI * J) / 365 - 1.39);
    console.log("Declinação solar:", delta_m)
    const omega1 = solarAngleInitial;
    const omega2 = solarAngleFinal;
    console.log("Ângulo solar no início do periódo [rad]:", omega1);
    console.log("Ângulo solar no fim do periódo [rad]:", omega2);
    console.log("Latitude [rad]:", latitude);
    return ( // preciso refazer esse cálculo na mão pois o resultado está anômalo
      ((12 * 60) / Math.PI) *
      Gsc *
      dr *
      ((omega2 - omega1) * Math.sin(latitude) * Math.sin(delta_m) +
        Math.cos(latitude) * Math.cos(delta_m) * Math.sin(omega2) -
        Math.sin(omega1))
    );
  }

  private calculateClearSkyRadiation(Ra: number, elevation: number): number {
    return (0.75 + 2 * 1e-5 * elevation) * Ra;
  }

  private calculateNetLongwaveRadiation(
    TmaxK: number,
    TminK: number,
    Rs: number,
    Rso: number,
  ): number {
    const sigma = 4.903e-9; // Constante de Stefan-Boltzmann
    const ea_actual = this.calculateActualVaporPressure(TminK);

    return (
      sigma *
      ((TmaxK ** 4 + TminK ** 4) / 2) *
      (0.34 - 0.14 * Math.sqrt(ea_actual)) *
      (1.35 * (Rs / Rso) - 0.35)
    );
  }

  private calculateNetRadiation(Rns: number, Rnl: number): number {
    return Rns - Rnl;
  }

  private calculateSaturationVaporPressure(
    TmaxK: number,
    TminK: number,
  ): number {
    return (
      (0.6108 * Math.exp((17.27 * TmaxK) / (TmaxK + 237.3)) +
        0.6108 * Math.exp((17.27 * TminK) / (TminK + 237.3))) /
      2 /
      1000
    );
  }

  private calculateActualVaporPressure(temperature: number): number {
    return (
      (0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3))) / 1000
    );
  }

  private calculateDelta(temperature: number): number {
    return (
      (4098 *
        (0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3)))) /
      (temperature + 237.3) ** 2 /
      1000
    );
  }

  private calculateSoilHeatFlux(Rn: number): number {
    return Rn > 0 ? 0.1 * Rn : 0.5 * Rn;
  }

  private calculatePsychrometricConstant(pressure: number): number {
    return 0.665 * 1e-3 * (pressure / 1000);
  }

  private calculateETo(
    Rn: number,
    G: number,
    delta: number,
    gamma: number,
    temperature: number,
    windSpeed: number,
    es: number,
    ea_actual: number,
  ): number {
    return (
      (0.408 * delta * (Rn - G) +
        gamma * (900 / (temperature + 273)) * windSpeed * (es - ea_actual)) /
      (delta + gamma * (1 + 0.34 * windSpeed))
    );
  }
}
