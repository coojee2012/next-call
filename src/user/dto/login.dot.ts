import {IsEmail, IsNotEmpty } from 'class-validator';
export class LoginUserDto {
    @IsEmail()
    useremail: string;
    @IsNotEmpty()
    passowrd: string;
    @IsNotEmpty()
    code: string
}