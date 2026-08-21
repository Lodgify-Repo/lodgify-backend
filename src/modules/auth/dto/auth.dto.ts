import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (min 8 characters)', example: 'SecureP@ss1', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Phone number (E.164 format)', example: '+2348012345678' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'SecureP@ss1' })
  @IsString()
  password: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Email address for password reset', example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}

export class NewPasswordDto {
  @ApiProperty({ description: 'Password reset token from email link' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'New password (min 8 characters)', example: 'NewSecureP@ss1', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
