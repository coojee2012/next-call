export class CreatePrivateMessageDto {
    id: number;
    content: string;
    sendId: number; // user id of the sender
    recvId: number; // user id of the receiver
    type: number; // 1: text message, 2: image message, 3: file message
    sendTime:number;
    status: number
}
