import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationModule } from './organization/organization.module';
import { ReceiverModule } from './receiver/receiver.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Connection } from 'typeorm';
import { UserModule } from './user/user.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';

@Module({
    imports: [
        ConfigModule.load(path.resolve(__dirname, 'config', '**', '!(*.d).{ts,js}')),
        TypeOrmModule.forRootAsync({
            useFactory: (config: ConfigService) => config.get('database'),
            inject: [ConfigService],
        }),
        SharedModule,
        OrganizationModule,
        ReceiverModule,
        UserModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    /*
    static forRoot(environment: any): DynamicModule {
        return {
            module: AppModule,
            imports: [
                TypeOrmModule.forRoot({
                    ...typeOrmDefaultOptions,
                    username: environment.DATABASE_USER,
                    password: environment.DATABASE_PASSWORD,
                    database: environment.DATABASE_NAME,
                }),
                ConfigModule,
                SharedModule,
                OrganizationModule,
                ReceiverModule,
                UserModule,
                AuthModule,
            ],
            controllers: [AppController],
            providers: [AppService],
        };
    }
    */
    constructor(private readonly connection: Connection) {
        if (connection) {
            Logger.log(`Connected to database ${connection.isConnected}`, 'AppModule');
        }
    }
}
