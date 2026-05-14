# Guia Preparcial NestJS Auth + Roles + TypeORM

## Comandos utiles

Instalar dependencias:

```bash
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/config
npm install @nestjs/passport passport passport-jwt @nestjs/jwt
npm install -D @types/passport-jwt
npm install bcryptjs
npm install class-validator class-transformer
```

Generar modulos base:

```bash
nest g module users
nest g service users
nest g controller users --no-spec

nest g module roles
nest g service roles
nest g controller roles --no-spec

nest g module auth
nest g service auth --no-spec
nest g controller auth --no-spec
```

Generar clases sin carpeta extra:

```bash
nest g cl users/entities/user.entity --no-spec --flat
nest g cl roles/entities/role.entity --no-spec --flat
nest g cl auth/dto/register.dto --no-spec --flat
nest g cl auth/dto/login.dto --no-spec --flat
nest g cl roles/dto/create-role.dto --no-spec --flat
nest g cl users/dto/assign-roles.dto --no-spec --flat
```

Comandos de verificacion:

```bash
npm run build
npm run test -- --runInBand
npm run format
npm run start:dev
```

Si PowerShell no deja usar `npm`, usar:

```bash
npm.cmd run build
```

## Variables de entorno

El archivo `.env` real no se sube. Se sube `.env.example`.

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=parcial_web_nest

JWT_SECRET=secret_para_desarrollo
JWT_EXPIRES_IN=120s
```

## SQL

Orden recomendado:

```bash
psql -U postgres -d parcial_web_nest -f sql/001_create_tables.sql
psql -U postgres -d parcial_web_nest -f sql/002_seed_users_roles.sql
psql -U postgres -d parcial_web_nest -f sql/003_create_appointments.sql
```

## Conceptos clave

`TypeOrmModule.forRootAsync()` conecta toda la app a PostgreSQL.

`TypeOrmModule.forFeature([Entity])` permite usar repositorios dentro de un modulo.

```ts
@InjectRepository(User)
private readonly usersRepository: Repository<User>
```

`ConfigModule.forRoot({ isGlobal: true })` permite usar variables de entorno en toda la app.

`synchronize: true` crea tablas automaticamente, util para practicar.

`synchronize: false` es mejor para entrega, porque obliga a usar SQL o migraciones.

## Entidades

`User` y `Role` tienen relacion muchos a muchos:

```txt
users <-> users_roles <-> roles
```

En TypeORM:

```ts
@ManyToMany(() => Role, (role) => role.users)
@JoinTable(...)
roles: Role[];
```

`Appointment` practica una relacion probable de parcial:

```txt
appointments
- patient_id -> users.id
- doctor_id -> users.id
```

En TypeORM:

```ts
@ManyToOne(() => User)
patient: User;

@ManyToOne(() => User)
doctor: User;
```

## Validacion

Se activa en `main.ts`:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
);
```

Los DTOs validan el body:

```ts
@IsEmail()
email: string;

@IsString()
@IsNotEmpty()
password: string;
```

## Auth

`POST /auth/register`:

- valida DTO
- revisa email repetido
- hashea password con `bcryptjs`
- guarda usuario
- devuelve `userId`

`POST /auth/login`:

- busca usuario
- compara password
- revisa `isActive`
- firma JWT
- devuelve `access_token`

Payload del token:

```ts
{
  sub: user.id,
  email: user.email,
  roles: [...]
}
```

## Passport JWT

`JwtAuthGuard` protege rutas:

```ts
@UseGuards(JwtAuthGuard)
```

`JwtStrategy` lee:

```txt
Authorization: Bearer <token>
```

con:

```ts
ExtractJwt.fromAuthHeaderAsBearerToken()
```

Si el token es valido, `validate()` retorna el usuario y queda disponible en:

```ts
request.user
```

## Roles

Decorador:

```ts
@Roles('admin')
```

Guards:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
```

Orden mental:

```txt
JwtAuthGuard -> autentica y llena request.user
RolesGuard   -> revisa request.user.roles
```

## Endpoints principales

Auth:

```txt
POST /auth/register
POST /auth/login
```

Users:

```txt
GET /users/me              autenticado
GET /users                 admin
PATCH /users/:id/roles     admin
```

Roles:

```txt
POST /roles                admin
GET /roles                 admin
```

Appointments simulacro:

```txt
POST /appointments             admin, doctor
GET /appointments              admin
GET /appointments/me           autenticado
PATCH /appointments/:id/status admin, doctor
```

## Errores importantes

```ts
throw new ConflictException('Email ya registrado');
throw new UnauthorizedException('Credenciales incorrectas');
throw new ForbiddenException('No autorizado');
throw new NotFoundException('Usuario no encontrado');
throw new BadRequestException('roles invalidos');
throw new HttpException('Usuario desactivado', HttpStatus.LOCKED);
```

## Idea central para el parcial

Controller recibe HTTP.

Service contiene logica de negocio.

Repository habla con base de datos.

DTO valida entrada.

Guard decide si la request pasa.

Strategy valida JWT.

Decorador `@Roles()` guarda metadata.

`RolesGuard` lee metadata y compara roles.
