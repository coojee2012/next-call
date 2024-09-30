export class CreateGroupMessageDto {
    type: number;
    receipt: boolean;
    content: string;
    groupId: number;
    atUserIds: string;
}
