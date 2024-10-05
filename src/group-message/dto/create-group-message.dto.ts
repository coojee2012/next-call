export class CreateGroupMessageDto {
    type: number;
    receipt: boolean;
    content: string;
    groupId: number;
    sendId: number;
    atUserIds: string;
    sendNickName: string;
    sendTime: number;
}
