import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, {
    message: 'Email inválido',
  })
  email!: string;

  @IsString()
  @MinLength(8, {
    message: 'A senha deve ter pelo menos 8 caracteres',
  })
  @MaxLength(100)
  password!: string;
}