declare var acquireVsCodeApi: any;
declare var document: Document;
declare var window: Window & typeof globalThis;;

declare var Plot: any;


/**
 * The main program which receives the commands.
 */


//---- Handle messages from vscode extension --------
window.addEventListener('message', event => {
	const message = event.data;

	switch (message.command) {
		case 'plotText':
			{
				const numberText: string = message.data;
				console.log(numberText);
				Plot.showPlot(numberText);
			} break;
	}
});
