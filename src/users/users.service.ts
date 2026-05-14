import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesService } from '../roles/roles.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly rolesService: RolesService,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: { roles: true },
    });
  }

  create(data: Partial<User>) {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  findById(id: string) {
    return this.usersRepository.findOne({
      where: { id },
      relations: { roles: true },
    });
  }

  async findAll() {
    try {
      const users = await this.usersRepository.find({
        relations: { roles: true },
        order: { createdAt: 'DESC' },
      });

      return users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles?.map((role) => role.roleName) ?? [],
      }));
    } catch {
      throw new InternalServerErrorException('Error al listar usuarios');
    }
  }

  async assignRoles(userId: string, roleNames: string[]) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const uniqueRoleNames = [...new Set(roleNames)];
    const roles = await this.rolesService.findByNames(uniqueRoleNames);

    if (roles.length !== uniqueRoleNames.length) {
      throw new BadRequestException('roles inválidos');
    }

    user.roles = roles;
    await this.usersRepository.save(user);

    return {
      message: 'Roles asignados',
    };
  }
}
