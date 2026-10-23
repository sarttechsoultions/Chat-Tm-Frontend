import type { Message } from "./api/chat";

export function mergeMessage(messages: Message[], incoming: Message, temporaryId?: string): Message[] {
  const matches = (message: Message) => message.id === incoming.id || message.id === temporaryId || Boolean(incoming.clientMessageId && message.clientMessageId === incoming.clientMessageId && message.senderId === incoming.senderId && message.conversationId === incoming.conversationId);
  const previous=messages.find(matches);
  const readers=new Map([...(previous?.readBy||[]),...(incoming.readBy||[])].map(reader=>[reader.userId,reader]));
  const next={...previous,...incoming,pending:false,failed:false,readBy:[...readers.values()]};
  return [...messages.filter(message=>!matches(message)),next].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)||a.id.localeCompare(b.id));
}
export function mergeHistory(history:Message[], current:Message[], conversationId:string) {
  let result=current.filter(message=>message.conversationId===conversationId);
  for(const message of history)result=mergeMessage(result,message);
  return result;
}

export function deleteMessageLocally(messages:Message[],messageId:string):Message[]{
 return messages.map(message=>({
  ...message,
  ...(message.id===messageId?{isDeleted:true,body:"This message was deleted",mediaUrl:null,fileName:null,fileSize:null,reactions:[]}:{}),
  replyTo:message.replyTo?.id===messageId?{...message.replyTo,isDeleted:true,body:"This message was deleted",mediaUrl:null}:message.replyTo
 }));
}
