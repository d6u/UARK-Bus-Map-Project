$(document).ready(function() {
	
	// mapping touchend and click event based on whether mobile device
	var touch = ($.browser.mobile) ? 'touchend' : 'click';
	
	// bus name => id hashmap
	var routesID = {
		"red": [1, 1],
		"brown": 15,
		"tan": [15, 15],
		"yellow": 16,
		"mapleHill": 18,
		"purple": [19, 24],
		"pomfret": 20,
		"route56": 21,
		"blue": [8, 22],
		"green": [71, 23],
		"gray": 88
	};
	
	// Initialize map options
	var mapOptions = {
		center: new google.maps.LatLng(36.065475, -94.175148),
		zoom: 14,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		streetViewControl: false,
		mapTypeControl: false
	};
	
	var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
	
	// holding variables
	var watchPosition = null; // GPS watcher
	var userPosition = null; // user position marker
	var route_polyline = null; // route path
	var route_stops = []; // stop markers
	var bus_positions = []; // position markers
	var updateBusPositionTimer;
	
	// detect user location
	// Try W3C Geolocation
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			// success
			function(position) {
				map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
				userPosition = new google.maps.Marker({
					position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
					icon:{
						url: 'images/user_icon.svg',
						scaledSize: new google.maps.Size(40, 40),
						// anchor: new google.maps.Point(10, 10)
					},
					map: map
				});
				watchPosition = navigator.geolocation.watchPosition(
					// success
					function(position) {
						userPosition.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
					},
					// fail
					function() {
						navigator.geolocation.clearWatch(watchPosition);
					}
				);
			} // end of getCurrentPosition -> success function
		); // end of getCurrentPosition
	}
	
	// Bookmark functions
	if (location.hash != "")
	// has bookmark
	{
		var hashString = location.hash.replace('#', '');
		// hashtag is valid
		if (routesID[hashString] != undefined) {
			loadRoute( routesID[hashString] );
			$('.top-menu').css({display: 'none'});
		}
		// hashtag is invalid
		else {
			location.hash = '';
		};
	};
	
	function loadRoute(idPair) {
		
		// route with reduced service or not
		if (Array.isArray(idPair)) {
			var normalID = idPair[0];
			var reducedID = idPair[1];
		}
		else {
			var normalID = idPair;
			var reducedID = idPair;
		};
		
		// load normal path
		$.getJSON('http://campusdata.uark.edu/api/routes?callback=?', 
			{routeid: normalID}, 
			function(response) {
				if (response.inService) {
					showRoute(response);
					showStops(normalID);
					showBusPositions(normalID);
					updateBusPositionTimer = setInterval(function(){
						showBusPositions(normalID);
					},4000);
				}
				else {
					// load reduced path
					$.getJSON('http://campusdata.uark.edu/api/routes?callback=?',
						{routeid: reducedID},
						function(response) {
							showRoute(response);
							showStops(reducedID);
							
							if (response.inService) {
								showBusPositions(reducedID);
								updateBusPositionTimer = setInterval(function(){
									showBusPositions(reducedID);
								},4000);
							};
						});
				};
		});
	}
	
	function showRoute(route) { // DISPLAY ROUTE PATH & BUS POSITION
		
		var points = route.shape.split(',');
		var routes_path = [];
		for (var i = 0; i < points.length; i++) {
			var pair = {};
			pair.a = Number(points[i].split(' ')[0]);
			pair.b = Number(points[i].split(' ')[1]);
			var path = new google.maps.LatLng(pair.a, pair.b);
			routes_path[i] = path;
		}
		route_polyline = new google.maps.Polyline({
			path: routes_path,
			strokeColor: route.color,
			strokeOpacity: 0.8,
			strokeWeight: 4
		});
		route_polyline.setMap(map);
	}
	
	function showStops(routeID) {
		
		$.getJSON('http://campusdata.uark.edu/api/stops?callback=?', {routeids: routeID}, function (response) {
			for (var i = 0; i < response.length; i++)
			{
				var lat = response[i].latitude, lng = response[i].longitude;
				var new_stop = new google.maps.Marker({
					position: new google.maps.LatLng(lat, lng),
					icon:{
						url: 'images/stop_icon.svg',
						scaledSize: new google.maps.Size(21, 21),
						anchor: new google.maps.Point(10, 10)
					},
					map: map
				});
				route_stops[i] = new_stop;
			}
		});
	}
	
	function showBusPositions(routeID) {
		
		$.getJSON('http://campusdata.uark.edu/api/buses?callback=?', {routeids: routeID}, function (response) {
			if (bus_positions.length > 0) {
				for (var i=0; i < bus_positions.length; i++) {
					bus_positions[i].setMap(null);
				};
			};
			for (var i = 0; i < response.length; i++) {
				var lat = response[i].latitude, lng = response[i].longitude;
				var new_bus = new google.maps.Marker({
					position: new google.maps.LatLng(lat, lng),
					map: map,
					// icon:{
// 						url: 'bus_icon.svg',
// 						scaledSize: new google.maps.Size (27.5, 27.5)
// 					}
				});
				bus_positions[i] = new_bus;
			}
		});
	}
	
	// clean map function
	function cleanMap() {
		
		// clean route path
		route_polyline.setMap(null);
		
		// clean stops
		if (route_stops.length > 0) {
			for (var i=0; i < route_stops.length; i++) {
				route_stops[i].setMap(null);
			};
		};
		
		// clean buses
		if (bus_positions.length > 0) {
			for (var i=0; i < bus_positions.length; i++) {
				bus_positions[i].setMap(null);
			};
		};
		
		// clean timer
		clearInterval(updateBusPositionTimer);
	}
	
	// Top menu event
	$('.route-selector').on(touch, 'a', function (e) {
		
		location.hash = $(this).attr('href');
		var rt_color = $(this).attr('href').replace('#', '');
		
		setTimeout(function() {
			// To fix interface interaction bug
			
			loadRoute(routesID[rt_color]);
			
			$('.top-menu').css({display: 'none'});
			$('.control-menu').css({display: 'block'});
		}, 1);
	});
	
	// return to menu
	$('a[href="#show-menu"]').on(touch, function(event) {
		
		setTimeout(function() {
			// To fix interface interaction bug
			
			// show menu
			$('.top-menu').css({display: 'block'});
			$('.control-menu').css({display: 'none'});
			
			// clear map
			cleanMap();
		}, 1);
	});
	
	
}); // end of document ready
