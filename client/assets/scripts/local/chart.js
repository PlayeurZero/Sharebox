$(document).ready(function() {
	google.charts.load('current', {'packages':['corechart']});
      google.charts.setOnLoadCallback(drawChart);

      function drawChart() {
        var data = google.visualization.arrayToDataTable([
          ['temps passé', 'utilisateurs connectés'],
          ['2m', 1],
          ['1m30s', 2],
          ['1m', 3],
          ['30s', 1]
        ]);

        var options = {
          title: 'Utilisateurs connectés en temps réel',
          hAxis: {title: 'temps passé',  titleTextStyle: {color: '#333'}},
          vAxis: {minValue: 0}
        };

        var chart = new google.visualization.AreaChart($('.chart-users').get(0));
        chart.draw(data, options);
      }
});