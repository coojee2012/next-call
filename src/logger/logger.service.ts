import { Injectable } from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import { Logger, createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import { join } from 'path';


@Injectable()
export class LoggerService {
  private context?: string;
  private logger: Logger;
  private logDir: string;

  public setContext(context: string): void {
    this.context = context;
  }
  constructor(private readonly configService: ConfigService) {
    this.logDir = join(__dirname, '../logs')
    this.logger = createLogger({
      // winston 格式定义
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        //format.prettyPrint(),
      ),
      // 生成文件
      // winston 文档中使用的方法为 new transports.File()
      // 因为加入日志归档等相关功能，所以使用transports.DailyRotateFile()方法来实现
      transports: [
        // 打印到控制台，生产可注释关闭该功能
        new transports.Console({
            level: 'debug'
        }),
        new transports.Console({
            level: 'error'
        }),
        new transports.Console({
          level: 'info'
      }),
        // 保存到文件
        // new transports.DailyRotateFile({
        //   // 日志文件文件夹，建议使用path.join()方式来处理，或者process.cwd()来设置，此处仅作示范
        //   dirname: this.logDir,
        //   // 日志文件名 %DATE% 会自动设置为当前日期
        //   filename: 'application-%DATE%.info.log',
        //   // 日期格式
        //   datePattern: 'YYYY-MM-DD',
        //   // 压缩文档，用于定义是否对存档的日志文件进行 gzip 压缩 默认值 false
        //   zippedArchive: true,
        //   // 文件最大大小，可以是bytes、kb、mb、gb
        //   maxSize: '20m',
        //   // 最大文件数，可以是文件数也可以是天数，天数加单位"d"，
        //   maxFiles: '7d',
        //   // 格式定义，同winston
        //   format: format.combine(
        //     format.timestamp({
        //       format: 'YYYY-MM-DD HH:mm:ss',
        //     }),
        //     format.json(),
        //   ),
        //   // 日志等级，不设置所有日志将在同一个文件
        //   level: 'info',
        // }),
        // 同上述方法，区分error日志和info日志，保存在不同文件，方便问题排查
        // new transports.DailyRotateFile({
        //   dirname: this.logDir,
        //   filename: 'application-%DATE%.error.log',
        //   datePattern: 'YYYY-MM-DD',
        //   zippedArchive: true,
        //   maxSize: '20m',
        //   maxFiles: '14d',
        //   format: format.combine(
        //     format.timestamp({
        //       format: 'YYYY-MM-DD HH:mm:ss',
        //     }),
        //     format.json(),
        //   ),
        //   level: 'error',
        // }),
        // 同上述方法，区分error日志和info日志，保存在不同文件，方便问题排查
        // new transports.DailyRotateFile({
        //     dirname: this.logDir,
        //     filename: 'application-%DATE%.warn.log',
        //     datePattern: 'YYYY-MM-DD',
        //     zippedArchive: true,
        //     maxSize: '20m',
        //     maxFiles: '10d',
        //     format: format.combine(
        //       format.timestamp({
        //         format: 'YYYY-MM-DD HH:mm:ss',
        //       }),
        //       format.json(),
        //     ),
        //     level: 'warn',
        //   }),
      ],
    });
  }

  // 错误日志记录
  error(ctx: any, message: string, meta?: Record<string, any>): Logger {
    return this.logger.error({
      message,
      contextNmae: this.context,
      ctx,
      ...meta,
    });
  }
  // 警告日志记录
  warn(ctx: any, message: string, meta?: Record<string, any>): Logger {
    return this.logger.warn({
      message,
      contextNmae: this.context,
      ctx,
      ...meta,
    });
  }
  // debug日志记录
  debug(ctx: any, message: string, meta?: Record<string, any>): Logger {
    return this.logger.debug({
      message,
      contextNmae: this.context,
      ctx,
      ...meta,
    });
  }
  // 基本日志记录
  info(ctx: any, message: string, meta?: Record<string, any>): Logger {
    return this.logger.info({
      message,
      contextNmae: this.context,
      ctx,
      ...meta,
    });
  }
}
