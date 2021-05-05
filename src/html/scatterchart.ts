declare var document: Document;
declare var Chart: any;


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

	/**
	 * Takes the given serieses and converts them to a series of XY pairs.
	 * The serieses are interpreted as alternating x and y values.
	 */
	protected static createXyAlternatingSerieses(serieses: number[][]): XY[][] {
		// Convert number series in series of x and y
		const xySerieses = new Array<Array<XY>>();
		for (const series of serieses) {
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
	 * Creates the configuration for the chart.
	 * Override for other chart types.
	 */
	protected static createChartConfig(serieses: number[][]): any {
		// Convert number series in series of x and y
		const xySerieses = this.createXyAlternatingSerieses(serieses);

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
	 * @param serieses The series data is passed here.
	 */
	protected static createFirstButton(chart: any, serieses: any): HTMLButtonElement {
		const typeButton = document.createElement('button') as HTMLButtonElement;
		typeButton.textContent = "X/Y Pairs"
		typeButton.addEventListener("click", () => {
		});

		return typeButton;
	}

}