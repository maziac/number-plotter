declare var acquireVsCodeApi: any;
//declare var document: Document;
declare var window: Window & typeof globalThis;;
declare var BarChart: any;


/**
 * The main program which receives the commands.
 */


//---- Handle messages from vscode extension --------
window.addEventListener('message', event => {
	const message = event.data;

	switch (message.command) {
		case 'plotText':
			{
				BarChart.show(message.text, message.path, message.range);
			} break;
	}
});
