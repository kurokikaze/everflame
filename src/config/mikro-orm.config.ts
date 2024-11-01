import { defineConfig, LoadStrategy } from "@mikro-orm/sqlite";

export default defineConfig({
    clientUrl: 'everflame',
    dbName: 'database/everflame.sqlite',
    entities: ['./**/*.entity.js', './**/*.embeddable.js'],
    entitiesTs: ['./**/*.entity.ts', './**/*.embeddable.ts'],
    loadStrategy: LoadStrategy.JOINED,
    allowGlobalContext: true,
})