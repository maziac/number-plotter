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


function showChart(chartType: string) {
    // Get active editor
    const editor: vscode.TextEditor = vscode.window.activeTextEditor;
    if (!editor)
        return;

    // Check if selection exists
    const selections = editor.selections;
    if (selections.length == 0)
        return;

    // Get text and ranges for all selections
    const ranges: vscode.Range[] = [];
    const texts: string[] = [];
    const document = editor.document;
    for (const selection of selections) {
        if (!selection.isEmpty) {
            const range = selection.with();
            const text = document.getText(range);
            ranges.push(range);
            texts.push(text);
        }
    }


    // Get file name
    const filename = document.uri.fsPath;

    // Show plot
    PlotView.showChart(chartType, texts, filename, ranges);
}
