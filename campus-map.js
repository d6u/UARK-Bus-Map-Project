(function (w) {
		// GOOGLE MAP OPTIONS
	var mapOptions = {
			center: new google.maps.LatLng(36.068000, -94.172500),
			zoom: 14,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			streetViewControl: false,
			mapTypeControl: false
		},
		// INIT GOOGLE MAP
		map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions),
		// INIT ROUTES STORAGE
		routes = {};
	// LOAD ROUTES INFO
	$.ajax({
		url: 'http://campusdata.uark.edu/api/routes',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'Routes',
		cache: 'true',
		success: function (data) {
			$.each(data, function (key, val) {
				if (val.status == 1) {
					routes[val.id] = val; // 19:PURPLE 24:PURPLE REDUCED
				}
			});
		},
		error: function () {
			console.log('ERROR');
		}
	})
	.done(function () {
		console.log(routes);
		// SHOW ROUTE PATH
		var shape = routes[19].shape,
			points = shape.split(','),
			routes_path = [];
		for (var i = 0; i < points.length; i++) {
			var pair = {a: null, b: null};
			pair.a = Number(points[i].split(' ')[0]);
			pair.b = Number(points[i].split(' ')[1]);
			var path = new google.maps.LatLng(pair.a, pair.b);
			routes_path[i] = path;
		}
		var routes_polyline = new google.maps.Polyline({
			path: routes_path,
			strokeColor: routes[19].color,
			strokeOpacity: 0.8,
			strokeWeight: 4
		});
		routes_polyline.setMap(map);
	});
	// SHOW BUS POSITION
	var bus;
	function showBus(id) {
		var url = 'http://campusdata.uark.edu/api/buses?callback=?&routeIds=' + id;
		$.getJSON(url, function (data) {
			console.log(data);
			console.log(data[0].latitude, data[0].longitude);
			if (bus) bus.setMap(null);
			var new_bus = new google.maps.Marker({
					position: new google.maps.LatLng(data[0].latitude, data[0].longitude),
					map: map,
					title: 'purple bus'
				});
			bus = new_bus;
		});
	}
	// SET TIME INTERVAL TO UPDATE BUS POSITION
	showBus(19);
	setInterval(function () {
		showBus(19);
	}, 10000);
})(window);

