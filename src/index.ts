import { SensorService } from "./core/services/SensorService";
import { MqttClient } from "./infrastructure/mqtt/MqttClient";
import { Server } from "./infrastructure/http/Server";
import { SensorRepository } from "./infrastructure/repositories/SensorRepository"; // Importa o repositório
import * as fs from "fs";
import env from "./env/env";

const sensorRepository = new SensorRepository();

const sensorService = new SensorService(sensorRepository);

const caFilePath = env.EMQX_PATH_CA;
const caCert = fs.readFileSync(caFilePath);

const mqttUrl = env.MQTT_URL;
const mqttOptions = {
  clientId: env.MQTT_CLIENT_ID,
  username: env.MQTT_USERNAME,
  password: env.MQTT_PASSWORD,
  ca: [caCert],
};

const mqttClient = new MqttClient(sensorService, mqttUrl, mqttOptions);

const server = new Server(sensorService, mqttClient);
server.start(3000);
