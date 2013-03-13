var map;
$(document).ready(function() {
    
    // Hide safari address bar
    setTimeout(function(){
        window.scrollTo(0, 1);
    }, 0);
    
    // Mixpanel
    mixpanel.track("Page loaded");
	
	// mapping touchend and click event based on whether mobile device
	var touch = ($.browser.mobile) ? 'touchend' : 'click';
	
	// bus name => id hashmap
	var stopIconPrefix = "stop_icon_";
    var stopIconSurfix = ".svg";
	var routesData = {
		"blue":       {id: 8,  reduced: 22, stopIcon: stopIconPrefix + "blue" + stopIconSurfix},
        "brown":      {id: 12,              stopIcon: stopIconPrefix + "brown" + stopIconSurfix},
        "gray":       {id: 88,              stopIcon: stopIconPrefix + "gray" + stopIconSurfix},
        "green":      {id: 71, reduced: 23, stopIcon: stopIconPrefix + "green" + stopIconSurfix},
        "maple-hill": {id: 18,              stopIcon: stopIconPrefix + "dark" + stopIconSurfix},
        "pomfret":    {id: 20,              stopIcon: stopIconPrefix + "dark" + stopIconSurfix},
        "purple":     {id: 19, reduced: 24, stopIcon: stopIconPrefix + "purple" + stopIconSurfix},
        "red":        {id: 1,  reduced: 1,  stopIcon: stopIconPrefix + "red" + stopIconSurfix},
        "route56":    {id: 21,              stopIcon: stopIconPrefix + "dark" + stopIconSurfix},
        "tan":        {id: 15, reduced: 15, stopIcon: stopIconPrefix + "tan" + stopIconSurfix},
        "yellow":     {id: 16,              stopIcon: stopIconPrefix + "yellow" + stopIconSurfix},
	};
	
	// Initialize map options
	var mapOptions = 
    {
		center: new google.maps.LatLng(36.065475, -94.175148),
		zoom: 14,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		streetViewControl: false,
		mapTypeControl: false
	};
	
	map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
	
	// holding variables
	var watchPosition = null; // GPS watcher
	var userPosition = null; // user position marker
	var route_polyline = null; // route path
	var route_stops = []; // stop markers
	var bus_positions = []; // position markers
	var updateBusPositionTimer = null; // update bus position timer
	
	// Detect user location
	// Try W3C Geolocation
	if(navigator.geolocation) 
    {
		navigator.geolocation.getCurrentPosition(
			// success
			function(position) 
            {
				// change map center to current user location
				map.panTo( new google.maps.LatLng(position.coords.latitude, position.coords.longitude) );
				// mark current user location
				userPosition = new google.maps.Marker(
                    {
					    position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
    					icon: {
    						url: 'images/user_icon.svg',
    						scaledSize: new google.maps.Size(40, 40),
    						// anchor: new google.maps.Point(10, 10)
    					},
					    map: map
				    }
                );
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
	};
	
	// Bookmark functions
	if (location.hash != "")
	{
		var string = location.hash.replace('#', '');
		// hashtag is valid
		if ( routesData[string] )
		{
			loadRoute( routesData[string] );
			$('.top-menu').css({display: 'none'});
		}
		// hashtag is invalid
		else
		{
			location.hash = '';
		};
	};
	
	function loadRoute(routeData) {
        
        // A holder for non-reduced route data
        var normalRoute = {};
        
        // Get non-reduced route data
        $.getJSON(
            'http://campusdata.uark.edu/api/routes?callback=?', 
            {routeid: routeData.id}, 
            function(response) {
                
                normalRoute = response;
                
                // Non-reduced route is NOT in service AND reduced service available
                if ( !response.inService && routeData.reduced ) 
                {
                    $.getJSON(
                        'http://campusdata.uark.edu/api/routes?callback=?',
                        {routeid: routeData.reduced},
                        function(response) 
                        {
                            if ( response.inService ) {
                                setUpRoute(response, routeData);
                            } else {
                                setUpRoute(normalRoute, routeData);
                            };
                        }
                    );
                }
                // Non-reduced route is in service OR reduced service is NOT available
                else {
                    setUpRoute(normalRoute, routeData);
                };
            }
        );
    } // End of loadRoute()
    
    
    function setUpRoute (routeResponse, routeData) {
        
        showRoute(routeResponse);
        showStops(routeData.id, routeData);
        if ( routeResponse.inService ) 
        {
            showBusPositions(routeData.id);
            updateBusPositionTimer = setInterval(function(){
                showStops(routeData.id, routeData);
                showBusPositions(routeData.id);
            },4000);
        };
    }
    
	
	function showRoute(route) { // DISPLAY ROUTE PATH & BUS POSITION
		
		var points = route.shape.split(',');
		var routes_path = [];
        
        // Bounds object to set map viewport
        var bounds = new google.maps.LatLngBounds();
        
		for (var i = 0; i < points.length; i++) {
			var pair = {};
			pair.a = Number(points[i].split(' ')[0]);
			pair.b = Number(points[i].split(' ')[1]);
			var path = new google.maps.LatLng(pair.a, pair.b);
			routes_path[i] = path;
            
            // Include path point in Bounds objects
            bounds.extend(path);
		}
		route_polyline = new google.maps.Polyline({
			path: routes_path,
			strokeColor: route.color,
			strokeOpacity: 1,
			strokeWeight: 4
		});
		route_polyline.setMap(map);
        
        // Make map viewport fit Bounds
        map.fitBounds(bounds);
	}
	
	function showStops(id, routeData) {
		
		$.getJSON('http://campusdata.uark.edu/api/stops?callback=?',
			{routeids: id},
			function (response) {
				
				// Hold stops DOM node
				var stopInfoDOMArray = [];
				
				// Not already had stops pinned on map
				if ( route_stops.length <= 0 )
				{
                    for (var i = 0; i < response.length; i++)
					{
						// hold stop object
						var stop = response[i];
					
						// pin stop marker
						var lat = stop.latitude, lng = stop.longitude;
						var new_stop = new google.maps.Marker({
							position: new google.maps.LatLng(lat, lng),
							icon:{
								url: 'images/' + routeData.stopIcon,
								scaledSize: new google.maps.Size(21, 21),
								anchor: new google.maps.Point(10, 10)
							},
							map: map
						});
					
						// save stop marker
						route_stops[i] = new_stop;
					} // end of for loop
				};
				
				
				for (var i = 0; i < response.length; i++)
				{
					var stop = response[i];
					
					// Fill map control time table if stopID is stored
					if ( localStorage.stopID && stop.id == localStorage.stopID )
					{
						$('.schedule-info').html('Arriving at ' + stop.name);
						$('.schedule-detail').html('in ' + stop.nextArrival);
					};
					
					
					// fill schedule table
					var a = $('<a/>').attr({href: '#' + stop.id}).append(
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
		route_polyline = null;
		
		// clean stops
		if (route_stops.length > 0) {
			for (var i=0; i < route_stops.length; i++) {
				route_stops[i].setMap(null);
			};
		};
		route_stops = [];
		
		// clean buses
		if (bus_positions.length > 0) {
			for (var i=0; i < bus_positions.length; i++) {
				bus_positions[i].setMap(null);
			};
		};
		bus_positions = [];
		
		// clean timer
		clearInterval(updateBusPositionTimer);
		
		// Restore map control time table
		$('.schedule-info').html('Select stop');
		$('.schedule-detail').html('show arriving time');
	}
	
	
	// Prevent adding hashtag on default
	$('a').on('click', function(event) {
		event.preventDefault();
	});
	
	// Top menu event
	$('.route-selector').on(touch, 'a', function (e) {
		
        // Select a route
        mixpanel.track("Select a route");
        
		location.hash = $(this).attr('href');
		var rt_color = $(this).attr('href').replace('#', '');
		
		setTimeout(function() {
			// Fix interface interaction bug
			
			loadRoute(routesData[rt_color]);
			
			$('.top-menu').css({display: 'none'});
		}, 1);
	});
	
	// return to menu
	$('a[href="#show-menu"]').on(touch, function(event) {
		
		setTimeout(function() {
			// Fix interface interaction bug
			
			// show menu
			$('.top-menu').css({display: 'block'});
			
			// clear map
			cleanMap();
		}, 1);
	});
	
	// Show stops arriving schedule
	$('a[href="#route-schedule"]').on(touch, function(event) {
		
		$('.route-schedule').css({display: "block"});
	});
	
	// Select stops in arriving schedule
	$('.stop-container').on('click', 'a', function(event) {
		
		// Close stops arriving schedule
		$('a[href="#close-route-schedule"]').trigger(touch);
		
		// Remember a stop choice in localstorage memory
		if(typeof(Storage)!=="undefined")
		{
			// Yes! localStorage and sessionStorage support!
			localStorage.stopID = $(this).attr('href').replace('#', '');
		}
	})
	
	// Close stops arriving schedule
	$('a[href="#close-route-schedule"]').on(touch, function(event) {
		
		$('.route-schedule').css({display: "none"});
	})
	
}); // end of document ready
