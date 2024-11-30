import request from "supertest";
import { Server } from "../../src/infrastructure/http/Server";
import { SensorService } from "../../src/core/services/SensorService";
import { SensorRepository } from "../../src/infrastructure/repositories/SensorRepository";
import { MqttClient } from "../../src/infrastructure/mqtt/MqttClient";

describe("API e2e tests", () => {
  let server: Server;
  let sensorService: SensorService;
  let repository: SensorRepository;

  beforeEach(() => {
    repository = new SensorRepository();
    sensorService = new SensorService(repository);
    const mockMqttClient = {
      getErrorMessages: jest.fn().mockReturnValue([]),
    } as unknown as MqttClient;
    server = new Server(sensorService, mockMqttClient);
  });

  it("deve retornar os dados do sensor na rota /sensores", async () => {
    const response = await request(server["app"]).get("/sensors");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("temperature");
    expect(response.body).toHaveProperty("humidity");
  });

  it("deve retornar mensagens de erro MQTT na rota /errors", async () => {
    const response = await request(server["app"]).get("/errors");
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
});
