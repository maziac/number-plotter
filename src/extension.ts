import * as vscode from 'vscode';
import {PackageInfo} from './packageinfo';
import {PlotView} from './plotview';

export function activate(context: vscode.ExtensionContext) {
    // Init package info
    PackageInfo.Init(context);

    // Line/bar chart command
    context.subscriptions.push(vscode.commands.registerCommand('number-plotter.linechart', () => {
        showChart('lineChart');
    }));

    // x/y chart command
    context.subscriptions.push(vscode.commands.registerCommand('number-plotter.xychart', () => {
        showChart('xyChart');
    }));
}


export function deactivate() {
}


function showChart(chartType: string) {
    // Get active editor
    const editor: vscode.TextEditor = vscode.window.activeTextEditor;
    if (!editor)
        return;

    // Check if selection exists
    const selection = editor.selection;
    if (selection.isEmpty)
        return;

    // Get only a single line
    const range = selection.with();
    const document = editor.document;
    const text = document.getText(range);

    // Get file name
    const filename = document.uri.fsPath;

    // Show plot
    PlotView.showChart(chartType, text, filename, range);
}
