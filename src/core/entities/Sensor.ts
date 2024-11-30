export class Sensor {
  constructor(
    public temperature: number = 0, // Temperatura do ar [°C]
    public humidity: number = 0, // Umidade relativa do ar [%]
    public windSpeed: number = 0, // Velocidade do vento [m s^-1]
    public pressure: number = 0, // Pressão atmosférica [kPa]
    public luminosity: number = 0, // Luminosidade [lux]
    public soilMoisture: number = 0, // Umidade do solo [%]
    public ETo: number = 0, // Evapotranspiração de referência [mm day^-1]
    public TmaxC: number = 0, // Temperatura máxima [°C]
    public TminC: number = 0, // Temperatura mínima [°C]
    public Tmean: number = 0, // Temperatura média [°C]
    public Rs: number = 0, // Radiação solar [MJ m^-2 day^-1]
    public Rns: number = 0, // Radiação solar líquida [MJ m^-2 day^-1]
    public Ra: number = 0, // Radiação extraterrestre [MJ m^-2 day^-1]
    public Rso: number = 0, // Radiação de céu limpo [MJ m^-2 day^-1]
    public Rnl: number = 0, // Radiação líquida de ondas longas [MJ m^-2 day^-1]
    public Rn: number = 0, // Radiação líquida total [MJ m^-2 day^-1]
    public delta: number = 0, // Variação da pressão de vapor [kPa °C^-1]
    public gamma: number = 0, // Constante psicométrica [kPa °C^-1]
    public es: number = 0, // Pressão de saturação do vapor [kPa]
    public ea: number = 0, // Pressão de vapor atual [kPa]
  ) {}
}
