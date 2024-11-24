import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { RegisterInput } from 'src/auth/dto/register.input';
import { LoginInput } from 'src/auth/dto/login.input';
import { compareHash, hashPassword, PASSWORD_REGEX } from 'src/auth/auth.util';
import { assert } from 'src/utils/assert';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async challenge(loginInput: LoginInput): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: { email: loginInput.email },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const isCorrectPassword = await compareHash(
      loginInput.password,
      user.password,
    );
    if (!isCorrectPassword) {
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    if (!email) {
      throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
    }

    return this.userRepository.findOne({
      where: { email },
    });
  }

  async create(user: RegisterInput): Promise<User | undefined> {
    const existingUser = await this.userRepository.findOne({
      where: [
        {
          email: user.email,
        },
        {
          phoneNumber: user.phoneNumber,
        },
      ],
    });

    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }

    const isPasswordValid = PASSWORD_REGEX.test(user.password);

    assert(isPasswordValid, 'Password too weak', BadRequestException);

    user.password = await hashPassword(user.password);
    const newUser = this.userRepository.create(user);
    const newUserOnSave = await this.userRepository.save(newUser);
    return newUserOnSave;
  }

  async updateUserEmailVerified(user: User): Promise<User> {
    user.emailVerified = true;
    return await this.userRepository.save(user);
  }

  async generateApiKey(user: User): Promise<string> {
    if (user.apiKey) {
      throw new HttpException('API key already exists', HttpStatus.CONFLICT);
    }

    user.apiKey = uuidv4();
    await this.userRepository.save(user);
    return user.apiKey;
  }

  async getApiKey(user: User): Promise<string> {
    if (!user.apiKey) {
      throw new HttpException(
        'API key not found. Please generate a new one.',
        HttpStatus.NOT_FOUND,
      );
    }
    return user.apiKey;
  }
}
