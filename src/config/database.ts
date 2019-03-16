export default {
    type: 'postgres',
    host: process.env.TYPEORM_HOST,
    port: parseInt(process.env.TYPEORM_PORT, 10),
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    logging: process.env.TYPEORM_LOGGING === 'true',
    synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
    migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN === 'true',
    entities: [
        'src/**/**.entity.ts',
        'dist/**/**.entity.js',
    ],
    migrations: [
        'src/migrations/**/*.ts',
        'dist/migrations/**/*.js',
    ],
    subscribers: [
        'src/subscriber/**/*.ts',
        'dist/subscriber/**/*.js',
    ],
    cli: {
        migrationsDir: 'src/migrations',
    },
};
