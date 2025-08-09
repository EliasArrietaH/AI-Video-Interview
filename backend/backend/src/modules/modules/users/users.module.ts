import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Importa la entidad User
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule], // Exporta UsersService y TypeOrmModule
})
export class UsersModule {}
