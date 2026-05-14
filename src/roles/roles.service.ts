import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const existingRole = await this.rolesRepository.findOne({
      where: { roleName: createRoleDto.role_name },
    });

    if (existingRole) {
      throw new ConflictException('role_name ya existe');
    }

    const role = this.rolesRepository.create({
      roleName: createRoleDto.role_name,
      description: createRoleDto.description,
    });

    const savedRole = await this.rolesRepository.save(role);

    return {
      message: 'Rol creado con éxito',
      roleId: savedRole.id,
    };
  }

  async findAll() {
    try {
      const roles = await this.rolesRepository.find({
        select: {
          id: true,
          roleName: true,
          description: true,
        },
      });

      return roles.map((role) => ({
        id: role.id,
        role_name: role.roleName,
        description: role.description,
      }));
    } catch {
      throw new InternalServerErrorException('Error al obtener roles');
    }
  }

  findByNames(roleNames: string[]) {
    return this.rolesRepository.find({
      where: roleNames.map((roleName) => ({ roleName })),
    });
  }
}
