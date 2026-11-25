import { defineConfig, LoadStrategy } from "@mikro-orm/sqlite";

export default defineConfig({
    clientUrl: 'everflame',
    dbName: process.env.DATABASE_URL ?? 'database/everflame.sqlite',
    entities: ['./**/*.entity.js', './**/*.embeddable.js'],
    entitiesTs: ['./**/*.entity.ts', './**/*.embeddable.ts'],
    loadStrategy: LoadStrategy.JOINED,
    allowGlobalContext: true,
})
