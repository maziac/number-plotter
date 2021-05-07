declare var document: Document;
declare var Chart: any;
declare var vscode: any;


/**
 * The chart data representation, x/y pair.
 */
interface Data {
	x: number,
	y: number
};


/**
 * A static class which contains functions to draw/prepare a line or bar chart.
 */
export class BarEtcChart {

	protected static bkgColors = [
		'gold',
		'red',
		'green',
		'steelblue',
		'peru',	// brown
		'gray',
		'orange'
	];

	protected static borderColors = [
		'yellow',
		'crimson',
		'darkgreen',
		'cornflowerblue',
		'chocolate',
		'dimgray',
		'darkorange'
	];

	// The last selected color. Global.
	protected static colorIndex = -1;
	protected colorIndex: number;


	// All available chart types to cycle through.
	protected static chartTypes = [
		'line',
		'bar',
	];

	// The last selected chart type. Global.
	protected static chartTypeIndex = 0;
	protected chartTypeIndex: number;

	// The data serieses after parsing the text data.
	protected serieses: number[][];

	// The short text (the start of the parsed text) that is shown on top
	protected shortText: string;


	/**
	 * Creates a canvas etc. and shows the chart.
	 * There is also a button to cycle through the different chart types.
	 * @param text The text that is converted to a number series.
	 * @param path The file path.
	 * @param range (vscode.Range) The original range. Is passed back when clicked.
	 */
	constructor(text: string, path: string, range: any) {
		// Use last chart type
		this.chartTypeIndex = BarEtcChart.chartTypeIndex;
		// Next color
		this.colorIndex = BarEtcChart.colorIndex;
		this.nextColor();

		// Convert text into number series
		this.convertToSerieses(text);

		// Get the config for the chart
		const config = this.createChartConfig();

		// Get div_root
		const divRoot = document.getElementById('div_root');

		// Add a horizontal ruler
		const firstChild = divRoot.firstElementChild;
		if (firstChild) {
			const hr = document.createElement('hr') as HTMLHRElement;
			firstChild.prepend(hr);
		}

		// Add a new div at the top
		const node = document.createElement('div') as HTMLDivElement;
		divRoot.prepend(node);

		// Add the file name.
		const textNode = document.createElement('div') as HTMLElement;
		const refNode = document.createElement('a') as HTMLAnchorElement;
		const parts = path.split(/[\/\\]/);
		const basename = parts.pop();
		const lineStart = range.start.line+1;
		let lineEnd = range.end.line + 1;
		if (range.end.character == 0)
			lineEnd--;
		let fileText = basename + ';' + lineStart.toString();
		if (lineStart < lineEnd)
			fileText += '-' + lineEnd.toString();
		if (this.shortText) {
			fileText += ':';
			// Add a text node
			const shortTextNode = document.createElement('span') as HTMLElement;
			shortTextNode.innerHTML = '&nbsp;&nbsp;' + this.shortText;
			textNode.append(shortTextNode);
		}
		refNode.href = path;
		refNode.innerText = fileText;	// Required to change the pointer on hovering
		textNode.prepend(refNode);
		node.append(textNode);

		// Add click method for the file name
		refNode.addEventListener("click", () => {
			// Send filename and range to extension
			vscode.postMessage({
				command: 'select',
				path: path,
				range: range
			});
		});

		// Add a node for the buttons
		const buttonNode = document.createElement('div') as HTMLDivElement;
		node.append(buttonNode);

		// Add a canvas
		const canvas = document.createElement('canvas') as HTMLCanvasElement;
		node.append(canvas);

		// Add the chart to it
		const chart = new Chart(canvas, config);

		// Add a button to change the chart type
		const typeButton = this.createFirstButton(chart);
		buttonNode.append(typeButton);

		// Add a button to change the color
		const colorButton = document.createElement('button') as HTMLButtonElement;
		colorButton.textContent = 'Color';
		buttonNode.append(colorButton);
		colorButton.addEventListener("click", () => {
			// Next color
			this.nextColor();
			// Set new color
			const datasets = chart.config.data.datasets;
			const len = datasets.length;
			for (let k = 0; k < len; k++) {
				chart.config.data.datasets[k].backgroundColor = this.getCurrentBkgColor(k);
				chart.config.data.datasets[k].borderColor = this.getCurrentBorderColor(k);
			}
			chart.update();
		});

		// Add a button to remove the chart
		const removeButton = document.createElement('button') as HTMLButtonElement;
		removeButton.textContent = 'Clear'; // "Clear" is shorter than "Remove"
		removeButton.style.float = "right";
		buttonNode.append(removeButton);
		removeButton.addEventListener("click", () => {
			// Remove the node
			node.remove();
		});

		// Add a button to remove all chart up to the bottom
		const removeToBottomButton = document.createElement('button') as HTMLButtonElement;
		removeToBottomButton.textContent = "Clear down";
		removeToBottomButton.style.float = "right";
		buttonNode.append(removeToBottomButton);
		removeToBottomButton.addEventListener("click", () => {
			// Collect all children to remove
			const removeNodes = [];
			const children = divRoot.childNodes;
			for (let i = children.length - 1; i >= 0; i--) {
				const child = children[i];
				removeNodes.push(child);
				if (child == node)
					break;
			}
			// Remove the nodes
			for(const child of removeNodes)
				child.remove();
		});
	}


