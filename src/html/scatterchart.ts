declare var document: Document;
declare var Chart: any;


/**
 * Defines the way of parsing.
 */
enum ParseValues {
	ALTERNATING_XY = 0,	// x and y values alternate
	ALTERNATING_YX,	// y and x values alternate
	FIRST_LINE_X,	// The first line contains x values, the other y values
	FIRST_LINE_Y,	// The first line contains y values, the other x values
}

/**
 * The chart data representation, x/y pair.
 */
interface XY {
	x: number,
	y: number
};


/**
 * A static class which contains functions to draw/prepare a x/ chart.
 */
export class ScatterChart extends BarChart {

	// The titles for the button to switch parsing
	protected static ParsingTitle = [
		'X/Y Pairs',
		'Y/X Pairs',
		'First Line X',
		'First Line Y',
	];

	/**
	 * Creates a canvas etc. and shows the chart.
	 * @param text The text that is converted to a number series.
	 * @param path The file path.
	 * @param range (vscode.Range) The original range. Is passed back when clicked.
	 */
	public static show(text: string, path: string, range: any) {
		// Create an instance
		new ScatterChart(text, path, range);
	}

	// Stores the parsing of the number series.
	protected static parseValues = ParseValues.ALTERNATING_XY;
	protected parseValues: ParseValues;


	/**
	 * Creates a canvas etc.and shows the chart.
	 * There is also a button to cycle through the different chart types.
	 * @param text The text that is converted to a number series.
	 * @param path The file path.
	 * @param range(vscode.Range) The original range.Is passed back when clicked.
	 */
	constructor(text: string, path: string, range: any) {
		super(text, path, range);
	}


	/**
	 * Takes the given serieses and converts them to a series of XY pairs.
	 * The serieses are interpreted as alternating x and y values.
	 */
	protected createXyAlternatingSerieses(): XY[][] {
		// Convert number series in series of x and y
		const xySerieses = new Array<Array<XY>>();
		for (const series of this.serieses) {
			const xySeries = new Array<{x: number, y: number}>();
			const len = series.length;
			for (let i = 0; i < len - 1; i += 2) {
				const a = series[i];
				const b = series[i + 1];
				xySeries.push({x: a, y: b});	// x/y
			}
			xySerieses.push(xySeries);
		}
		return xySerieses;
	}


	/**
	 * Exchanged the x and y of all pairs.
	 */
	protected switchSeriesesXy(xYserieses: XY[][]) {
		for (const series of xYserieses) {
			for (const pair of series) {
				// Exchange x and y
				const h = pair.x;
				pair.x = pair.y;
				pair.y = h;
			}
		}
	}


	/**
	 * Creates the configuration for the chart.
	 * Override for other chart types.
	 */
	protected createChartConfig(): any {
		// Check if it is the first call
		if (this.parseValues == undefined) {
			// Initialize the first time
			this.parseValues = ScatterChart.parseValues;
		}

		// Decide on way of parsing
		let xySerieses;
		switch (this.parseValues) {
			case ParseValues.ALTERNATING_XY:
			case ParseValues.ALTERNATING_YX:
				// Convert number series in series of x and y
				xySerieses = this.createXyAlternatingSerieses();
				if (this.parseValues == ParseValues.ALTERNATING_YX) {
					this.switchSeriesesXy(xySerieses);
				}
				break;
			case ParseValues.FIRST_LINE_X:
			case ParseValues.FIRST_LINE_Y:
				// Convert number series:
				// 1 rst line in series of x and y
				xySerieses = this.createXyAlternatingSerieses();
				break;
		}

		// Setup datasets for line/bar chart
		const datasets = [];
		let k = 0;
		for (const series of xySerieses) {
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
			datasets
		};

		// And config
		const config = {
			type: 'scatter',
			data,
			options: {
				plugins: {
					legend: {
						display: (xySerieses.length > 1)
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
	 * Here it is used to change between data series interpretation:
	 * a) x/y pairs
	 * b) x in first line, y in lines below
	 * @param chart The just created chart is passed here.
	 */
	protected createFirstButton(chart: any): HTMLButtonElement {
		const button = document.createElement('button') as HTMLButtonElement;
		button.textContent = ScatterChart.ParsingTitle[this.parseValues];
		button.addEventListener("click", () => {
			// Cycle parsing
			this.parseValues++;
			if (this.parseValues > ParseValues.FIRST_LINE_Y)
				this.parseValues = ParseValues.ALTERNATING_XY;
			ScatterChart.parseValues = this.parseValues;
			// Set button title
			button.textContent = ScatterChart.ParsingTitle[this.parseValues];
			// Re-evaluate data
			const config = this.createChartConfig();
			// Update
			chart.config.data.datasets = config.data.datasets;
			chart.update();
		});

		return button;
	}


}