import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis = require('ioredis');
import { Redis, RedisOptions } from 'ioredis'
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class RedisService {
    private clientsNames: string[];
    private clients: Redis[];
    private redisOptions: RedisOptions;
    private namePrefix: string;
    constructor(private logger: LoggerService, private config: ConfigService) {
        this.clientsNames = [];
        this.clients = [];
        this.namePrefix = '';
        this.redisOptions = {
            host: this.config.get('redis.host'),
            port: this.config.get('redis.port'),
            password: this.config.get('redis.password', undefined),
        }
    }

    async addClient(db: number = 0, name: string = 'esl-default') {
        try {
            const clientName = `${this.namePrefix}-${name}`;
            if (this.clientsNames.includes(clientName)) {
                this.logger.warn('RedisService',`Redis Client [${clientName}] Is Aready Exists!`);
                return;
            }
            const opts: RedisOptions = Object.assign({}, this.redisOptions, { db })
            const client: Redis = new Redis(opts);
            this.clientsNames.push(clientName);
            this.clients.push(client);
            this.listenClientEvents(this.clientsNames.length - 1);

            await new Promise((resolve:any,reject:any)=>{
                client.once('ready', () => {
                    resolve();
                })
            })        
        } catch (ex) {
            return Promise.reject(ex);
        }
    }

    getClientByName(name: string): Redis | null {
        const clientName = `${this.namePrefix}-${name}`;
        const index = this.clientsNames.indexOf(clientName);
        if (index > -1) {
            return this.clients[index];
        } else {
            return null;
        }
    }

    listenClientEvents(index: number) {
        try {
            if (index < 0 || index >= this.clientsNames.length || index >= this.clients.length) {
                throw new Error(` reids client ${index} is not exists!`);
            }
            const clientName = this.clientsNames[index];
            this.clients[index].once('connect', () => {
                this.logger.debug('RedisService',`Redis Client [${clientName}] Connected.`);
            })
            this.clients[index].on('ready', () => {
                this.logger.debug('RedisService',`Redis Client [${clientName}] Is Ready.`);
            })
            this.clients[index].on('error', (err) => {
                this.logger.debug('RedisService',`Redis Client [${clientName}] Error:`, err);
            })
            this.clients[index].on('close', () => {
                this.logger.debug('RedisService',`Redis Client [${clientName}] Is Closed.`);
            })
            this.clients[index].on('reconnecting', () => {
                this.logger.debug('RedisService',`Redis Client [${clientName}] Is Reconnecting.....`);
            })
            this.clients[index].on('end', () => {
                this.logger.debug('RedisService',`Redis Client [${clientName}] Is Ended.`);
                this.clientsNames.splice(index, 1);
                this.clients.splice(index, 1);
            })

        } catch (ex) {
            this.logger.error('RedisService','listenClientEvents Error:', {ex})
        }
    }
    setNamePrefix(prefix: string) {
        this.namePrefix = prefix;
    }
}
