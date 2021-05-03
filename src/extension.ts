import * as vscode from 'vscode';
import {PackageInfo} from './packageinfo';
import {PlotView} from './plotview';

export function activate(context: vscode.ExtensionContext) {
    // Init package info
    PackageInfo.Init(context);

    // Number plot command
    context.subscriptions.push(vscode.commands.registerCommand('number-plotter.plot', () => {
        console.log('number-plotter.plot');

        // Get active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;

        // Check if selection exists
        const selection = editor.selection;
        if (selection.isEmpty)
            return;

        // Get only a single line
        const range = selection.with();
        const text = editor.document.getText(range);

        // Show plot
        PlotView.showPlot(text);
    }));

}


export function deactivate() {
}

