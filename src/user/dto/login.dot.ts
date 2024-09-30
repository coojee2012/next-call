import {IsEmail, IsNotEmpty } from 'class-validator';
export class LoginUserDto {
    @IsEmail()
    userName: string;
    @IsNotEmpty()
    password: string;
    @IsNotEmpty()
    code: string
}