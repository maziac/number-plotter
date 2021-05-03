
declare var document: Document;
declare var Chart: any;


export class Plot {
	protected text: string;

	constructor(text: string) {
		this.text = text;

		const labels = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
		];
		const data = {
			labels: labels,
			datasets: [{
				label: 'My First dataset',
				backgroundColor: 'rgb(255, 99, 132)',
				borderColor: 'rgb(255, 99, 132)',
				data: [0, 10, 5, 2, 20, 30, 45],
			}]
		};

		const config = {
			type: 'line',
			data,
			options: {}
		};

		// Get div_root
		const divRoot = document.getElementById('div_root');

		// Add a new div at the top
		const node = document.createElement("DIV") as HTMLDivElement;
		divRoot.prepend(node);

		// Add a canvas
		const canvas = document.createElement("CANVAS") as HTMLCanvasElement;
		divRoot.append(canvas);

		// Add the chart to it
		var myChart = new Chart(
			canvas,
			config
		);
	}

}