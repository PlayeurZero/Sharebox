$(document).ready(function() {
	let websocket = new WebSocket('ws://localhost:8080');

	let max_users = 0;
	let max_amount_data = 0;

	let user_chart = new Chartist.Line('.chart-users', {
		labels : ['0s', '2s', '4s', '6s', '8s'],
		series: [
			[]
		]
	}, {
			high: 15,
			low: 0,
			fullWidth: true,
			// As this is axis specific we need to tell Chartist to use whole numbers only on the concerned axis
			axisY: {
				onlyInteger: true,
				offset: 20
			}
	});

	let data_amount_chart = new Chartist.Line('.chart-data-amount', {
		labels : ['0s', '2s', '4s', '6s', '8s'],
		series: [
			[]
		]
	}, {
			high: 15,
			low: 0,
			fullWidth: true,
			// As this is axis specific we need to tell Chartist to use whole numbers only on the concerned axis
			axisY: {
				onlyInteger: true,
				offset: 20
			}
	});

	function update() {
		websocket.send(JSON.stringify({
			action : "chart"
		}));
	}

	websocket.addEventListener('open', () => {
		update();
	});

	websocket.addEventListener('message', function (e) {
		let parsed_data = JSON.parse(e.data);
		if (parsed_data.action === 'chart_success') {

			// users
			let user_chart_data = user_chart.data.series[0];
			user_chart_data.unshift(parsed_data.extra.users)
			if(user_chart_data.length > 5) {
				user_chart_data.pop();
			}
			max_users = Math.max(max_users, parsed_data.extra.users);
			user_chart.update({ series : [user_chart_data], labels : ['0s', '2s', '4s', '6s', '8s'] }, { low : 0, high : max_users + 5, axisY: { onlyInteger: true, offset: 20 } });

			// data amount
			let data_amount_chart_data = data_amount_chart.data.series[0];
			data_amount_chart_data.unshift(parsed_data.extra.data_amount)
			if(data_amount_chart_data.length > 5) {
				data_amount_chart_data.pop();
			}
			max_amount_data = Math.max(max_amount_data, parsed_data.extra.data_amount * 2);
			data_amount_chart.update({ series : [data_amount_chart_data], labels : ['0s', '2s', '4s', '6s', '8s'] }, { low : 0, high : max_amount_data + 5, showArea: true, axisY: { onlyInteger: true, offset: 50 } });

			setTimeout(update, 2000);
		}
	});

	// window.a = new Chartist.Line('.chart-users', {
	// 	labels: [1, 2, 3, 4, 5, 6, 7, 8],
	// 	series: [
	// 		[1, 2, 3, 1, -2, 0, 1, 0]
	// 	]
	// }, {
	// 		high: 3,
	// 		low: -3,
	// 		fullWidth: true,
	// 		// As this is axis specific we need to tell Chartist to use whole numbers only on the concerned axis
	// 		axisY: {
	// 			onlyInteger: true,
	// 			offset: 20
	// 		}
	// });
})