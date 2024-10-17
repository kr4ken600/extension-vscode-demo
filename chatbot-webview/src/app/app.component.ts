import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { VscodeApiService } from './service/vscode-api.service';
import { IMessage } from './interface/chat.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy, OnChanges, AfterViewChecked {
  message: string = '';
  isLoading: boolean = false;
  messages: IMessage[] = [];
  private subscription!: Subscription;

  @ViewChild('messagesEnd') messagesEndRef!: ElementRef;

  constructor(private vscode: VscodeApiService) {}

  ngOnInit() {
    this.subscription = this.vscode.messages$.subscribe({
      next: messages => {
        this.messages = messages;
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.vscode.cleanup();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnChanges() {
    this.scrollToBottom();
  }

  isBotMessage(id: string): boolean {
    return id === 'bot';
  }

  scrollToBottom() {
    if (this.messagesEndRef && this.messagesEndRef.nativeElement) {
      this.messagesEndRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    if (this.message.trim() !== '') {
      this.vscode.sendMessageToVscode(this.message);
      this.message = '';
    }
  }

  writeCode() {
    this.vscode.writeCode();
  }

  getSelectedText(){
    this.vscode.getSelectedText();
  }
}
