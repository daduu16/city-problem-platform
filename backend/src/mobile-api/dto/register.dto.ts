import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(7)
  phone!: string;

  @IsString()
  @Length(7, 7)
  finCode!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
