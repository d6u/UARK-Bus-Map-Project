$(document).ready(function() {
	
	// mapping touchend and click event based on whether mobile device
	var touch = ($.browser.mobile) ? 'touchend' : 'click';
	
	// bus name => id hashmap
	var routesID = {
		"red": [1, 1],
		"brown": 15,
		"tan": [15, 15],
		"yellow": 16,
		"maple-hill": 18,
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
	var updateBusPositionTimer = null; // update bus position timer
	
	// detect user location
	// Try W3C Geolocation
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			// success
			function(position) {
				// change map center to current user location
				map.panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
				// mark current user location
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
					// success: update marker position after successfully update GPS data
					function(position) {
						userPosition.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
					},
					// fail: clear watcher after fail
					function() {
						navigator.geolocation.clearWatch(watchPosition);
					}
				);
			} // end of getCurrentPosition -> success function
		); // end of getCurrentPosition
	}
	
	// Bookmark functions
	if (location.hash != "")
	{
		var hashString = location.hash.replace('#', '');
		// hashtag is valid
		if (routesID[hashString] != undefined)
		{
			loadRoute( routesID[hashString] );
			$('.top-menu').css({display: 'none'});
		}
		// hashtag is invalid
		else
		{
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
				if ( response.inService || normalID == reducedID )
				{
					showRoute(response);
					showStops(normalID);
					
					if ( response.inService )
					{
						showBusPositions(normalID);
						updateBusPositionTimer = setInterval(function(){
							showStops(normalID);
							showBusPositions(normalID);
						},4000);
					};
				}
				// normal service is not available and routes has reduced service
				else
				{
					// load reduced path
					$.getJSON('http://campusdata.uark.edu/api/routes?callback=?',
						{routeid: reducedID},
						function(response) {
							showRoute(response);
							showStops(reducedID);
							
							if (response.inService)
							{
								showBusPositions(reducedID);
								updateBusPositionTimer = setInterval(function(){
									showStops(reducedID);
									showBusPositions(reducedID);
								},4000);
							};
						});
				};
			} // end of getJSON callback
		); // end of getJSON
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
		
		$.getJSON('http://campusdata.uark.edu/api/stops?callback=?',
			{routeids: routeID},
			function (response) {
				
				// clean stops
				if (route_stops.length > 0) {
					for (var i=0; i < route_stops.length; i++) {
						route_stops[i].setMap(null);
					};
				};
				
				// Hold stops DOM node
				var stopInfoDOMArray = [];
				
				for (var i = 0; i < response.length; i++)
				{
					// hold stop object
					var stop = response[i];
					
					// pin stop marker
					var lat = stop.latitude, lng = stop.longitude;
					var new_stop = new google.maps.Marker({
						position: new google.maps.LatLng(lat, lng),
						icon:{
							url: 'images/stop_icon.svg',
							scaledSize: new google.maps.Size(21, 21),
							anchor: new google.maps.Point(10, 10)
						},
						map: map
					});
					
					// save stop marker
					route_stops[i] = new_stop;
					
					// fill schedule table
					var a = $('<a/>').attr({href: '#'}).append(
						$('<div/>').addClass('stop-name').html(stop.name),
						$('<div/>').addClass('arriving-time').html(stop.nextArrival)
					);
					stopInfoDOMArray.push(a);
				} // end of for loop
				$('.stop-container').empty().append(stopInfoDOMArray);
			} // end of getJSON callback
		); // end of getJSON
	}
	
	// showBusPositions() also in charge of changing schedule clock
	function showBusPositions(routeID) {
		
		$.getJSON('http://campusdata.uark.edu/api/buses?callback=?', 
			{routeids: routeID},
			function (response)
			{
				if (bus_positions.length > 0)
				{
					// clear bus_position markers
					for (var i=0; i < bus_positions.length; i++)
					{
						bus_positions[i].setMap(null);
					};
				};
				
				// hold value for shortest
				var shortestMin = null;
				for (var i = 0; i < response.length; i++)
				{
					var lat = response[i].latitude, lng = response[i].longitude;
					var new_bus = new google.maps.Marker({
						position: new google.maps.LatLng(lat, lng),
						map: map,
						// icon:{
						// 	url: 'bus_icon.svg',
						// 	scaledSize: new google.maps.Size (27.5, 27.5)
						// }
					});
					bus_positions[i] = new_bus;
				}
			} // end of getJSON callback
		); // end of getJSON
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
	
	// Show stops arriving schedule
	$('a[href="#route-schedule"]').on(touch, function(event) {
		
		event.preventDefault();
		$('.route-schedule').css({display: "block"});
	});
	
	// Close stops arriving schedule
	$('a[href="#close-route-schedule"]').on(touch, function(event) {
		
		event.preventDefault();
		$('.route-schedule').css({display: "none"});
	})
	
}); // end of document ready
