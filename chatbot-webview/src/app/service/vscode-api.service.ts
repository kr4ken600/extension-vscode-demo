import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IMessage } from '../interface/chat.interface';

@Injectable({
  providedIn: 'root'
})
export class VscodeApiService {

  vscode: any;
  private messagesSubject = new BehaviorSubject<IMessage[]>([{ message: 'Este es un simulador de chat...', id: 'bot' }]);
  messages$ = this.messagesSubject.asObservable();

  constructor() { 
    if (typeof window !== 'undefined') {
      this.vscode = (window as any).acquireVsCodeApi();
      window.addEventListener('message', this.handleMessage.bind(this));
    }
  }

  private handleMessage(event: MessageEvent) {
    const message = event.data;
    
    if (message.command === 'addMessage' && message.text) {
      const newMessage = { message: message.text, id: 'user' };
      this.addMessage(newMessage);

      const botMessage = { message: 'No entiendo tu pregunta...', id: 'bot' };
      setTimeout(() => {
        this.vscode.postMessage({ command: 'saveBotMessage', botMessage: botMessage });
        this.addMessage(botMessage);
      }, 1000);
      return;
    }

    if (message.command === 'restoreChat' && message.chat.length > 0) {
      this.restoreChat(message.chat);
      return;
    }

    if(message.command = 'cleanChat') {
      this.messagesSubject.next([{ message: 'Este es un simulador de chat...', id: 'bot' }]);
      return;
    }
  }

  sendMessageToVscode(message: string) {
    this.vscode.postMessage({
      command: 'sendMessage',
      text: message
    });
  }

  addMessage(newMessage: any) {
    const currentMessages = this.messagesSubject.getValue();
    this.messagesSubject.next([...currentMessages, newMessage]);
  }

  restoreChat(chat: IMessage[]) {
    this.messagesSubject.next([]);
    this.messagesSubject.next(chat);
  }

  writeCode() {
    this.vscode.postMessage({ command: 'writeCode' });
  }

  getSelectedText() {
    this.vscode.postMessage({ command: 'getSelectedText' });
  }

  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleMessage.bind(this));
    }
  }

}
