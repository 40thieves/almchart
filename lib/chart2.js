(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(function() {
			// Also create a global in case some scripts
			// that are loaded still are looking for
			// a global even when an AMD loader is in use.
			return (root.AlmChart = factory());
		});
	}
	else {
		// Browser globals
		root.AlmChart = factory();
	}
}(this, function() {
	var extend = function(orig, extra) {
		return Object.keys(extra).forEach(function(key) {
			orig[key] = extra[key];
		});
	};

	var AlmChart = function(config) {
		extend(this.config, config);

		if ( ! this.config.el)
			throw new Error('No element is provided');

		this.setupChart();
		this.fetchData();
	};

	AlmChart.prototype.config = {
		margin: {
			top: 20,
			right: 30,
			bottom: 30,
			left: 45
		},
		width: 960,
		height: 500,
		dataSourceNames: {
			x: 'counter',
			y: 'twitter'
		}
	};

	AlmChart.prototype.x = function(data) { return data.sources[this.config.dataSourceNames.x]; };
	AlmChart.prototype.y = function(data) { return data.sources[this.config.dataSourceNames.y]; };
	AlmChart.prototype.r = function(data) { return data.total_metrics.citations; };
	AlmChart.prototype.key = function(data) { return data.doi; };

	AlmChart.prototype.setupChart = function() {
		var self = this;

		this.scales = {};

		// Scales for each dimension
		this.scales.xScale = d3.scale.linear()
			.range([0, this.config.width]);

		this.scales.yScale = d3.scale.linear()
			.range([this.config.height, 0]);

		this.scales.rScale = d3.scale.linear()
			.range([5, 25]);

		this.axes = {};

		// Axes for x and y
		this.axes.xAxis = d3.svg.axis()
			.scale(this.scales.xScale)
			.orient('bottom');

		this.axes.yAxis = d3.svg.axis()
			.scale(this.scales.yScale)
			.orient('left');

		// Set up tooltip
		this.tooltip = d3.tip()
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
						el.querySelector('span').innerHTML = Math.round(self[el.dataset.axis](d)); // Calls x(d), for elem for x dimension
					}
				);

				// Show tooltip
				template.style.display = '';

				// Return as a string
				return template.outerHTML;
			});

		this.chart = d3.select(this.config.el)
			.attr('width', this.config.width + this.config.margin.left + this.config.margin.right)
			.attr('height', this.config.height + this.config.margin.top + this.config.margin.bottom)
			.append('g')
				.attr('transform', 'translate(' + this.config.margin.left + ',' + this.config.margin.top + ')');
	};

	AlmChart.prototype.fetchData = function() {
		d3.json(this.config.url, this.draw.bind(this));
	};

	AlmChart.prototype.draw = function(err, data) {
		var self = this;

		// Filter json response
		this.data = filterJson(data);

		calculateRanges.call(this);
		setupTooltip.call(this);
		drawYearLabel.call(this);
		setDomains.call(this);
		appendAxes.call(this);
		drawCircles.call(this);
	};

	function calculateRanges() {
		var self = this;

		this.ranges = {};

		// Calculate first year for data exists
		this.ranges.firstYear = d3.min(this.data, function(d) {
			var smallestX = d3.min(self.x(d), function(x) { // Calculate first for x dimension
				return x[0];
			});

			var smallestY = d3.min(self.y(d), function(y) { // Calculate last for y dimension
				return y[0];
			});

			return smallestX < smallestY ? smallestX : smallestY;
		});

		// Calculate last year for data exists
		this.ranges.lastYear = d3.max(this.data, function(d) {
			var largestX = d3.max(self.x(d), function(x) {
				return x[0];
			});

			var largestY = d3.max(self.x(d), function(y) {
				return y[0];
			});

			return largestX > largestY ? largestX : largestY;
		});

		// Gets maximum value of x dimension out of the nested array structure
		this.ranges.maxX = d3.max(this.data, function(d) {
			return d3.max(self.x(d), function(s) {
				return s[1];
			});
		});

		// Gets maximum value of y dimension out of the nested array structure
		this.ranges.maxY = d3.max(this.data, function(d) {
			return d3.max(self.y(d), function(s) {
				return s[1];
			});
		});

		this.ranges.maxR = d3.max(this.data, function(d) { // Data structure slightly different for this dimension
			return self.r(d);
		});
	}

	function setupTooltip() {
		var self = this;

		// Set up tooltip directions based on position of circle
		this.tooltip.direction(function(d) {
			if (self.x(d) > (0.75 * self.ranges.maxX)) {
				if (self.y(d) > (0.75 * self.maxY))
					return 'sw';
				else
					return 'w';
			}
			else {
				if (self.y(d) > (0.75 * self.maxY))
					return 'se';
				else
					return 'e';
			}
		})
		.offset(function(d) {
			if (self.y(d) > (0.75 * self.maxY))
				return [0, 0];
			else
				return [0, 5];
		});

		// Create tooltip
		this.chart.call(this.tooltip);
	}

	function drawYearLabel() {
		this.yearLabel = {};

		// Append year label
		this.yearLabel.el = this.chart.append('text')
			.attr('class', 'year label')
			.attr('text-anchor', 'end')
			.attr('y', this.config.height - 24)
			.attr('x', this.config.width)
			.text(this.ranges.firstYear); // Set initially to first year

		// Add overlay for the year label
		this.yearLabel.box = this.yearLabel.el.node().getBBox();

		// Create overlay
		this.yearLabel.overlay = this.chart.append('rect')
			.attr('class', 'overlay')
			.attr('x', this.yearLabel.box.x)
			.attr('y', this.yearLabel.box.y)
			.attr('width', this.yearLabel.box.width)
			.attr('height', this.yearLabel.box.height)
			.on('mouseover', this.enableInteraction.bind(this)); // Listen for mouse events
	}

	function setDomains() {
		// Set min/max values for x dimension (scaled for the size of the chart)
		this.scales.xScale.domain([0, this.ranges.maxX]);

		// Set min/max values for y dimension (scaled for the size of the chart)
		this.scales.yScale.domain([0, this.ranges.maxY]);

		// Set min/max values for radius dimension (scaled for the size of the chart)
		this.scales.rScale.domain([0, this.ranges.maxR]);
	}

	function appendAxes() {
		// Append x axis
		this.chart.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, ' + this.config.height + ')')
			.call(this.axes.xAxis)
			.append('text') // Append text label to axis
				.attr('class', 'label')
				.attr('x', this.config.width)
				.attr('y', -6)
				.attr('text-anchor', 'end')
				.text('Views');

		// Append y axis
		this.chart.append('g')
			.attr('class', 'y axis')
			.call(this.axes.yAxis)
			.append('text') // Append text label to axis
				.attr('transform', 'rotate(-90)')
				.attr('y', 6)
				.attr('dy', '.71em')
				.style('text-anchor', 'end')
				.text('Tweets');
	}

	function drawCircles() {
		var self = this;

		// Create circles when data is added
		this.circle = this.chart.append('g')
			.attr('class', 'circles')
			.selectAll('.circle')
				.data(this.interpolateData(this.ranges.firstYear)) // Process values for the first year (or nearest available value)
			.enter()
				.append('circle') // Creates svg circle elem
				.attr('class', 'circle')
				.call(this.position.bind(this)) // Set position data for the circle
				.sort(function(a, b) { // Order the circles so that smaller circles appear above larger
					return self.r(b) - self.r(a);
				});

		// Start transition that animates through each year
		this.chart.transition()
			.duration(5000) // Lasts 5 sec
			.ease('linear')
			.tween('year', tweenYear.bind(this)) // Values for each year are interpolated
			.each('end', this.enableInteraction.bind(this)); // Listen for mouse events

		// Show tooltip
		this.circle.on('mouseover', this.tooltip.show)
			.on('mouseout', this.tooltip.hide);
	}

	/**
	 * Create bisector - enables selection of a year's data from array
	 * @param  {Function} d Callback to select the year from the array
	 */
	AlmChart.prototype.bisect = d3.bisector(function(d) {
		// Year is first elem in array - uses as selector
		return d[0];
	});

	/**
	 * Positions circle based on current (scaled) data
	 * @param  {Object} circle Circle element
	 */
	AlmChart.prototype.position = function(circle) {
		var self = this;

		circle.attr('cx', function(d) { // Sets x dimension
				return self.scales.xScale(self.x(d));
			})
			.attr('cy', function(d) { // Sets y dimension
				return self.scales.yScale(self.y(d));
			})
			.attr('r', function(d) { // Sets radius dimension
				return self.scales.rScale(self.r(d));
			});
	};

	/**
	 * Set up mouse interaction with year label
	 */
	AlmChart.prototype.enableInteraction = function() {
		var self = this;

		// Creates scaling for the label
		this.scales.yearScale = d3.scale.linear()
			.domain([this.ranges.firstYear, this.ranges.lastYear]) // Between start year and end year
			.range([this.yearLabel.box.x + 10, this.yearLabel.box.x + this.yearLabel.box.width - 10]) // Scales to fit box
			.clamp(true); // Values outside the scale are scaled down to fit

		// Cancel any ongoing transitions
		this.chart.transition().duration(0);

		this.yearLabel.overlay.on('mouseover', mouseover)
			.on('mouseout', mouseout)
			.on('mousemove', mousemove)
			.on('touchmove', mousemove);

		function mouseover() {
			self.yearLabel.el.classed('active', true);
		}

		function mouseout() {
			self.yearLabel.el.classed('active', false);
		}

		function mousemove() {
			// Gets mouse x position, scales it to get year, and interpolates data using the year
			self.displayYear(self.scales.yearScale.invert(d3.mouse(this)[0]));
		}
	};

	/**
	 * Kicks off interpolation of data by interpolating the current year
	 * Circles are re-drawn using the interpolated data
	 */
	function tweenYear() {
		var self = this;
		var year = d3.interpolateNumber(this.ranges.firstYear, this.ranges.lastYear); // Sets up interpolator between first and last years

		return function(t) { // t passed in - represents current year
			self.displayYear(year(t));
		};
	}

	/**
	 * Kicks off interpolation of data based on the current year
	 * @param  {Int} year Interpolated current year
	 */
	AlmChart.prototype.displayYear = function(year) {
		var self = this;

		this.circle.data(this.interpolateData(year), self.key) // Interpolates data
			.call(this.position.bind(this)) // Re-positions circles using interpolated data
			.sort(function(a, b) { // Re-orders circles using interpolated data
				return self.r(b) - self.r(a);
			});

		// Update year label with current year
		this.yearLabel.el.text(Math.round(year));
	};

	/**
	 * Interpolates data for the given (possibly fractional) year
	 * @param  {Number} year Current year
	 * @return {Object}      Interpolated data
	 */
	AlmChart.prototype.interpolateData = function(year) {
		var self = this;

		return this.data.map(function(d) {
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
					counter: interpolateValues.call(self, self.x(d), year), // Interpolates for x dimension
					twitter: interpolateValues.call(self, self.y(d), year)  // Interpolates for y dimension
				}
			};
		});
	};

	/**
	 * Finds, and possibly interpolates, the value for the given year, using the given values
	 * @param  {Array} values  Array of arrays containing the possible values
	 * @param  {Number} year   Current year (may be fractional)
	 * @return {Number}        Interpolated value
	 */
	function interpolateValues(values, year) {
		// Uses bisector to select the value for the year
		// If no value found, select the value for the next year in the array to the left
		var i = this.bisect.left(values, year, 0, values.length - 1)
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

	return AlmChart;
}));