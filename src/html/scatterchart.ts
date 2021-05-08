declare var document: Document;
declare var vscode: any;


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
export class ScatterChart extends BarEtcChart {

	// The titles for the button to switch parsing
	protected static ParsingTitle = [
		'X/Y Pairs',
		'Y/X Pairs',
		'First Line X',
		'First Line Y',
	];


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
	 * Checks if the parse value is iin the allowed range.
	 * If not it is set to an allowed value.
	 * I.e. if ther is only one line selected then it is not
	 * possible to use FIRST_LINE_X or FIRST_LINE_Y.
	 */
	protected checkParseValuesRange() {
		if (this.parseValues > ParseValues.FIRST_LINE_Y)
			this.parseValues = ParseValues.ALTERNATING_XY;
		if (this.serieses.length < 2) {
			// There is only one line selected.
			// I.e. the FIRST_.. parsing is not possible
			if (this.parseValues > ParseValues.ALTERNATING_YX)
				this.parseValues = ParseValues.ALTERNATING_XY;
		}
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
				const a = series[i].value;
				const b = series[i + 1].value;
				xySeries.push({x: a, y: b});	// x/y
			}
			xySerieses.push(xySeries);
		}
		return xySerieses;
	}


	/**
	 * Takes the given serieses and converts them to a series of XY pairs.
	 * The serieses are interpreted as:
	 * First line are x values, other values are y values.
	 */
	protected createXFirstSerieses(): XY[][] {
		// Convert number series in series of x and y
		const xySerieses = new Array<Array<XY>>();
		const len = this.serieses.length;
		if (len >= 2) {
			// Get first line, X values
			const x = this.serieses[0];
			const xLen = x.length;
			// Read teh other lines, Y values
			for (let l = 1; l < len; l++) {
				const series = this.serieses[l];
				const xySeries = new Array<{x: number, y: number}>();
				let len = series.length;
				if (len > xLen)
					len = xLen;	// Use minimum of both
				for (let i = 0; i < len ; i++) {
					const a = x[i].value;
					const b = series[i].value;
					xySeries.push({x: a, y: b});	// x/y
				}
				xySerieses.push(xySeries);
			}
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
			// Check if value is allowed
			this.checkParseValuesRange();
			ScatterChart.parseValues = this.parseValues;
		}

		// Decide on way of parsing
		let xySerieses;
		switch (this.parseValues) {
			case ParseValues.ALTERNATING_XY:
			case ParseValues.ALTERNATING_YX:
				// Convert number series in series of x and y
				xySerieses = this.createXyAlternatingSerieses();
				break;
			case ParseValues.FIRST_LINE_X:
			case ParseValues.FIRST_LINE_Y:
				// Convert number series:
				// 1rst line x, rest is y
				xySerieses = this.createXFirstSerieses();
				break;
		}

		// Exchange x and y ?
		if (this.parseValues == ParseValues.ALTERNATING_YX || this.parseValues == ParseValues.FIRST_LINE_Y) {
			this.switchSeriesesXy(xySerieses);
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
				'onClick': (evt: any) => {
					this.onClick(evt);
				},
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
			this.checkParseValuesRange();
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


	/**
	 * Called if a point was clicked.
	 * A point in the scater chart consist of 2 data: x and y.
	 * Both are being selected.
	 * @param dataPoint Contains the point info, e.g. datasetIndex and index.
	 */
	protected pointClicked(dataPoints: any) {
		console.log("datapoint:", dataPoints);
		// Get points with range
		const ranges = [];
		// Depending on parsing
		switch (this.parseValues) {
			case ParseValues.ALTERNATING_XY:
			case ParseValues.ALTERNATING_YX:
				// X/Y or Y/X pairs
				for (const dataPoint of dataPoints) {
					const i = 2 * dataPoint.index;
					const data1 = this.serieses[dataPoint.datasetIndex][i];
					ranges.push(data1.range);
					const data2 = this.serieses[dataPoint.datasetIndex][i + 1];
					ranges.push(data2.range);
				}
				break;
			case ParseValues.FIRST_LINE_X:
			case ParseValues.FIRST_LINE_Y:
				for (const dataPoint of dataPoints) {
					const i = dataPoint.index;
					// First range from first line
					const data1 = this.serieses[0][i];
					ranges.push(data1.range);
					// First range from data set
					const data2 = this.serieses[1+dataPoint.datasetIndex][i];
					ranges.push(data2.range);
				}
				break;
		}
		// Send message to extension to select the range
		vscode.postMessage({
			command: 'select',
			path: this.path,
			ranges: ranges
		});
	}
}