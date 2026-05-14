import { IsIn } from 'class-validator';
import { APPOINTMENT_STATUSES } from '../entities/appointment.entity';
import type { AppointmentStatus } from '../entities/appointment.entity';

export class UpdateAppointmentStatusDto {
  @IsIn(APPOINTMENT_STATUSES, { message: 'Estado invalido' })
  status: AppointmentStatus;
}
