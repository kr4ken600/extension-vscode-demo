import * as vscode from 'vscode';
import { ChatbotSidebarProvider } from './chatbot-sidebar';

export function activate(context: vscode.ExtensionContext) {
    const provider = new ChatbotSidebarProvider(context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('chatbot-sidebar', provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('test-kr4ken-extension.exportChat', () => {
            provider.exportChat();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('test-kr4ken-extension.cleanChat', () => {
            provider.cleanChat();
        })
    );
}

export function deactivate() {}