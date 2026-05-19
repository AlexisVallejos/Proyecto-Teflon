import 'dotenv/config';
import fs from 'node:fs/promises';
import { app } from './app.js';
import { config } from './config.js';

await fs.mkdir(config.uploadsRoot, { recursive: true });

app.listen(config.port, () => {
  console.log(`uploads-service listening on :${config.port}`);
  console.log(`uploads root: ${config.uploadsRoot}`);
});

