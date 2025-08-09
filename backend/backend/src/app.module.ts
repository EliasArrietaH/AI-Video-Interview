import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InterviewsModule } from './modules/modules/interviews/interviews.module';
import { JobsModule } from './modules/modules/jobs/jobs.module';
import { UsersModule } from './modules/modules/users/users.module';
import { ChatGateway } from './modules/modules/chat/chat.gateway';
import { ServicesModule } from './modules/services/services.module';
import { AuthModule } from './modules/modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: true,
      }),
    }),

    InterviewsModule,
    JobsModule,
    UsersModule,
    ServicesModule,
    AuthModule,
  ],
  providers: [ChatGateway],
})
export class AppModule {}
