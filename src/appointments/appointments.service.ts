import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { Appointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly usersService: UsersService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    const patient = await this.usersService.findById(
      createAppointmentDto.patientId,
    );
    const doctor = await this.usersService.findById(
      createAppointmentDto.doctorId,
    );

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    const doctorRoles = doctor.roles?.map((role) => role.roleName) ?? [];

    if (!doctorRoles.includes('doctor')) {
      throw new BadRequestException('El usuario doctor debe tener rol doctor');
    }

    const appointment = this.appointmentsRepository.create({
      patient,
      doctor,
      datetime: new Date(createAppointmentDto.datetime),
    });

    const savedAppointment =
      await this.appointmentsRepository.save(appointment);

    return {
      message: 'Cita creada con exito',
      appointment: this.toResponse(savedAppointment),
    };
  }

  async findAll() {
    const appointments = await this.appointmentsRepository.find({
      relations: { patient: true, doctor: true },
      order: { datetime: 'ASC' },
    });

    return appointments.map((appointment) => this.toResponse(appointment));
  }

  async findMine(userId: string) {
    const appointments = await this.appointmentsRepository.find({
      where: [{ patient: { id: userId } }, { doctor: { id: userId } }],
      relations: { patient: true, doctor: true },
      order: { datetime: 'ASC' },
    });

    return appointments.map((appointment) => this.toResponse(appointment));
  }

  async findMineDoc(doctorId: string) {
    const appointments = await this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .where('appointment.doctor_id = :doctorId', { doctorId })
      .orderBy('appointment.datetime', 'ASC')
      .getMany();

    return appointments.map((appointment) => this.toResponse(appointment));
  }

  async updateStatus(
    appointmentId: number,
    updateAppointmentStatusDto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: appointmentId },
      relations: { patient: true, doctor: true },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    appointment.status = updateAppointmentStatusDto.status;
    const savedAppointment =
      await this.appointmentsRepository.save(appointment);

    return {
      message: 'Estado de cita actualizado',
      appointment: this.toResponse(savedAppointment),
    };
  }

  async deleteAppointment(appointmentId: number, userId: string) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: appointmentId },
      relations: { patient: true },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (appointment.patient.id !== userId) {
      throw new ForbiddenException(
        'No puedes eliminar una cita de otro usuario',
      );
    }

    await this.appointmentsRepository.remove(appointment);

    return {
      message: 'Cita eliminada con exito',
    };
  }

  private toResponse(appointment: Appointment) {
    return {
      id: appointment.id,
      datetime: appointment.datetime,
      status: appointment.status,
      patient: {
        id: appointment.patient.id,
        email: appointment.patient.email,
        name: appointment.patient.name,
      },
      doctor: {
        id: appointment.doctor.id,
        email: appointment.doctor.email,
        name: appointment.doctor.name,
      },
    };
  }
}
