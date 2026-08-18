import { Injectable } from '@nestjs/common';
import Logger from '@/infra/logger/logger.service';
import * as handlebars from 'handlebars';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface EmailPayload {
  html: string;
  to: string;
  subject: string;
}

@Injectable()
export class MailService {
  private readonly logger = Logger.getInstance('mail');
  private templatesCache = new Map<string, handlebars.TemplateDelegate>();

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
    this.logger.info(`Sending ${emails.length} emails with tag [${tag}]`);
    
    // TODO: Implement actual email sending via SendGrid/AWS SES/SMTP
    for (const email of emails) {
      this.logger.info(`[MOCK] Sent email to ${email.to}: ${email.subject}`);
    }
  }
}
