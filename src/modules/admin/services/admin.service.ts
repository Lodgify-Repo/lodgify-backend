import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { UpdateUserStatusDto, VerifyAgentDto } from '../dto/admin.dto';
import { SystemLogsQueryDto, ClearLogsDto } from '../dto/system-logs.dto';
import { DomainError } from '@/common/domain/error';
import { AdminErrorCodes } from '../errors';
import { Prisma, AuditLogLevel, AuditLogAction } from '@prisma/client';
import Logger from '@/infra/logger/logger.service';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export interface AuditLogEntry {
  action: AuditLogAction;
  message: string;
  level?: AuditLogLevel;
  actorId?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AdminService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getAllUsers() {
    return await this.prisma.user.findMany({
      where: this.commonQueries.notDeleted,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new DomainError(AdminErrorCodes.TARGET_NOT_FOUND);
    }
    
    return await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: dto.status === 'ACTIVE' },
    });
  }

  async getPendingAgents() {
    return await this.prisma.agentProfile.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
  }

  async verifyAgent(agentProfileId: string, dto: VerifyAgentDto) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { id: agentProfileId } });
    if (!profile) {
      throw new DomainError(AdminErrorCodes.TARGET_NOT_FOUND);
    }

    return await this.prisma.agentProfile.update({
      where: { id: agentProfileId },
      data: { status: dto.status },
    });
  }

  // System Logs — Audit Log queries + file-based log tailing

  async getSystemLogs(dto: SystemLogsQueryDto) {
    const source = dto.source ?? 'audit';
    const result: { audit?: any; files?: any } = {};

    if (source === 'audit' || source === 'all') {
      result.audit = await this.getAuditLogs(dto);
    }

    if (source === 'files' || source === 'all') {
      result.files = await this.getLogFileEntries(dto.filename ?? 'server', dto.tail ?? 200);
    }

    // When source is 'audit' (the default), return the paginated audit envelope directly
    if (source === 'audit') {
      return result.audit;
    }

    // When source is 'files', wrap file entries in an envelope
    if (source === 'files') {
      return {
        data: result.files.entries,
        meta: {
          filename: result.files.filename,
          linesReturned: result.files.entries.length,
        },
      };
    }

    // source === 'all': merge both
    return {
      data: {
        audit: result.audit.data,
        files: result.files.entries,
      },
      meta: {
        audit: result.audit.meta,
        files: {
          filename: result.files.filename,
          linesReturned: result.files.entries.length,
        },
      },
    };
  }

  /**
   * Fire-and-forget audit log writer.
   * Call from any service to record a structured audit event without blocking the request.
   */
  async writeAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          level: entry.level ?? AuditLogLevel.INFO,
          action: entry.action,
          message: entry.message,
          actorId: entry.actorId ?? null,
          actorEmail: entry.actorEmail ?? null,
          targetType: entry.targetType ?? null,
          targetId: entry.targetId ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          metadata: (entry.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      // Audit writes must never crash the calling service
      this.logger.error(`Failed to write audit log: ${(error as Error).message}`);
    }
  }

  /**
   * Purge audit log entries older than `retentionDays`.
   */
  async clearAuditLogs(dto: ClearLogsDto) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (dto.retentionDays ?? 90));

    const result = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    this.logger.info(`Purged ${result.count} audit log entries older than ${dto.retentionDays ?? 90} days`);

    return { deleted: result.count, olderThan: cutoff.toISOString() };
  }

  // Private helpers
  private async getAuditLogs(dto: SystemLogsQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (dto.level) where.level = dto.level;
    if (dto.action) where.action = dto.action;
    if (dto.actorId) where.actorId = dto.actorId;

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
    }

    if (dto.search) {
      where.message = { contains: dto.search, mode: 'insensitive' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async getLogFileEntries(filename: string, tail: number) {
    const filePath = Logger.getLogFilePath(filename);

    if (!filePath) {
      const available = Logger.getAvailableLogFiles();
      throw new DomainError(
        AdminErrorCodes.LOG_FILE_NOT_FOUND,
        `Invalid log file "${filename}". Available: ${available.join(', ')}`,
      );
    }

    if (!existsSync(filePath)) {
      return { filename, entries: [] };
    }

    const raw = await readFile(filePath, 'utf-8');
    const lines = raw.split('\n').filter((line) => line.trim().length > 0);

    // Take the last `tail` lines (most recent)
    const sliced = lines.slice(-Math.min(tail, lines.length));

    const entries = sliced.map((line) => this.parseLogLine(line));

    return { filename, entries };
  }

  /**
   * Parses a Winston log line in the format:
   * [2026-08-19 13:07:45] INFO: Some message here
   */
  private parseLogLine(line: string): { timestamp: string | null; level: string | null; message: string } {
    const match = line.match(/^\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\]\s(\w+):\s(.+)$/s);
    if (match) {
      return { timestamp: match[1], level: match[2], message: match[3] };
    }
    return { timestamp: null, level: null, message: line };
  }
}

