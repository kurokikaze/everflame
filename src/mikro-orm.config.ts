import { LoadStrategy, Options } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/sqlite';

const config: Options = defineConfig({
  clientUrl: './database.sqlite',
  entities: ['./**/*.entity.js', './**/*.embeddable.js'],
  entitiesTs: ['./**/*.entity.ts', './**/*.embeddable.ts'],
  loadStrategy: LoadStrategy.JOINED,
  allowGlobalContext: true,
});

export default config;
