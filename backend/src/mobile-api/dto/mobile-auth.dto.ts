import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class MobileLoginDto {
  @IsString()
  @MinLength(3)
  identifier!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class VerifyEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}

export class ResendCodeDto {
  @IsEmail()
  email!: string;
}

export class ForgotPasswordDto {
  @IsString()
  @MinLength(3)
  identifier!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}
