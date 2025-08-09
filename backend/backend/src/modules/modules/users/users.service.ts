// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class UsersService {}

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    registerUserDto: RegisterUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    const { email, password, role } = registerUserDto;

    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new BadRequestException(`El email "${email}" ya está registrado.`);
    }

    const user = this.userRepository.create({
      email,
      password_hash: await bcrypt.hash(password, 10),
      role,
    });

    await this.userRepository.save(user);

    // --- CORRECCIÓN: Se omite la contraseña de forma segura ---
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...result } = user;
    return result;
  }

  // --- CORRECCIÓN: Se especifica el tipo de retorno correcto ---
  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }
}
