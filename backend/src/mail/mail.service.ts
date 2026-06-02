import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend = new Resend(
    process.env.RESEND_API_KEY,
  );

  async sendVerificationEmail(
    email: string,
    token: string,
  ) {
    const url =
      `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await this.resend.emails.send({
      from: 'TinyURL <onboarding@resend.dev>',
      to: email,
      subject: 'Confirme seu email',
      html: `
        <h1>Confirme seu email</h1>
        <p>Clique no link abaixo:</p>
        <a href="${url}">
          Confirmar Email
        </a>
      `,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
  ) {
    const url =
      `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: 'TinyURL <onboarding@resend.dev>',
      to: email,
      subject: 'Redefina sua senha',
      html: `
        <h1>Redefina sua senha</h1>
        <p>Clique no link abaixo:</p>
        <a href="${url}">
          Redefinir Senha
        </a>
      `,
    });
  }
}