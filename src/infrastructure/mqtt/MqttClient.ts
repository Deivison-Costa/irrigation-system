import * as mqtt from 'mqtt'
import { Sensor } from '../../core/entities/Sensor'
import { SensorService } from '../../core/services/SensorService'

export class MqttClient {
  private client: mqtt.MqttClient
  private sensorService: SensorService

  constructor(sensorService: SensorService, url: string, options: mqtt.IClientOptions) {
    this.sensorService = sensorService
    this.client = mqtt.connect(url, options)

    this.client.on('connect', () => this.onConnect())
    this.client.on('message', (topic, message) => this.onMessage(topic, message))
    this.client.on('error', (err) => console.error('Erro MQTT:', err))
  }

  private onConnect() {
    console.log('Conectado ao broker MQTT')
    const topics = [
      'sensors/windSpeed', 'sensors/temperature', 'sensors/humidity',
      'sensors/luminosity', 'sensors/pressure', 'sensors/lm393', 'sensors/errors'
    ]

    topics.forEach(topic => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Erro ao se inscrever no tópico: ${topic}`)
        }
        else {
          console.log(`Sucesso ao se inscrever no tópico: ${topic}`)
        }
      })
    })
  }

  private onMessage(topic: string, message: Buffer) {
    const data = message.toString()
    const updatedData: Partial<Sensor> = {}

    switch (topic) {
      case 'sensors/windSpeed':
        updatedData.windSpeed = parseFloat(data)
        break
      case 'sensors/temperature':
        updatedData.temperature = parseFloat(data)
        break
      case 'sensors/humidity':
        updatedData.humidity = parseFloat(data)
        break
      case 'sensors/luminosity':
        updatedData.luminosity = parseFloat(data)
        break
      case 'sensors/pressure':
        updatedData.pressure = parseFloat(data)
        break
      case 'sensors/lm393':
        updatedData.soilMoisture = parseFloat(data)
        break
    }

    this.sensorService.updateSensorData(updatedData)
  }
}