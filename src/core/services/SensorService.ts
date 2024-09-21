import { Sensor } from '../entities/Sensor'

export class SensorService {
  private sensor: Sensor

  constructor() {
    this.sensor = new Sensor()
  }

  public updateSensorData(data: Partial<Sensor>) {
    this.sensor = { ...this.sensor, ...data }
    this.calculateEvapotranspiration()
  }

  private calculateEvapotranspiration() {
    const { temperature, humidity, windSpeed, pressure, luminosity } = this.sensor

    if (!temperature || !humidity || !windSpeed || !pressure || !luminosity) {
      console.log('Aguardando todas as leituras para calcular a evapotranspiração...')
      return
    }

    const J = new Date().getDay() 
    const t = () => parseFloat((new Date().getHours() + new Date().getMinutes() / 60).toFixed(2))
    const t1 = 1/3600
    const latitude = 0                      // Preciso integrar um sensor GPS NEO-6M para obter a leitura da latitude do ESP32 e publicar via MQTT.
    const longitudeZ = -15 * (new Date().getTimezoneOffset() / 60)
    const longitudeM = 0                    // Preciso integrar um sensor GPS NEO-6M para obter a leitura da longitude do ESP32 e publicar via MQTT.
    const seaZ = 0                          // Pegar a latitude e longitude e usar uma API externa para extrair a elevação em relação ao nível do mar.
    const solarAngle = this.calculateSolarAngles(J, t(), longitudeZ, longitudeM, t1)      
    const temperatureMaxKelvin = 0          // Pegar da mesma API externa que a elevação
    const temperatureMinKelvin = 0          // Pegar da mesma API externa que a elevação

    const Rs = this.calculateSolarRadiation(luminosity)
    const Rns = this.calculateNetSolarRadiation(Rs)
    const Ra = this.calculateExtraterrestrialRadiation(latitude, solarAngle.omega1, solarAngle.omega2)
    const Rso = this.calculateClearSkyRadiation(Ra, seaZ)
    const Rnl = this.calculateNetLongwaveRadiation(temperatureMaxKelvin, temperatureMinKelvin, pressure, Rs, Rso)
    const Rn = this.calculateNetRadiation(Rns, Rnl)
    const es = this.calculateSaturationVaporPressure(temperatureMaxKelvin, temperatureMinKelvin)
    const ea_actual = this.calculateActualVaporPressure(temperature)
    const delta = this.calculateDelta(temperature)
    const G = this.calculateSoilHeatFlux(Rn)
    const gamma = this.calculatePsychrometricConstant(pressure)

    const ETo = this.calculateETo(Rn, G, delta, gamma, temperature, windSpeed, es, ea_actual)

    this.sensor.ETo = ETo
    console.log(`Evapotranspiração de Referência (ETo): ${ETo.toFixed(2)} mm/dia`)
  }

  private calculateSc(J: number): number {
    const b = (2 * Math.PI * (J - 81)) / 364
    const Sc = 0.1645 * Math.sin(2 * b) - 0.1255 * Math.cos(b) - 0.025 * Math.sin(b)
    return Sc
  }

  private calculateOmega(t: number, Lz: number, Lm: number, Sc: number): number {
    return (Math.PI / 12) * (t + 0.06667 * (Lz - Lm) + Sc - 12)
  }

  private calculateOmega1AndOmega2(omega: number, t1: number): { omega1: number; omega2: number } {
    const delta = (Math.PI * t1) / 24
    const omega1 = omega - delta
    const omega2 = omega + delta
    return { omega1, omega2 }
  }

  public calculateSolarAngles(J: number, t: number, Lz: number, Lm: number, t1: number): { omega1: number; omega2: number } {
    const Sc = this.calculateSc(J)
    const omega = this.calculateOmega(t, Lz, Lm, Sc)
    const { omega1, omega2 } = this.calculateOmega1AndOmega2(omega, t1)
    return { omega1, omega2 }
  }

  private calculateSolarRadiation(luminosity: number): number {
    return luminosity / 120 * (1 * 3600) // W/m²
  }

  private calculateNetSolarRadiation(Rs: number): number {
    return 0.77 * Rs
  }

  private calculateExtraterrestrialRadiation(latitude: number, solarAngleInitial: number, solarAngleFinal: number): number {
    const Gsc = 0.0820                          // MJ/m²/min, constante solar
    const J = new Date().getDay()               // Dia do ano
    const dr = 1 + 0.033 * Math.cos((2 * Math.PI * J) / 365)
    const delta_m = 0.409 * Math.sin((2 * Math.PI * J) / 365 - 1.39)
    const omega1 = solarAngleInitial
    const omega2 = solarAngleFinal

    return (12 * 60 / Math.PI) * Gsc * dr * ((omega2 - omega1) * Math.sin(latitude) * Math.sin(delta_m) + Math.cos(latitude) * Math.cos(delta_m) * (Math.sin(omega2) - Math.sin(omega1)))
  }

  private calculateClearSkyRadiation(Ra: number, elevation: number): number {
    return (0.75 + 2 * 1e-5 * elevation) * Ra
  }

  private calculateNetLongwaveRadiation(TmaxK: number, TminK: number, pressure: number, Rs: number, Rso: number): number {
    const sigma = 4.903e-9                     // Constante de Stefan-Boltzmann
    const ea_actual = this.calculateActualVaporPressure(TminK)

    return sigma * ((TmaxK ** 4 + TminK ** 4) / 2) * (0.34 - 0.14 * Math.sqrt(ea_actual)) * (1.35 * (Rs / Rso) - 0.35)
  }

  private calculateNetRadiation(Rns: number, Rnl: number): number {
    return Rns - Rnl
  }

  private calculateSaturationVaporPressure(TmaxK: number, TminK: number): number {
    return ((0.6108 * Math.exp((17.27 * TmaxK) / (TmaxK + 237.3))) + (0.6108 * Math.exp((17.27 * TminK) / (TminK + 237.3)))) / 2
  }

  private calculateActualVaporPressure(temperature: number): number {
    return 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3))
  }

  private calculateDelta(temperature: number): number {
    return (4098 * (0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3)))) / ((temperature + 237.3) ** 2)
  }

  private calculateSoilHeatFlux(Rn: number): number {
    return Rn > 0 ? 0.1 * Rn : 0.5 * Rn
  }

  private calculatePsychrometricConstant(pressure: number): number {
    return 0.665 * 1e-3 * pressure
  }

  private calculateETo(Rn: number, G: number, delta: number, gamma: number, temperature: number, windSpeed: number, es: number, ea_actual: number): number {
    return (0.408 * delta * (Rn - G) + gamma * (900 / (temperature + 273)) * windSpeed * (es - ea_actual)) /
           (delta + gamma * (1 + 0.34 * windSpeed))
  }

  public getSensorData(): Sensor {
    return this.sensor
  }
}