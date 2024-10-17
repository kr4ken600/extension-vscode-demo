import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface ChatMessage {
  message: string;
  id: string;
}

export class ChatbotSidebarProvider implements vscode.WebviewViewProvider {
  
  _view?: vscode.WebviewView;
  previousMessages: Array<ChatMessage> = [];

  constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(
      webviewView: vscode.WebviewView,
      context: vscode.WebviewViewResolveContext,
      _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true 
    };

    this.previousMessages = this.context.workspaceState.get('chatMessages') || [];

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    if(this.previousMessages.length > 0) {
      setTimeout(() => {
        webviewView.webview.postMessage({ command: 'restoreChat', chat: this.previousMessages });
      }, 3000);
    }

    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'sendMessage':
            this.previousMessages.push({message: message.text, id: 'user'})
            this.saveChat(this.previousMessages);
            
            webviewView.webview.postMessage({ command: 'addMessage', text: message.text });
            break;

          case 'getSelectedText':
            const selectedText = this.getSelectedText();
            
            if(selectedText){
              this.previousMessages.push({message: selectedText, id: 'user'})
              this.saveChat(this.previousMessages);
              webviewView.webview.postMessage({ command: 'addMessage', text: selectedText });
            }
            break;

          case 'writeCode':
            this.writeCode();
            break;

          case 'saveBotMessage':
            this.previousMessages.push(message.botMessage);
            this.saveChat(this.previousMessages);
            break;
        }
      }
    );

    webviewView.onDidChangeVisibility(() => {
        if (webviewView.visible) {
          const history: Array<ChatMessage> = this.context.workspaceState.get('chatMessages') || [];
          console.log(history);
          
          webviewView.webview.postMessage({ command: 'restoreChat', chat: history });
        }
    })
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const appPath = path.join(this.context.extensionPath, 'browser');
    const indexPath = path.join(appPath, 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    html = html.replace(/(href|src)="\//g, `$1="${webview.asWebviewUri(vscode.Uri.file(appPath))}/`);

    return html;
  }

  private getSelectedText(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('No text selected');
      return;
    }

    const selectedText = editor.document.getText(selection);
    
    return selectedText
  }

  private async writeCode() {
      const editor = vscode.window.activeTextEditor;
      const code = 'const test = () => {\n  console.log("Hello World!");\n}';
      if(!editor) {
        const untitledFileUri = vscode.Uri.parse(`untitled:Generated-Code`);

        const document = await vscode.workspace.openTextDocument(untitledFileUri);
        await vscode.window.showTextDocument(document);
        
        const edit = new vscode.WorkspaceEdit();
        edit.insert(untitledFileUri, new vscode.Position(0, 0), code);
        
        await vscode.workspace.applyEdit(edit); 
        return;
      }

      const position = editor.selection.active;
      editor.edit(editBuilder => {
        editBuilder.insert(position, code);
      });
  }

  private async saveChat(chat: ChatMessage[]) {
    await this.context.workspaceState.update('chatMessages', chat);
  }

  public async exportChat() {
    const chat: Array<ChatMessage> = this.context.workspaceState.get('chatMessages') || [];

    if(chat.length === 0) {
      vscode.window.showErrorMessage('No hay mensajes para exportar.');
      return;
    }

    const chatContent = chat.map((item) => `${item.id === 'bot' ? 'Bot' : 'Usuario'}: ${item.message}`).join('\n');

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file('chat.txt'),
      saveLabel: 'Guardar Chat',
      filters: {
        'Archivo de texto': ['txt'],
      },
    });

    if(uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(chatContent, 'utf8'));
      vscode.window.showInformationMessage('Chat guardado exitosamente.');
    }
  }

  public cleanChat() {
    if(this._view && this.previousMessages.length > 0) {
      this.previousMessages = [];
      this.context.workspaceState.update('chatMessages', undefined);
      this._view.webview.postMessage({ command: 'cleanChat' });
      vscode.window.showInformationMessage('Historico Limpio.');
    }
  }
}
