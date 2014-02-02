function x(d) { return d.sources.counter; }
function y(d) { return d.sources.twitter; }
function r(d) { return d.total_metrics.citations; }
function key(d) { return d.doi; }

var margin = { top: 20, right: 30, bottom: 30, left: 45 }
,	width = 960
,	height = 500
;

var xScale = d3.scale.linear()
	.range([0, width]);

var yScale = d3.scale.linear()
	.range([height, 0]);

var rScale = d3.scale.linear()
	.range([5, 25]);

var xAxis = d3.svg.axis()
	.scale(xScale)
	.orient('bottom');

var yAxis = d3.svg.axis()
	.scale(yScale)
	.orient('left');

// // Set up tooltip
// var tip = d3.tip()
// 	.attr('class', 'd3-tip')
// 	.direction('e')
// 	.offset([0, 8])
// 	// Set template for tooltip 
// 	.html(function(d) {
// 		var template = document.querySelector('.template').cloneNode(true); // Clones template elem

// 		// Set title
// 		template.querySelector('.title strong').innerHTML = d.title;

// 		// Loop through details elems and set relevant stat
// 		var details = template.querySelector('.details');
// 		[].forEach.call(
// 			details.querySelectorAll('p'),
// 			function(el) {
// 				el.querySelector('span').innerHTML = d.sources[el.dataset.type].metrics.total;
// 			}
// 		);

// 		// Show tooltip
// 		template.style.display = '';

// 		return template.outerHTML;
// 	});

// Create chart
var chart = d3.select('.chart')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g') // Creates chart el within wrapper
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')'); // Offsets to give room for axes

// Append x axis
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

// Append y axis
chart.append('g')
	.attr('class', 'y axis')
	.call(yAxis)
	.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', 6)
		.attr('dy', '.71em')
		.style('text-anchor', 'end')
		.text('Tweets');

// // Create tooltip
// chart.call(tip);

// Request data, and create chart points
d3.json('data/almreport-history.json', function(err, data) {
	// Filter response
	data = filterJson(data);

	var bisect = d3.bisector(function(d) {
		return d[0];
	});

	// Set min/max values for views (scaled for the size of the chart)
	xScale.domain([
		0,
		d3.max(data, function(d) {
			return d3.sum(x(d), function(s) {
				return s[1];
			});
		})
	]);

	// Set min/max values for twitter (scaled for the size of the chart)
	yScale.domain([
		0,
		d3.max(data, function(d) {
			return d3.sum(y(d), function(s) {
				return s[1];
			});
		})
	]);

	// Set min/max values for scopus (scaled for the size of the chart)
	rScale.domain([
		0,
		d3.max(data, function(d) {
			return r(d);
		})
	]);

	// Create circles when data joins
	var circle = chart.append('g')
		.attr('class', 'circles')
		.selectAll('.circle')
			.data(interpolateData(2009))
		.enter()
			.append('circle')
			.attr('class', 'circle')
			.call(position)
			.sort(order);

	circle.append('title')
		.text(function(d) {
			return d.title;
		});

	// // Animate circles
	// circles
	// 	.transition()
	// 	.duration(1500)
	// 	.ease('elastic') // 'Bouncy' animation
	// 	.attr('r', function(d) {
	// 		return r(d.sources.scopus.metrics.total);
	// 	});

	// // Show tooltip
	// circles
	// 	.on('mouseover', tip.show)
	// 	.on('mouseout', tip.hide);

	function position(circle) {
		circle.attr('cx', function(d) {
				return xScale(x(d));
			})
			.attr('cy', function(d) {
				return yScale(y(d));
			})
			.attr('r', function(d) {
				return rScale(r(d));
			});
	}

	function order(a, b) {
		return r(b) - r(a);
	}

	function interpolateData(year) {
		return data.map(function(d) {
			return {
				doi: d.doi,
				mendeley: d.mendeley,
				pmcid: d.pmcid,
				pmid: d.pmid,
				publication_date: d.publication_date,
				title: d.title,
				total_metrics: d.total_metrics,
				update_date: d.update_date,
				url: d.url,
				sources: {
					counter: interpolateValues(x(d), year),
					twitter: interpolateValues(y(d), year)
				}
			};
		});
	}

	function interpolateValues(values, year) {
		var i = bisect.left(values, year)
		,	a = values[i]
		;

		return a[1];
	}
});

/**
 * Filters json response to convert array to associative object map
 * Makes it easier to access data sources by name
 * @param  {Object} data JSON Object to filter
 * @return {Object}      Filtered object
 */
function filterJson(data) {
	return data.map(function(d) {
		var src = {};
		d.sources.forEach(function(s) {
			if ( ! s.by_year) {
				src[s.name] = [];
				return;
			}

			src[s.name] = s.by_year.map(function(y) {
				return [y.year, y.total];
			});
		});

		return {
			doi: d.doi,
			title: d.title,
			url: d.url,
			mendeley: d.mendeley,
			pmid: d.pmid,
			pmcid: d.pmcid,
			publication_date: d.publication_date,
			update_date: d.update_date,
			total_metrics: {
				views: d.views,
				shares: d.shares,
				bookmarks: d.bookmarks,
				citations: d.citations
			},
			sources: src
		};
	});
}