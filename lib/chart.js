// Chart dimensions
var margin = { top: 20, right: 30, bottom: 30, left: 45 }
,	width = 960
,	height = 500
;

// Names for the x/y dimensions
var dataSourceNames = {
	x: 'counter',
	y: 'twitter'
};

// Accessors for the data's dimensions - gets data from the data structure
function x(d) { return d.sources[dataSourceNames.x]; } // X dimension
function y(d) { return d.sources[dataSourceNames.y]; } // Y dimension
function r(d) { return d.total_metrics.citations; } // Radius dimension
function key(d) { return d.doi; } // Unique key for an instance

// Scales for each dimension
var xScale = d3.scale.linear()
	.range([0, width]);

var yScale = d3.scale.linear()
	.range([height, 0]);

var rScale = d3.scale.linear()
	.range([5, 25]);

// Axes for x and y
var xAxis = d3.svg.axis()
	.scale(xScale)
	.orient('bottom');

var yAxis = d3.svg.axis()
	.scale(yScale)
	.orient('left');

// Set up tooltip
var tip = d3.tip()
	.attr('class', 'd3-tip')
	// Set template for tooltip
	.html(function(d) {
		var template = document.querySelector('.template').cloneNode(true); // Clones template elem

		// Set title
		template.querySelector('.title strong').innerHTML = d.title;

		// Loop through details elems and set relevant metric
		var details = template.querySelector('.details');
		[].forEach.call(
			details.querySelectorAll('p'),
			function(el) {
				el.querySelector('span').innerHTML = Math.round(this[el.dataset.axis](d)); // Calls x(d), for elem for x dimension
			}
		);

		// Show tooltip
		template.style.display = '';

		// Return as a string
		return template.outerHTML;
	});

// Create chart
var chart = d3.select('#chart')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g') // Creates chart elem within wrapper
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')'); // Offsets to give room for axes

