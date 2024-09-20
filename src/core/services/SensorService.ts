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
    const latitude = 0
    const seaZ = 0
    const solarAngleInitial = 0
    const solarAngleFinal = 0
    const temperatureMaxKelvin = 0
    const temperatureMinKelvin = 0
    let ETo = 0

    if (!temperature || !humidity || !windSpeed || !pressure || !luminosity) {
      console.log('Aguardando todas as leituras para calcular a evapotranspiração...')
      return
    }

    // Constantes
    const sigma = 4.903e-9          // Constante de Stefan-Boltzmann
    const Gsc = 0.0820              // MJ/m²/min, constante solar
    const phi = latitude            // Latitude (ajustar para a latitude local)
    const elevation = seaZ          // Elevação em metros (ajustar para a elevação local)

    // Conversão de luminosidade (lux) para irradiância solar (W/m²)
    const E = luminosity / 120 

    // Radiação solar (Rs)
    const Rs = E * (1 * 3600)       // W/m²: E * (1m² * 1h)

    // Radiação líquida solar (Rns)
    const Rns = 0.77 * Rs

    // Radiação extraterrestre (Ra)
    const J = new Date().getDay()   // Dia do ano
    const dr = 1 + 0.033 * Math.cos((2 * Math.PI * J) / 365)
    const delta_m = 0.409 * Math.sin((2 * Math.PI * J) / 365 - 1.39)
    const omega1 = solarAngleInitial
    const omega2 = solarAngleFinal

    const Ra = (12 * 60 / Math.PI) * Gsc * dr * ((omega2 - omega1) * Math.sin(phi) * Math.sin(delta_m) + Math.cos(phi) * Math.cos(delta_m) * (Math.sin(omega2) - Math.sin(omega1)))

    // Radiação solar com céu limpo (Rso)
    const Rso = (0.75 + 2 * 1e-5 * elevation) * Ra

    // Radiação líquida de ondas longas (Rnl)
    const TmaxK = temperatureMaxKelvin
    const TminK = temperatureMinKelvin

    // Pressão de vapor atual (ea)
    const ea_actual = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3))

    const Rnl = sigma * ((TmaxK ** 4 + TminK ** 4) / 2) * (0.34 - 0.14 * Math.sqrt(ea_actual)) * (1.35 * (Rs / Rso) - 0.35)

    // Radiação líquida (Rn)
    const Rn = Rns - Rnl

    // Pressão de saturação (es)
    const es = ((0.6108 * Math.exp((17.27 * TmaxK) / (TmaxK + 237.3))) + (0.6108 * Math.exp((17.27 * TminK) / (TminK + 237.3)))) / 2

    // Variação da pressão de saturação (delta)
    const delta = (4098 * (0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3)))) / ((temperature + 237.3) ** 2)

    // Fluxo de calor do solo (G)
    const G = Rn > 0 ? 0.1 * Rn : 0.5 * Rn

    // Constante psicrométrica (gamma)
    const gamma = 0.665 * 1e-3 * pressure

    // Cálculo da evapotranspiração de referência (ETo)
    ETo = (0.408 * delta * (Rn - G) + gamma * (900 / (temperature + 273)) * windSpeed * (es - ea_actual)) /
                (delta + gamma * (1 + 0.34 * windSpeed))

    this.sensor.ETo = ETo
    console.log(`Evapotranspiração de Referência (ETo): ${ETo.toFixed(2)} mm/dia`)
  }

  public getSensorData(): Sensor {
    return this.sensor
  }
}
