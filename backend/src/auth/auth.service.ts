import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
      },
    });

    const verificationToken = crypto.randomUUID();

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ),
      },
    });

    await this.mailService.sendVerificationEmail(
      user.email,
      verificationToken
    );

    return {
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async verifyEmail(token: string) {
    const emailVerification = await this.prisma.emailVerification.findUnique({
      where: {
        token,
      },
    });

    if (!emailVerification) {
      throw new NotFoundException('Email não encontrado');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: emailVerification.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenHash,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ),
      },
    });

    await this.prisma.emailVerification.delete({
      where: {
        token,
      },
    });

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken, refreshToken,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        expiresIn: '15m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
      },
      {
        expiresIn: '30d',
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(user.id, user.email);
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenHash,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken, newRefreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new NotFoundException('Senha incorreta');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken,
      refreshToken: refreshTokenHash,
    };
  }

  async forgotPassword(dto: { email: string }) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const verificationToken = crypto.randomUUID();

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ),
      },
    });

    await this.mailService.sendPasswordResetEmail(
      user.email,
      verificationToken
    );

    return
  }

  async resetPassword(dto: { token: string, password: string }) {
    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: {
        token: dto.token,
      },
    });

    if (!passwordReset) {
      throw new NotFoundException('Token inválido');
    }

    if (passwordReset.expiresAt < new Date()) {
      throw new NotFoundException('Token expirado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: {
        id: passwordReset.userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    await this.prisma.passwordReset.delete({
      where: {
        token: dto.token,
      },
    });
  }
}