	/**
	 * Splits the given text in serieses of numbers.
	 * Each new line in hte text will become an own series.
	 * @param text The multiline text with numbers.
	 * @returns {serieses: An array with serieses, shortText: A description for the serieses}
	 */
	protected convertToSerieses(text: string) {
		// Split lines of text
		const lines = text.replace(/\r/g, '').split('\n');
		// Convert text into number series
		const serieses: number[][] = [];
		// To store a small text to show to the user
		let shortText = '';
		// For each line get the number series
		for (const line of lines) {
			const yArray: number[] = [];
			const trimmedLine = line.trim();
			if (trimmedLine.length == 0)
				continue;
			const textArray = trimmedLine
				.split(/[,;\s]/);
			for (let text of textArray) {
				text = text.trim();
				// Strip any leading non digit or letter characters from the start,
				// e.g. brackets.
				text = text.replace(/^[^\w\d\.\-]*/, '');
				if (text.length > 0) {
					const y = parseFloat(text);
					if (!isNaN(y))
						yArray.push(y);
				}
			}
			// If at least one element than add it to the serieses.
			if (yArray.length > 0) {
				// Store series
				serieses.push(yArray);
				// Store text from the first used line
				if (!shortText)
					shortText = trimmedLine;
			}
		}

		// Shorten smallText
		const maxShortTextLength = 20;
		if (shortText.length > maxShortTextLength || serieses.length > 1) {
			shortText = shortText.substr(0, maxShortTextLength) + ' ...';
		}

		// Store
		this.serieses = serieses;
		this.shortText = shortText;
	}


	/**
	 * Returns the max length of all serieses.
	 */
	protected getMaxCount(serieses: number[][]): number {
		// Get the max. number of elements
		let maxCount = 0;
		for (const series of serieses) {
			const count = series.length;
			if (count > maxCount)
				maxCount = count;
		}
		return maxCount;
	}


	/**
	 * Creates labels for the serieses.
	 */
	protected createLabels(): string[] {
		const maxCount = this.getMaxCount(this.serieses);
		// Now create labels
		const labels = new Array<string>(maxCount);
		for (let i = 0; i < maxCount; i++)
			labels[i] = i.toString();
		// Return
		return labels;
	}


	/**
	 * Creates the configuration for the chart.
	 * Override for other chart types.
	 */
	protected createChartConfig(): any {
		// Create labels
		const labels = this.createLabels();

		// Setup datasets for line/bar chart
		const datasets = [];
		let k = 0;
		for (const series of this.serieses) {
			datasets.push({
				label: '',
				backgroundColor: this.getCurrentBkgColor(k),
				borderColor: this.getCurrentBorderColor(k),
				data: series,
				showLine: true
			});
			k++;
		}

		// Setup data
		const data = {
			labels,
			datasets
		};

		// And config
		const config = {
			type: this.getCurrentChartType(),
			data,
			options: {
				plugins: {
					legend: {
						display: (this.serieses.length > 1)
					}
				},
				animation: true,
				locale: "en-US",	// Use . for decimal separation
			}
		};

		// Return
		return config;
	}


	/**
	 * Create the first button. Upper left corner.
	 * Here it is used to toggle the chart type between
	 * line and bar.
	 * @param chart The just created chart is passed here.
	 */
	protected createFirstButton(chart: any): HTMLButtonElement {
		const typeButton = document.createElement('button') as HTMLButtonElement;
		typeButton.textContent = this.capitalize(chart.config.type);
		typeButton.addEventListener("click", () => {
			// Next chart type
			this.nextChartType();
			// Set new type
			chart.config.type = this.getCurrentChartType();
			chart.update();
			// Button text
			typeButton.textContent = this.capitalize(chart.config.type);
		});

		return typeButton;
	}


	/**
	 * Return the current chart type.
	 */
	protected getCurrentChartType(): string {
		return BarEtcChart.chartTypes[this.chartTypeIndex];
	}


	/**
	 * Cycles to the next chart type.
	 */

	protected nextChartType() {
		this.chartTypeIndex = (BarEtcChart.chartTypeIndex + 1) % BarEtcChart.chartTypes.length;
		BarEtcChart.chartTypeIndex = this.chartTypeIndex;
		return BarEtcChart.chartTypes[this.chartTypeIndex];
	}


	/**
	 * Return the current line color.
	 */
	protected getCurrentBkgColor(offs = 0): string {
		return BarEtcChart.bkgColors[(this.colorIndex + offs) % BarEtcChart.bkgColors.length];
	}

	/**
	 * Return the current point color.
	 */
	protected getCurrentBorderColor(offs = 0): string {
		return BarEtcChart.borderColors[(this.colorIndex + offs) % BarEtcChart.borderColors.length];
	}


	/**
	 * Cycles to the next chart type.
	 */

	protected nextColor() {
		this.colorIndex = (this.colorIndex + 1) % BarEtcChart.bkgColors.length;
		BarEtcChart.colorIndex = this.colorIndex;	// Use for next chart
	}


	/**
	 * Returns the string with a capitalized first letter.
	 */
	protected capitalize(text: string): string {
		if (text.length == 0)
			return '';
		return text.charAt(0).toUpperCase() + text.slice(1)
	}
}
