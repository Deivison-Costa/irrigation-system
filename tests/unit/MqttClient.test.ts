import { MqttClient } from "../../src/infrastructure/mqtt/MqttClient";
import { SensorService } from "../../src/core/services/SensorService";
import * as mqtt from "mqtt";
import env from "../../src/env/env";
import * as fs from "fs";

const caFilePath = env.EMQX_PATH_CA;
const caCert = fs.readFileSync(caFilePath);

const mqttUrl = env.MQTT_URL;
const mqttOptions = {
  clientId: env.MQTT_CLIENT_ID,
  username: env.MQTT_USERNAME,
  password: env.MQTT_PASSWORD,
  ca: [caCert],
};

jest.mock("mqtt", () => ({
  connect: jest.fn().mockReturnValue({
    on: jest.fn((event, callback) => {
      if (event === "connect") {
        callback();
      }
    }),
    subscribe: jest.fn(),
  }),
}));

describe("MqttClient", () => {
  let sensorService: SensorService;
  let mqttClient: MqttClient;

  beforeEach(() => {
    sensorService = {
      updateSensorData: jest.fn(),
      updateGeolocation: jest.fn(),
      getSensorData: jest.fn(),
    } as unknown as SensorService;
    mqttClient = new MqttClient(sensorService, mqttUrl, mqttOptions);
  });

  it("deve se inscrever nos tópicos corretos", () => {
    expect(mqtt.connect(mqttUrl, mqttOptions).subscribe).toHaveBeenCalledWith(
      "sensors/windSpeed",
      expect.any(Function),
    );
  });

  it("deve atualizar dados do sensor ao receber mensagem MQTT", () => {
    const mockMessage = Buffer.from("25");
    mqttClient["onMessage"]("sensors/temperature", mockMessage);

    expect(sensorService.updateSensorData).toHaveBeenCalledWith({
      temperature: 25,
    });
  });
});
