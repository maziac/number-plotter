declare var document: Document;
declare var Chart: any;


/**
 * The chart data representation, x/y pair.
 */
interface Data {
	x: number,
	y: number
};


/**
 * A static class which contains functions to draw/prepare the chart.
 */
export class BarChart {

	// Different colors.
	protected static colorNames = [
		'yellow',
		'red',
		'green',
		'blue',
	];
	protected static bkgColors = [
		'rgb(255, 255, 0)',
		'rgb(255, 64, 64)',
		'rgb(0, 255, 0)',
		'rgb(128, 128, 255)',
	];
	protected static borderColors = [
		'rgb(128, 128, 0)',
		'rgb(128, 32, 32)',
		'rgb(0, 128, 0)',
		'rgb(64, 64, 128)',
	];

	// The last selected color.
	protected static colorIndex = -1;


	// All available chart types to cycle through.
	protected static chartTypes = [
		'line',
		'bar',
	];

	// The last selected chart type.
	protected static chartTypeIndex = 0;


	/**
	 * Creates a canvas etc. and shows the chart.
	 * There is also a button to cycle through the different chart types.
	 * @param text The text that is converted to a number series.
	 * @param path The file path.
	 * @param range (vscode.Range) The original range. Is passed back when clicked.
	 */
	public static show(text: string, path: string, range: any) {
		// Next color
		this.colorIndex++;

		// Split lines of text
		const lines = text.replace(/\r/g, '').split('\n');
		// Convert text into number series
		const serieses: number[][] = [];
		// For each line get the number series
		for (const line of lines) {
			const yArray: number[] = [];
			const labels: string[] = [];
			const textArray = line.split(/[,; ]/);
			for (let text of textArray) {
				text = text.trim();
				if (text.length > 0) {
					const y = parseFloat(text);
					if (!isNaN(y))
						yArray.push(y);
				}
			}
			// If at least one element than add it to the serieses.
			if (yArray.length > 0)
				serieses.push(yArray);
		}

		// Get the max. number of elements
		let maxCount = 0;
		for (const series of serieses) {
			const count = series.length;
			if (count > maxCount)
				maxCount = count;
		}

		// Now create labels
		const labels = new Array<string>(maxCount);
		for (let i = 0; i < maxCount; i++)
			labels[i] = i.toString();

		// Setup datasets for chart
		const datasets = [];
		let k = 0;
		for (const series of serieses) {
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
		const config = {
			type: this.getCurrentChartType(),
			data,
			options: {
				plugins: {
					legend: {
						display: (serieses.length>1)
					}
				},
				animation: true,
				locale: "en-US",	// Use . for decimal separation
			}
		};

		// Get div_root
		const divRoot = document.getElementById('div_root');

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
		//refNode.title = "titl2";
		refNode.href = path;
		refNode.innerText = fileText;	// Required to change teh pointer on hovering
		textNode.append(refNode);
		node.append(textNode);

		// Add click method for the file name
		refNode.addEventListener("click", () => {
			// Remove the node
			node.remove(); // TODO Change
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
		const typeButton = document.createElement('button') as HTMLButtonElement;
		typeButton.textContent = this.Capitalize(chart.config.type);
		buttonNode.append(typeButton);
		typeButton.addEventListener("click", () => {
			// Next chart type
			this.nextChartType();
			// Set new type
			chart.config.type = this.getCurrentChartType();
			chart.update();
			// Button text
			typeButton.textContent = this.Capitalize(chart.config.type);
		});

		// Add a button to change the color
		const colorButton = document.createElement('button') as HTMLButtonElement;
		colorButton.textContent = 'Color';
		buttonNode.append(colorButton);
		colorButton.addEventListener("click", () => {
			// Next color
			this.nextColor();
			// Set new color
			chart.config.data.datasets[0].backgroundColor = this.getCurrentBkgColor();
			chart.config.data.datasets[0].borderColor = this.getCurrentBorderColor();
			chart.update();
			// Button text
			colorButton.textContent = this.Capitalize(this.getCurrentColorName());
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
		removeToBottomButton.textContent = "Clear 'til bottom";
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
	 * Return the current chart type.
	 */
	protected static getCurrentChartType(): string {
		return this.chartTypes[this.chartTypeIndex];
	}


	/**
	 * Cycles to the next chart type.
	 */

	protected static nextChartType() {
		this.chartTypeIndex = (this.chartTypeIndex + 1) % this.chartTypes.length;
		return this.chartTypes[this.chartTypeIndex];
	}


	/**
	 * Return the current line color.
	 */
	protected static getCurrentColorName(): string {
		return this.colorNames[this.colorIndex];
	}


	/**
	 * Return the current line color.
	 */
	protected static getCurrentBkgColor(offs = 0): string {
		return this.bkgColors[(this.colorIndex + offs) % this.colorNames.length];
	}

	/**
	 * Return the current point color.
	 */
	protected static getCurrentBorderColor(offs = 0): string {
		return this.borderColors[(this.colorIndex + offs) % this.colorNames.length];
	}


	/**
	 * Cycles to the next chart type.
	 */

	protected static nextColor() {
		this.colorIndex = (this.colorIndex + 1) % this.colorNames.length;
	}


	/**
	 * Returns the string with a capitalized first letter.
	 */
	protected static Capitalize(text: string): string {
		if (text.length == 0)
			return '';
		return text.charAt(0).toUpperCase() + text.slice(1)
	}
}
