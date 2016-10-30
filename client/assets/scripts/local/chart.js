$(document).ready(function() {
	let websocket = new WebSocket('ws://localhost:8080');

	let charts = {};

	google.charts.load('current', {packages: ['corechart', 'line']});
	google.charts.setOnLoadCallback(drawLogScales);

	var current_date = null;
	var user_data = [];

	let update = function() {
		websocket.send(JSON.stringify({
			action : "chart"
		}));
	};

	var update_user_chart = function() {
		var chart = charts.chart;
		var data = charts.data;
		var options = charts.options;

		data.addRows(user_data);
		user_data = [];
		chart.draw(data, options)
	}

	websocket.addEventListener('message', function(e) {
		let parsed_data = JSON.parse(e.data);
		if(parsed_data.action === 'chart_success') {
			let datas = parsed_data.extra;

			addDatasUser(datas.date , datas.users);
			update_user_chart()

			setTimeout(update, 2000);
		}
	});

	websocket.addEventListener('open', function() {
		update();
	});

	let addDatasUser = function(date, data) {
		date = new Date(date);

		if(current_date == null) {
			current_date = date;
		}

		user_data.push([
			(date - current_date) / 1000,
			data
		]);
	};

	function drawLogScales() {
		var data = new google.visualization.DataTable();
		data.addColumn('number', 'X');
		data.addColumn('number', 'Utilisateurs');

		data.addRows([]);

		var options = {
			hAxis: {
			title: 'Temps (s)',
			logScale: true
			},
			vAxis: {
			title: 'Utilisateurs',
			logScale: false
			},
			colors: ['#a52714', '#097138']
		};

		var chart = new google.visualization.AreaChart($('.chart-users').get(0));

		chart.draw(data, options);

		charts = {
			chart : chart,
			options : options,
			data : data
		};
	};
});