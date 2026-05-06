import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MailService } from '../mail/mail.service.js';

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('send')
  async handleSend(job: Job<EmailJobData>) {
    this.logger.log(`Processing email job ${job.id} → ${job.data.to}`);
    await this.mailService.send(job.data);
  }
}


