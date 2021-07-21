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


	/**
	 * Static function to create a new line/bar chart.
	 * The plot view itself is created only once.
	 * @param chartType 'lineChart' or 'xyChart'.
	 * @param texts The text that is converted to a number series.
	 * @param path The file path.
	 * @param ranges The original range. Is passed back when clicked.
	 */
	public static showChart(chartType: string, texts: string[], path: string, ranges: vscode.Range[]) {
		// Create singleton if necessary
		if (!this.singleton)
			this.singleton = new PlotView();

		// Add plot
		const message = {
			command: chartType,
			texts: texts,
			path: path,
			ranges: ranges
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
		this.vscodePanel = vscode.window.createWebviewPanel('', '', {preserveFocus: true, viewColumn: vscode.ViewColumn.Nine}, {enableScripts: true, enableFindWidget: true, retainContextWhenHidden: true});

		// Title
		this.vscodePanel.title = "Number Series Plot";

		// Allow scripts in the webview
		this.vscodePanel.webview.options = {enableScripts: true};

		// Handle messages from the webview
		this.vscodePanel.webview.onDidReceiveMessage(message => {
			this.webViewMessageReceived(message);
		});

		// Handle closing of the view
		this.vscodePanel.onDidDispose(() => {
			// Do not use panel anymore
			this.vscodePanel = undefined as any;
			// Remove singleton
			PlotView.singleton = undefined;
		});

		// Init html
		this.setHtml();
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

		// Get donated state
		const configuration = PackageInfo.getConfiguration();
		const donated = configuration.get<boolean>('donated');

		// Set button
		if (!donated) {
			html = html.replace('<!--${donate}-->', `
If you like the extension please consider a donation and click one of the buttons below <br>
<div class="button-group">
		<a class="button button--flat-primary" title="Become a sponsor on Github" href="https://github.com/sponsors/maziac"
			target="_blank">Become a Sponsor</a>
		<a class="button button--flat-primary" title="Donate via PayPal"
			href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8S4R8HPXVCXUL&source=url"
			target="_blank">Donate via PayPal</a>
</div>
<br><hr><br>`);
		}

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


	/**
	 * The web view posted a message to this view.
	 * @param message The message. message.command contains the command as a string. E.g. 'keyChanged'
	 */
	protected async webViewMessageReceived(message: any) {
		switch (message.command) {
			case 'select':
				// A text (range) in a file should be selected.
				// Try to find if the file is already open in an editor. (openTextDocument may result in opening the same file twice.)
				let doc: vscode.TextDocument;
				const foundDocs: vscode.TextDocument[] = vscode.workspace.textDocuments.filter(doc => doc.uri.fsPath == message.path);
				if (foundDocs.length > 0) {
					// Doc found
					doc = foundDocs[0];
				}
				else {
					// Doc not found, open it
					const uri = vscode.Uri.file(message.path);
					doc = await vscode.workspace.openTextDocument(uri);
				}
				// Get editor
				const editor: vscode.TextEditor = await vscode.window.showTextDocument(doc);
				// Select range
				const ranges: vscode.Range[] = message.ranges;
				const selections: vscode.Selection[] = [];
				for (const range of ranges) {
					const selection = new vscode.Selection(range.start.line, range.start.character, range.end.line, range.end.character);
					selections.push(selection);
				}
				editor.selections = selections;
				// Scroll to range first range
				const range = ranges[0];
				editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
				break;
		}
	}
}
