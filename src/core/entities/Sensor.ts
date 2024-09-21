export class Sensor {
  constructor(
    public temperature: number = 0,
    public humidity: number = 0,
    public windSpeed: number = 0,
    public pressure: number = 0,
    public luminosity: number = 0,
    public soilMoisture: number = 0,
    public ETo: number = 0,
  ) {}
}
