import { Body, Controller, Delete, Get, Post, Put, Query, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Response, Request } from 'express';
import type { LoginDto } from './dto/login.dto';
import type { UpdateAccountDto } from './dto/update.dto';

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
    @Req() req: Request,
  ) {
    const user = await this.authService.refresh(req.cookies['refresh_token']);

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
    @Req() req: Request
  ) {
    await this.authService.forgotPassword(req.cookies['access_token']);

    return "Email enviado com instruções para resetar a senha";
  }

  @Post("reset-password")
  async resetPassword(
    @Body() dto: { token: string, password: string },
  ) {
    await this.authService.resetPassword(dto);

    return "Senha redefinida com sucesso";
  }

  @Get("me")
  async me(@Req() req: Request) {
    const user = await this.authService.getUser(req.cookies['access_token']);

    return user;
  }

  @Delete("delete-account")
  async deleteAccount(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.deleteAccount(req.cookies['access_token']);
    
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  
    return {};
  }

  @Put('account')
  async updateAccount(
    @Body() body: UpdateAccountDto,
    @Req() req: Request,
  ) {
    const user = await this.authService.updateAccount(req.cookies['access_token'], body);
    
    return user;
  }
}
