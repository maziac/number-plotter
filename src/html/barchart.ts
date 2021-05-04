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
	 */
	public static show(text: string) {
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
		const node = document.createElement("DIV") as HTMLDivElement;
		divRoot.prepend(node);

		// Add a canvas
		const canvas = document.createElement("CANVAS") as HTMLCanvasElement;
		node.append(canvas);

		// Add the chart to it
		const chart = new Chart(canvas, config);

		// Add a button to change the color
		const colorButton = document.createElement("BUTTON") as HTMLButtonElement;
		colorButton.textContent = 'Color';
		node.prepend(colorButton);
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

		// Add a button to change the chart type
		const typeButton = document.createElement("BUTTON") as HTMLButtonElement;
		typeButton.textContent = this.Capitalize(chart.config.type);
		node.prepend(typeButton);
		typeButton.addEventListener("click", () => {
			// Next chart type
			this.nextChartType();
			// Set new type
			chart.config.type = this.getCurrentChartType();
			chart.update();
			// Button text
			typeButton.textContent = this.Capitalize(chart.config.type);
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
