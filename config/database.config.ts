import {registerAs} from '@nestjs/config';

export default registerAs('database',()=>({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 3306,
    username: process.env.DATABASE_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD || '123456Aa',
    database: process.env.DATABASE_DB || 'dark-forest2'
}));

export interface IDtabaseConifg {
    host: string;
    port: number;
    username: string;
    password: string;
    databse: string;
}