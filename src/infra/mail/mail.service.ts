import { Injectable } from '@nestjs/common';
import Logger from '@/infra/logger/logger.service';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from '@/common/constants';

export interface EmailPayload {
  html: string;
  to: string;
  subject: string;
}

@Injectable()
export class MailService {
  private readonly logger = Logger.getInstance('mail');
  private templatesCache = new Map<string, handlebars.TemplateDelegate>();
  private readonly transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  public compileTemplate(templateName: string, data: Record<string, any>): string {
    let template = this.templatesCache.get(templateName);

    if (!template) {
      const templatePath = join(process.cwd(), 'src', 'modules', 'notifications', 'templates', `${templateName}.hbs`);
      
      if (!existsSync(templatePath)) {
        this.logger.error(`Template not found: ${templatePath}`);
        return '';
      }

      const templateString = readFileSync(templatePath, 'utf-8');
      template = handlebars.compile(templateString);
      this.templatesCache.set(templateName, template);
    }

    return template(data);
  }

  public async sendBulk(emails: EmailPayload[], tag: string = 'default'): Promise<void> {
    this.logger.info(`Sending ${emails.length} email(s) with tag [${tag}]`);

    const results = await Promise.allSettled(
      emails.map(async (email) => {
        await this.transporter.sendMail({
          from: SMTP_FROM || 'noreply@lodgify.com',
          to: email.to,
          subject: email.subject,
          html: email.html,
        });
        this.logger.info(`[${tag}] Email sent to ${email.to}: ${email.subject}`);
      }),
    );

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      for (const failure of failures) {
        this.logger.error(`[${tag}] Email send failed:`, (failure as PromiseRejectedResult).reason);
      }
    }
  }
}
