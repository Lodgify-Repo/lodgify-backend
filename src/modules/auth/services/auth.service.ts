import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DomainError } from '@/common/domain/error';
import { AuthErrorCodes } from '../errors';
import { QueueService } from '@/infra/queue/queue.service';
import { EMAIL_QUEUE_NAME } from '@/infra/queue/email.worker';

@Injectable()
export class AuthService extends Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly queueService: QueueService,
  ) {
    super();
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new DomainError(AuthErrorCodes.USER_NOT_FOUND, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new DomainError(AuthErrorCodes.ACCOUNT_DISABLED, 'Account is disabled');
    }

    if (!user.password) {
      throw new DomainError(AuthErrorCodes.INVALID_CREDENTIALS, 'Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    
    throw new DomainError(AuthErrorCodes.INVALID_CREDENTIALS, 'Invalid credentials');
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = crypto.randomUUID();
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    };
  }

  async refreshToken(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { refreshToken: token },
    });
    if (!user) {
      throw new DomainError(AuthErrorCodes.INVALID_CREDENTIALS, 'Invalid refresh token');
    }
    return this.login(user);
  }

  async googleLogin(profile: any) {
    if (!profile) {
      throw new DomainError(AuthErrorCodes.INVALID_CREDENTIALS, 'No user from google');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.googleId, avatarUrl: profile.avatarUrl },
      });
    }

    return this.login(user);
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new DomainError(AuthErrorCodes.USER_ALREADY_EXISTS, 'User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const newUser = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
        role: registerDto.role,
      },
    });

    const { password, ...result } = newUser;
    return result;
  }

  async forgotPassword(resetDto: { email: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: resetDto.email } });
    if (!user) return; 

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires },
    });

    const resetLink = `https://lodgify.com/reset-password?token=${resetToken}`;
    
    // Fallback if MailService is not injected directly in AuthService, but wait, 
    // we should just inject MailService. However, modifying constructor impacts tests/DI.
    // Let's pass the payload to the queue and let the email worker compile it, OR 
    // just inline the HTML exactly as it would be compiled.
    // Actually, I can just write the HTML here to match the template or leave the worker to do it?
    // Let's use the template compiler in the worker if we can. Wait, QueueService just sends emails.
    // I will compile it here by importing Handlebars directly if I have to, OR better yet, let's inject MailService.
    
    // Let's construct a cleaner HTML string matching the template since MailService isn't injected.
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .btn { display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request 🔐</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <p>To reset your password, please click the button below:</p>
        <div style="text-align: center;">
          <a href="${resetLink}" class="btn">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #666;">This link is secure and will expire in exactly 1 hour.</p>
      </div>
    </body>
    </html>`;

    await this.queueService.addJob(EMAIL_QUEUE_NAME, 'reset-password', {
      emails: [
        {
          to: user.email,
          subject: 'Password Reset Request',
          html,
        }
      ],
      tag: 'auth'
    });

    console.log(`Reset token for ${user.email}: ${resetToken}`);
  }

  async resetPassword(newPasswordDto: any) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: newPasswordDto.token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new DomainError(AuthErrorCodes.INVALID_CREDENTIALS, 'Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPasswordDto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });
  }
}
