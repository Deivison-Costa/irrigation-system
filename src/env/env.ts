import { z } from "zod";
import { config } from "dotenv";
import * as fs from "fs";

config();

const envSchema = z.object({
  MQTT_URL: z.string().url(),
  MQTT_CLIENT_ID: z.string().min(1),
  MQTT_USERNAME: z.string().min(1),
  MQTT_PASSWORD: z.string().min(1),
  EMQX_PATH_CA: z
    .string()
    .min(1)
    .refine(
      (path) => {
        return fs.existsSync(path);
      },
      {
        message: "EMQX_PATH_CA não aponta para um arquivo existente",
      },
    ),
  OPEN_WEATHER_API_KEY: z.string().min(1),
});

const env = envSchema.parse(process.env);

export default env;
