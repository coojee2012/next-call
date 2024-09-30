export class GroupSendDto {
    type: number;
    receipt: boolean;
    content: string;
    groupId: number;
    atUserIds: number[];
}