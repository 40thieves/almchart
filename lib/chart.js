var margin = { top: 20, right: 30, bottom: 30, left: 45 }
,	width = 960
,	height = 500
;

var x = d3.scale.linear()
	.range([0, width]);

var y = d3.scale.linear()
	.range([height, 0]);

var r = d3.scale.linear()
	.range([0, 10]);

var xAxis = d3.svg.axis()
	.scale(x)
	.orient('bottom');

var yAxis = d3.svg.axis()
	.scale(y)
	.orient('left');

var tip = d3.tip()
	.attr('class', 'd3-tip')
	.direction('e')
	.offset([0, 8])
	.html(function(d) {
		var template = document.querySelector('.template').cloneNode(true);

		template.querySelector('.title strong').innerHTML = d.title;

		var details = template.querySelector('.details');
		[].forEach.call(
			details.querySelectorAll('p'),
			function(el) {
				el.querySelector('span').innerHTML = d.sources[el.dataset.type].metrics.total;
			}
		);

		template.style.display = '';

		return template.outerHTML;
	});

var chart = d3.select('.chart')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

chart.call(tip);

d3.json('data/almreport.json', function(err, data) {
	data = filterJson(data);

	x.domain([
		0,
		d3.max(data, function(d) {
			return d.sources.counter.metrics.total;
		})
	]);

	y.domain([
		0,
		d3.max(data, function(d) {
			return d.sources.twitter.metrics.total;
		})
	]);

	r.domain([
		0,
		d3.max(data, function(d) {
			return d.sources.scopus.metrics.total;
		})
	]);

	chart.append('g')
		.attr('class', 'x axis')
		.attr('transform', 'translate(0, ' + height + ')')
		.call(xAxis)
		.append('text')
			.attr('class', 'label')
			.attr('x', width)
			.attr('y', -6)
			.attr('text-anchor', 'end')
			.text('Views');

	chart.append('g')
		.attr('class', 'y axis')
		.call(yAxis)
		.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 6)
			.attr('dy', '.71em')
			.style('text-anchor', 'end')
			.text('Tweets');

	var circles = chart.selectAll('.circle')
		.data(data)
		.enter()
			.append('circle')
			.attr('class', 'circle')
			.attr('cx', function(d) {
				return x(d.sources.counter.metrics.total);
			})
			.attr('cy', function(d) {
				return y(d.sources.twitter.metrics.total);
			})
			.attr('r', 0); // Set to 0 initially, animate later

	// Animate circles
	circles
		.transition()
		.duration(1500)
		.ease('elastic') // 'Bouncy' animation
		.attr('r', function(d) {
			return r(d.sources.scopus.metrics.total);
		});

	// Show tooltip
	circles
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide);
});

function filterJson(data) {
	data.forEach(function(d) {
		var src = {};
		d.sources.forEach(function(s) {
			src[s.name] = s;
		});

		d.sources = src;
	});

	return data;
}