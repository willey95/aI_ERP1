import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  CFO = 'CFO',
  TEAM_LEAD = 'TEAM_LEAD',
  RM_TEAM = 'RM_TEAM',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