// Request data, and create chart points
d3.json('data/almreport.json', function(err, data) {
	// Filter json response
	data = filterJson(data);

	// Calculate first year for data exists
	var firstYear = d3.min(data, function(d) {
		var smallestX = d3.min(x(d), function(x) { // Calculate first for x dimension
			return x[0];
		});

		var smallestY = d3.min(y(d), function(y) { // Calculate last for y dimension
			return y[0];
		});

		return smallestX < smallestY ? smallestX : smallestY;
	});

	// Calculate last year for data exists
	var lastYear = d3.max(data, function(d) {
		var largestX = d3.max(x(d), function(x) {
			return x[0];
		});

		var largestY = d3.max(x(d), function(y) {
			return y[0];
		});

		return largestX > largestY ? largestX : largestY;
	});

	// Gets maximum value of x dimension out of the nested array structure
	var maxX = d3.max(data, function(d) {
		return d3.max(x(d), function(s) {
			return s[1];
		});
	});

	// Gets maximum value of y dimension out of the nested array structure
	var maxY = d3.max(data, function(d) {
		return d3.max(y(d), function(s) {
			return s[1];
		});
	});

	var maxR = d3.max(data, function(d) { // Data structure slightly different for this dimension
		return r(d);
	});

	tip.direction(function(d) {
		if (x(d) > (0.75 * maxX)) {
			if (y(d) > (0.75 * maxY))
				return 'sw';
			else
				return 'w';
		}
		else {
			if (y(d) > (0.75 * maxY))
				return 'se';
			else
				return 'e';
		}
	})
	.offset(function(d) {
		if (y(d) > (0.75 * maxY))
			return [0, 0];
		else
			return [0, 5];
	});

	// Create tooltip
	chart.call(tip);

	// Append year label
	var label = chart.append('text')
		.attr('class', 'year label')
		.attr('text-anchor', 'end')
		.attr('y', height - 24)
		.attr('x', width)
		.text(firstYear); // Set initially to first year

	// Create bisector - enables selection of a year's data from array
	var bisect = d3.bisector(function(d) {
		// Year is first elem in array - uses as selector
		return d[0];
	});

	// Set min/max values for x dimension (scaled for the size of the chart)
	xScale.domain([0, maxX]);

	// Set min/max values for y dimension (scaled for the size of the chart)
	yScale.domain([0, maxY]);

	// Set min/max values for radius dimension (scaled for the size of the chart)
	rScale.domain([0, maxR]);

	// Append x axis
	chart.append('g')
		.attr('class', 'x axis')
		.attr('transform', 'translate(0, ' + height + ')')
		.call(xAxis)
		.append('text') // Append text label to axis
			.attr('class', 'label')
			.attr('x', width)
			.attr('y', -6)
			.attr('text-anchor', 'end')
			.text('Views');

	// Append y axis
	chart.append('g')
		.attr('class', 'y axis')
		.call(yAxis)
		.append('text') // Append text label to axis
			.attr('transform', 'rotate(-90)')
			.attr('y', 6)
			.attr('dy', '.71em')
			.style('text-anchor', 'end')
			.text('Tweets');

	// Create circles when data is added
	var circle = chart.append('g')
		.attr('class', 'circles')
		.selectAll('.circle')
			.data(interpolateData(firstYear)) // Process values for the first year (or nearest available value)
		.enter()
			.append('circle') // Creates svg circle elem
			.attr('class', 'circle')
			.call(position) // Set position data for the circle
			.sort(order); // Order the circles so that smaller circles appear above larger

	// Add overlay for the year label
	var box = label.node().getBBox();

	// Create overlay
	var overlay = chart.append('rect')
		.attr('class', 'overlay')
		.attr('x', box.x)
		.attr('y', box.y)
		.attr('width', box.width)
		.attr('height', box.height)
		.on('mouseover', enableInteraction); // Listen for mouse events

	// Start transition that animates through each year
	chart.transition()
		.duration(5000) // Lasts 5 sec
		.ease('linear')
		.tween('year', tweenYear) // Values for each year are interpolated
		.each('end', enableInteraction); // Listen for mouse events

	// Show tooltip
	circle.on('mouseover', tip.show)
		.on('mouseout', tip.hide);

	/**
	 * Positions circle based on current (scaled) data
	 * @param  {Object} circle Circle element
	 */
	function position(circle) {
		circle.attr('cx', function(d) { // Sets x dimension
				return xScale(x(d));
			})
			.attr('cy', function(d) { // Sets y dimension
				return yScale(y(d));
			})
			.attr('r', function(d) { // Sets radius dimension
				return rScale(r(d));
			});
	}

	/**
	 * Defines sort ordering so that smaller circles appear above larger circles
	 * @param  {Object} a Previous data instance
	 * @param  {Object} b Current data instance
	 * @return {Int}      Positive, negative or 0, depending on size of bubbles (actual value is unimportant)
	 */
	function order(a, b) {
		return r(b) - r(a);
	}

	/**
	 * Set up mouse interaction with year label
	 */
	function enableInteraction() {
		// Creates scaling for the label
		var yearScale = d3.scale.linear()
			.domain([firstYear, lastYear]) // Between start year and end year
			.range([box.x + 10, box.x + box.width - 10]) // Scales to fit box
			.clamp(true); // Values outside the scale are scaled down to fit

		// Cancel any ongoing transitions
		chart.transition().duration(0);

		overlay.on('mouseover', mouseover)
			.on('mouseout', mouseout)
			.on('mousemove', mousemove)
			.on('touchmove', mousemove);

		function mouseover() {
			label.classed('active', true);
		}

		function mouseout() {
			label.classed('active', false);
		}

		function mousemove() {
			// Gets mouse x position, scales it to get year, and interpolates data using the year
			displayYear(yearScale.invert(d3.mouse(this)[0]));
		}
	}

	/**
	 * Kicks off interpolation of data by interpolating the current year
	 * Circles are re-drawn using the interpolated data
	 */
	function tweenYear() {
		var year = d3.interpolateNumber(firstYear, lastYear); // Sets up interpolator between first and last years
		return function(t) { // t passed in - represents current year
			displayYear(year(t));
		};
	}

	/**
	 * Kicks off interpolation of data based on the current year
	 * @param  {Int} year Interpolated current year
	 */
	function displayYear(year) {
		circle.data(interpolateData(year), key) // Interpolates data
			.call(position) // Re-positions circles using interpolated data
			.sort(order); // Re-orders circles using interpolated data

		// Update year label with current year
		label.text(Math.round(year));
	}

	/**
	 * Interpolates data for the given (possibly fractional) year
	 * @param  {Number} year Current year
	 * @return {Object}      Interpolated data
	 */
	function interpolateData(year) {
		return data.map(function(d) {
			return {
				// Static values
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
					counter: interpolateValues(x(d), year), // Interpolates for x dimension
					twitter: interpolateValues(y(d), year)  // Interpolates for y dimension
				}
			};
		});
	}

	/**
	 * Finds, and possibly interpolates, the value for the given year, using the given values
	 * @param  {Array} values  Array of arrays containing the possible values
	 * @param  {Number} year   Current year (may be fractional)
	 * @return {Number}        Interpolated value
	 */
	function interpolateValues(values, year) {
		// Uses bisector to select the value for the year
		// If no value found, select the value for the next year in the array to the left
		var i = bisect.left(values, year, 0, values.length - 1)
		,	a = values[i] // Gets value from array
		;

		// Smoothes interpolation by returning fraction values for fractional years (I think!)
		if (i > 0) {
			var b = values[i - 1]
			,	t = (year - a[0]) / (b[0] - a[0])
			;

			return a[1] * (1 - t) + b[1] * t;
		}

		return a[1];
	}
});

/**
 * Filters json response to convert data sources array to associative object map
 * Makes it easier to access data sources by name - not dependent on array indexing
 * @param  {Object} data JSON Object to filter
 * @return {Object}      Filtered object
 */
function filterJson(data) {
	return data.map(function(d) {
		// Filters the sources array to create new obj map with metrics
		// Map is keyed using source name
		// Map holds an array of arrays containing each year and that year's value
		var src = {};
		d.sources.forEach(function(s) {
			// Empty array if no by_year value found
			// Assumed that no by_year value means no metrics found for that source
			if ( ! s.by_year) {
				src[s.name] = [];
			}
			else {
				var total;
				src[s.name] = s.by_year.map(function(y) {
					// Calculate cumulative value for data
					// Previous year's value added to current value
					if (total === undefined)
						total = y.total;
					else
						total += y.total;

					return [y.year, total];
				});
			}
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
			total_metrics: { // Nested total metrics, for clarity
				views: d.views,
				shares: d.shares,
				bookmarks: d.bookmarks,
				citations: d.citations
			},
			sources: src
		};
	});
}