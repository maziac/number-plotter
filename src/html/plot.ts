
declare var document: Document;
declare var Chart: any;


export class Plot {

	// All available chart types to cycle through.
	protected static chartTypes = [
		'line',
		'bar',
		'scatter',
		//'pie',
		//'doughnut',
	];

	// The last selected chart type
	protected static chartTypeIndex = 0;


	/**
	 * Creates a canvas etc. and shows the chart.
	 * There is also a button to cycle through the different chart types.
	 */
	public static showPlot(text: string) {
		// Convert text into number series
		const textArray = text.split(/[,;]/);
		const yArray: number[] = [];
		for (let text of textArray) {
			text = text.trim();
			if (text.length > 0) {
				const value = parseInt(text);
				if (!isNaN(value))
					yArray.push(value);
			}
		}

		// Create x-series (0..N-1)
		const len = yArray.length;
		const xArray = new Array<number>(len);
		for (let i = 0; i < len; i++)
			xArray[i] = i;

		// Setup data
		const data = {
			labels: xArray,
			datasets: [{
				label: 'My First dataset',
				backgroundColor: 'rgb(255, 99, 132)',
				borderColor: 'rgb(255, 99, 132)',
				data: yArray,
			}]
		};
		const config = {
			type: this.getCurrentChartType(),
			data,
			options: {
				animation: true
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

		// Add a button to change the type
		const button = document.createElement("BUTTON") as HTMLButtonElement;
		button.textContent = chart.config.type;
		node.prepend(button);
		button.addEventListener("click", () => {
			// Next chart type
			this.nextChartType();
			// Set new type
			chart.config.type = this.getCurrentChartType();
			chart.update();
			// Button text
			button.textContent = chart.config.type;
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
}