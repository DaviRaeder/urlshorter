import { IsString, MaxLength, MinLength } from "class-validator";

export class UpdateAccountDto {
  @IsString()
  @MaxLength(100)
  actualPassword?: string;

  @IsString()
  @MinLength(8, {
    message: 'A senha deve ter pelo menos 8 caracteres',
  })
  @MaxLength(100)
  newPassword?: string;
}