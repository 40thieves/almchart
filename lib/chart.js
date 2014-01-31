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

		template.querySelector('.title strong').innerHTML = d.Title;

		var details = template.querySelector('.details');
		[].forEach.call(
			details.querySelectorAll('p'),
			function(el) {
				el.querySelector('span').innerHTML = d[el.dataset.type];
			}
		);

		template.style.display = 'block';

		return template.outerHTML;
	});

var chart = d3.select('.chart')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

chart.call(tip);

d3.csv('data/almreport.csv', type, function(err, data) {
	x.domain([
		0,
		d3.max(data, function(d) {
			return d.totalViews;
		})
	]);

	y.domain([
		0,
		d3.max(data, function(d) {
			return d.Twitter;
		})
	]);

	r.domain([
		0,
		d3.max(data, function(d) {
			return d.Scopus;
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
				return x(d.totalViews);
			})
			.attr('cy', function(d) {
				return y(d.Twitter);
			})
			.attr('r', 0); // Set to 0 initially, animate later

	// Animate circles
	circles
		.transition()
		.duration(1500)
		.ease('elastic') // 'Bouncy' animation
		.attr('r', function(d) {
			return r(d.Scopus);
		});

	// Show tooltip
	circles
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide);
});

function type(data) {
	// Coerce to numbers
	data.CiteULike = +data.CiteULike;
	data.CrossRef = +data.CrossRef;
	data.DataCite = +data.DataCite;
	data.F1000Prime = +data.F1000Prime;
	data.Facebook = +data.Facebook;
	data.Figshare = +data.Figshare;
	data.Mendeley = +data.Mendeley;
	data['Nature Blogs'] = +data['Nature Blogs'];
	data['PLOS PDF downloads'] = +data['PLOS PDF downloads'];
	data['PLOS Total'] = +data['PLOS Total'];
	data['PLOS XML downloads'] = +data['PLOS XML downloads'];
	data['PLOS views'] = +data['PLOS views'];
	data['PMC Europe Citations'] = +data['PMC Europe Citations'];
	data['PMC Europe Database Citations'] = +data['PMC Europe Database Citations'];
	data['PMC PDF Downloads'] = +data['PMC PDF Downloads'];
	data['PMC Total'] = +data['PMC Total'];
	data['PMC views'] = +data['PMC views'];
	data['PubMed Central'] = +data['PubMed Central'];
	data.Reddit = +data.Reddit;
	data['Research Blogging'] = +data['Research Blogging'];
	data['Science Seeker'] = +data['Science Seeker'];
	data.Scopus = +data.Scopus;
	data.Twitter = +data.Twitter;
	data['Web of Science'] = +data['Web of Science'];
	data.Wikipedia = +data.Wikipedia;
	data.Wordpress = +data.Wordpress;

	data.totalViews = data['PLOS views'] + data['PMC views'];

	return data;
}