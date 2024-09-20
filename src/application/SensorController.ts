import { Request, Response } from 'express'
import { SensorService } from '../core/services/SensorService'

export class SensorController {
  constructor(private sensorService: SensorService) {}

  public getSensorData(req: Request, res: Response) {
    res.json(this.sensorService.getSensorData())
  }
}
