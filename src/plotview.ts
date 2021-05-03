import * as vscode from 'vscode';
import * as path from 'path';
import {readFileSync} from 'fs';
import {PackageInfo} from './packageinfo';


/**
 * The view containing all the plots.
 */
export class PlotView {
	/// The singleton object.
	protected static singleton: PlotView;


	// Static function to create a new plot.
	// The plot view itself is created only once.
	public static showPlot(text: string) {
		// Create singleton if necessary
		if(!this.singleton)
			this.singleton = new PlotView();

		// Add plot
		const message = {
			command: 'plotText',
			data: text
		};
		this.singleton.sendMessageToWebView(message);
	}


	/// A panel (containing the webview).
	protected vscodePanel: vscode.WebviewPanel;


	/**
	 * Creates the web view.
	 */
	constructor() {
		// Create vscode panel view
		this.vscodePanel = vscode.window.createWebviewPanel('', '', {preserveFocus: true, viewColumn: vscode.ViewColumn.Nine});

		// Title
		this.vscodePanel.title = "Number Series Plot";

		// Allow scripts in the webview
		this.vscodePanel.webview.options = {enableScripts: true};

		// Init html
		this.setHtml();

		// Handle closing of the view
		this.vscodePanel.onDidDispose(() => {
			// Do not use panel anymore
			this.vscodePanel = undefined as any;
			// Remove singleton
			PlotView.singleton = undefined;
		});

	}


	/**
	 * Returns the html code to display the whats web html.
	 */
	public setHtml() {
		if (!this.vscodePanel.webview)
			return;

		// Add the html styles etc.
		const extPath = PackageInfo.extension.extensionPath;
		const mainHtmlFile = path.join(extPath, 'html/main.html');
		let html = readFileSync(mainHtmlFile).toString();

		// Exchange local path
		const resourcePath = vscode.Uri.file(extPath);
		const vscodeResPath = this.vscodePanel.webview.asWebviewUri(resourcePath).toString();
		html = html.replace('${vscodeResPath}', vscodeResPath);

		// Set content
		this.vscodePanel.webview.html = html;
	}


	/**
	 * A message is posted to the web view.
	 * @param message The message. message.command should contain the command as a string.
	 * This needs to be evaluated inside the web view.
	 */
	protected sendMessageToWebView(message: any) {
		this.vscodePanel.webview.postMessage(message);
	}

}
