import express from "express";
import cors from "cors";
import { SensorService } from "../../core/services/SensorService";
import { MqttClient } from "../mqtt/MqttClient";

export class Server {
  private app = express();
  private sensorService: SensorService;
  private mqttClient: MqttClient;

  constructor(sensorService: SensorService, mqttClient: MqttClient) {
    this.sensorService = sensorService;
    this.mqttClient = mqttClient;

    this.app.use(cors({
      origin: 'http://localhost:3000',                          // url do frontend
      methods: ['GET', 'POST', 'PUT', 'DELETE'],                // métodos permitidos
      allowedHeaders: ['Content-Type', 'Authorization'],        // headers permitidos
    }));

    // pra precisar permitir credenciais como cookies e autenticação:
    // this.app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

    this.routes();
  }

  private routes() {
    this.app.get("/sensors", (req, res) => {
      res.json(this.sensorService.getSensorData());
    });

    this.app.get("/errors", (req, res) => {
      res.json(this.mqttClient.getErrorMessages());
    });
  }

  public start(port: number) {
    this.app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  }
}
