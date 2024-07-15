export class CreateUserDto {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    age: number;
    roleIds: number[];
}
