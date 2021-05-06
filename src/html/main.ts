declare var acquireVsCodeApi: any;
declare var window: Window & typeof globalThis;
declare var BarEtcChart: any;
declare var ScatterChart: any;


/**
 * The main program which receives the commands.
 */


//---- Handle messages from vscode extension --------
window.addEventListener('message', event => {
	const message = event.data;

	switch (message.command) {
		case 'lineChart':
			{
				BarEtcChart.show(message.text, message.path, message.range);
			} break;
		case 'xyChart':
			{
				ScatterChart.show(message.text, message.path, message.range);
			} break;
	}
});
