import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Response } from 'express';
import type { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,  
  ) {
    const result = await this.authService.register(dto);

    return result.user;
  }

  @Get("verify-email")
  async verifyEmail(
    @Res({ passthrough: true }) res: Response,  
    @Query('token') token: string,
  ) {
    const user = await this.authService.verifyEmail(token);

    res.cookie(
      'access_token',
      user.accessToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      },
    );

    res.cookie(
      'refresh_token',
      user.refreshToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    );

    return user;
  }

  @Post("refresh")
  async refresh(
    @Res({ passthrough: true }) res: Response,  
  ) {
    const user = await this.authService.refresh(res.cookie['refresh_token']);

    res.cookie(
      'access_token',
      user.accessToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      },
    );

    res.cookie(
      'refresh_token',
      user.newRefreshToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    );

    return user;
  }

  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,  
  ) {
    const user = await this.authService.login(dto);

    res.cookie(
      'access_token',
      user.accessToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      },
    );

    res.cookie(
      'refresh_token',
      user.refreshToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    );

    return user;
  }

  @Post("logout")
  async logout(
    @Res({ passthrough: true }) res: Response,  
  ) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return {};
  }

  @Post("forgot-password")
  async forgotPassword(
    @Body() dto: { email: string },
    @Res({ passthrough: true }) res: Response,  
  ) {
    await this.authService.forgotPassword(dto);

    return "Email enviado com instruções para resetar a senha";
  }

  @Post("reset-password")
  async resetPassword(
    @Body() dto: { token: string, password: string },
    @Res({ passthrough: true }) res: Response,  
  ) {
    await this.authService.resetPassword(dto);

    return "Senha redefinida com sucesso";
  }
}
