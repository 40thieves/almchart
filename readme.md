## AlmChart

### Visualising Altmetrics Data Changes Over Time

Javascript library for creating a visualisation of altmetrics data and shows its change over time. Data must be retrieved from the Public Library of Science (PLOS) [ALM API](http://alm.plos.org/).

### Dependencies

* [D3.js](http://d3js.org/)
* [d3-tip](https://github.com/caged/d3-tip)

### Usage

A demo is included in the `demo` directory of this repository, showing the usage of the library.

#### Drawing the chart

##### 1. Include library files

Include the `chart.js` file (and optionally the `chart.css` file)

##### 2. Create an root element for the chart

```html
<svg id="chart"></svg>
```

##### 3. Boot the library

Provide options to the library. Required options are `el` and `url`.

```js
var chart = new AlmChart({
	el: document.querySelector('#chart'),
	url: 'data/almreport.json'
});
```

You can optionally set the following options:

* `el` _[required]_ The element where the chart will be appended
* `url` _[required]_ URL to the data (in JSON format)
* `width` Width of the chart
* `height` Height of the chart
* `margin` Object (with `top`, `bottom`, `left` and `right` properties) defining the margins around the chart
* `dataSourceKeys` Object (with `x` and `y` properties) defining the names of the selected data sources, as used by the `sources` array in the data
* `dataSourceNames` Object (with `x` and `y` properties) defining the human-readable names of the selected data sources, to be shown on the relevant axes

##### 4. Draw the chart

Call the `draw()` method on the library.

```js
chart.draw();
```

#### Changing the selected data sources

Once the chart has been initialised, the selected data sources for the x- and y-axes can be changed using the `setConfig()` method.

```js
chart.setConfig({
	dataSourceKeys: {
		x: 'facebook',
		y: 'mendeley'
	},
	dataSourceNames: {
		x: 'Facebook likes',
		y: 'Mendeley saves'
	}
});
```

This method can also be used to change the options set on the library. Note: at this time, the chart is not updated if the size or margins of the chart are changed.

### License

(The MIT License)

Copyright &copy; 2014 Alasdair Smith, [http://alasdairsmith.org.uk](http://alasdairsmith.org.uk)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
