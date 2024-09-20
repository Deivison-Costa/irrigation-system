import express from 'express'
import { SensorService } from '../../core/services/SensorService'

export class Server {
  private app = express()
  private sensorService: SensorService

  constructor(sensorService: SensorService) {
    this.sensorService = sensorService
    this.routes()
  }

  private routes() {
    this.app.get('/sensores', (req, res) => {
      res.json(this.sensorService.getSensorData())
    })
  }

  public start(port: number) {
    this.app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`)
    })
  }
}
