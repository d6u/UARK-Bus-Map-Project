var map;
var searchMarkers = [];
var walkingMarkers = [];
var searchData = [];
var markerClasses = [];
var brownClasses = [];
var infowindow;
var selectedRoutes = [];
//JSON Array or routes
var routes = [];
//JSON Array or stops
var stops = [];
//Google Map polylines
var routePolylines = [];
//Google Map circles
var stopsCircles = [];
//historic markers
var historicMarkers = [];
var specialAreaMarkers = [];
//public arts
var markers = [];
var publicArts = [];
var parkingLots = [];
var parkingZones = [];
var bicycleRacks = [];
var motoParking = [];
var dinings = [];
var computerLabs = [];
var emergencyBoxes = [];
var accessiblePoints = [];
//Walking directions
var locationA = null;
var locationB = null;
var directionsPath = [];
var directionsShape = null;
var markerA = null;
var markerB = null;
var directionOptions = [];
var labels = [];
var labelCodes = [];
var buildingId = null;
var addthis_config;
markerClasses[0] = 'red_MarkerA';
markerClasses[1] = 'red_MarkerB';
markerClasses[2] = 'red_MarkerC';
markerClasses[3] = 'red_MarkerD';
markerClasses[4] = 'red_MarkerE';
brownClasses[0] = 'brown_MarkerA';
brownClasses[1] = 'brown_MarkerB';
brownClasses[2] = 'brown_MarkerC';
brownClasses[3] = 'brown_MarkerD';
brownClasses[4] = 'brown_MarkerE';
var shapes = [];
var routeIds;
var buses = [];
//var interval;
var t;
var hubBuses;
var started = false;
var activeBuses = [];
var fixgeometry = function () {
	var header = $("header");
	var footer = $("footer");
	var viewport_height = $(window)
		.height();
	var mapdivMap = document.getElementById("map_canvas");
	var content_height = viewport_height - header.outerHeight();
	mapdivMap.style.width = '100%';
	if (content_height > 600) {
		mapdivMap.style.height = content_height + 'px';
	} else {
		mapdivMap.style.height = '666px';
	}
}; /* fixgeometry */

function initMap() {
	fixgeometry();
	$(window)
		.bind("resize", fixgeometry);
	var latlng, myStyles, myOptions, homeControlDiv, homeControl;
	latlng = new google.maps.LatLng(36.068000, - 94.172500);
	var myStyles = [{
		featureType: "landscape.man_made",
		stylers: [{
			visibility: "off"
		}]
	}, {
		featureType: "poi",
		elementType: "labels",
		stylers: [{
			visibility: "off"
		}]
	}];
	myOptions = {
		zoom: 17,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		streetViewControl: true,
		mapTypeControl: true,
		styles: myStyles
	};
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	initAddThis(latlng);
	showBuildings();
	showSpecialAreas();
	homeControlDiv = document.createElement('DIV');
	homeControlDiv.id = 'mainMenu';
	homeControl = new HomeControl(homeControlDiv, map, latlng);
	homeControlDiv.index = 1;
	map.controls[google.maps.ControlPosition.RIGHT_TOP].push(homeControlDiv);
	if (buildingId !== null) {
		showBuilding(buildingId);
	}
	google.maps.event.addListener(map, 'zoom_changed', function () {
		if (map.getZoom() > 17) {
			clearTimeout(t);
			t = setTimeout("showLabels(1)", 500);
			$.each(specialAreaMarkers, function (key, val) {
				if (val != null) specialAreaMarkers[key].setVisible(true);
			});
		}
		if (map.getZoom() <= 17 && map.getZoom() >= 16) {
			clearTimeout(t);
			t = setTimeout("showLabels(2)", 500);
			$.each(specialAreaMarkers, function (key, val) {
				if (val != null) specialAreaMarkers[key].setVisible(true);
			});
		}
		if (map.getZoom() < 16) {
			clearTimeout(t);
			showLabels(0);
			$.each(specialAreaMarkers, function (key, val) {
				if (val != null) specialAreaMarkers[key].setVisible(false);
			});
		}
		if (map.getZoom() <= 13) {
			$.each(stopsCircles, function (key, val) {
				if (val != null) {
					stopsCircles[key].setVisible(false);
				}
			});
		}
		if (map.getZoom() > 13) {
			$.each(stopsCircles, function (key, val) {
				if (val != null) {
					stopsCircles[key].setVisible(true);
				}
			});
		}
	});
	google.maps.event.addListener(map, 'maptypeid_changed', function () {
		if (map.getMapTypeId() == 'roadmap') {
			$.each(shapes, function (key, val) {
				if (val != null) {
					polyOptions = {
						fillOpacity: 1,
						strokeOpacity: 1
					};
					shapes[key].setOptions(polyOptions);
				}
			});
		} else {
			$.each(shapes, function (key, val) {
				if (val != null) {
					polyOptions = {
						fillOpacity: 0,
						strokeOpacity: 0
					};
					shapes[key].setOptions(polyOptions);
				}
			});
		}
	});
	//init signalr
	$.connection.hub.url = 'http://campusdata.uark.edu/signalr';
	hubBuses = $.connection.busesHub;
	hubBuses.updateBuses = function (data) {
		trackBuses(data);
	};
}

function initAddThis(latlng) {
	addthis_config = {
		ui_hover_direction: -1,
		ui_delay: 3000
	}
	var infoContent2 = '<!-- AddThis Button BEGIN -->' + '<div id ="tool2" class="addthis_toolbox addthis_default_style ">' + '<a class="addthis_button_preferred_1"></a>' + '<a class="addthis_button_preferred_2"></a>' + '<a class="addthis_button_preferred_3"></a>' + '<a class="addthis_button_preferred_4"></a>' + '<a class="addthis_button_compact"></a>' + '<a class="addthis_counter addthis_bubble_style"></a>' + '</div>';
	infowindow = new google.maps.InfoWindow({
		content: infoContent2
	});
	infowindow.setPosition(latlng);
	infowindow.open(map);
	var url = 'http://campusmaps.uark.edu';
	// addthis.update('share', 'url', url);
	addthis.toolbox("#tool2");
	infowindow.close();
}

function onFeedback() {
	$('#searchResult')
		.hide();
	$('#buses')
		.hide();
	$('#walking')
		.hide();
	$('#parking')
		.hide();
	$('#sights')
		.hide();
	$('#services')
		.hide();
	$('#busesImg')
		.removeClass("menuSelected");
	$('#walkingImg')
		.removeClass("menuSelected");
	$('#parkingImg')
		.removeClass("menuSelected");
	$('#sightsImg')
		.removeClass("menuSelected");
	$('#servicesImg')
		.removeClass("menuSelected");
	var feedback = $('#feedback');
	// var moreList = $('#more_list');
	if (feedback.is('.selected')) {
		feedback.hide();
		// $('#more_nav .ui-icon').css('background', 'url(http://campusmaps.uark.edu/content/arrow_d.png)');
	} else {
		// feedback.slideDown(200);
		feedback.show();
		// $('#more_nav .ui-icon').css('background', 'url(http://campusmaps.uark.edu/content/arrow_u.png)');
	}
	feedback.toggleClass('selected');
	//$( "#dialog-modal" ).dialog('open');
}

function showLabels(percentage) {
	$.each(labels, function (key, val) {
		if (percentage == 0) {
			labelCodes[key].set('visible', false);
			labels[key].set('visible', false);
		}
		if (percentage == 1) {
			labels[key].set('visible', true);
			labelCodes[key].set('visible', false);
		}
		if (percentage == 2) {
			labelCodes[key].set('visible', true);
			labels[key].set('visible', false);
		}
	});
}

function showBuildings() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/buildings',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'Buildings',
		cache: 'true',
		success: function (data) {
			$.each(data, function (key, val) {
				if (val.shape !== null) {
					var shape, coordinates, polyPoints, polyOptions, polyShape, infoContent, LngLat, i;
					//Get shape
					shape = val.shape;
					//Split shape into array of coordinates
					coordinates = shape.split(",");
					polyPoints = [];
					$.each(coordinates, function (key, val) {
						LngLat = val.toString()
							.split(" ");
						polyPoints.push(new google.maps.LatLng(LngLat[0], LngLat[1]));
					});
					polyOptions = {
						path: polyPoints,
						strokeColor: "#CCCCCC",
						strokeOpacity: 1,
						strokeWeight: 1,
						fillColor: '#F7F3E7',
						fillOpacity: 1,
						zIndex: 5
					};
					polyShape = new google.maps.Polygon(polyOptions);
					polyShape.setMap(map);
					var label = new Label({
						map: map
					});
					label.set('position', new google.maps.LatLng(val.latitude, val.longitude));
					label.set('zIndex', 25);
					label.set('text', val.name);
					label.set('visible', false);
					var labelCode = new Label({
						map: map
					});
					labelCode.set('position', new google.maps.LatLng(val.latitude, val.longitude));
					labelCode.set('zIndex', 25);
					labelCode.set('text', val.code);
					labelCode.set('visible', false);
					labels.push(label);
					labelCodes.push(labelCode);
					infoContent = '<p><b>(' + val.code + ') ' + val.name + '</b></p>';
					if (val.address !== '' && val.address !== null) {
						infoContent += '<p>' + val.address + '</p>';
					}
					if (val.city !== '' && val.city !== null) {
						infoContent += '<p>' + val.city + ', ' + val.state + ' ' + val.zip + '</p>';
					}
					if (val.phone !== '' && val.phone !== null) {
						infoContent += '<p>' + val.phone + '</p>';
					}
					if (val.url !== '' && val.url !== null) {
						infoContent += '<p><a href ="' + val.url + '">' + val.url + '</a></p>';
					}
					infoContent += '<br /><!-- AddThis Button BEGIN -->' + '<div id ="toolbox' + val.id + '" class="addthis_toolbox addthis_default_style ">' + '<a class="addthis_button_email" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '<a class="addthis_button_facebook" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '<a class="addthis_button_twitter" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '<a class="addthis_button_google_plusone_share" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '</div>';
					//Add Infowindow to Marker
					google.maps.event.addListener(polyShape, 'click', function (event) {
						if (infowindow) {
							infowindow.close();
						}
						infowindow = new google.maps.InfoWindow({
							content: infoContent
						});
						infowindow.setPosition(event.latLng);
						infowindow.open(map);
						var url = 'http://campusmaps.uark.edu?buildingId=' + val.id;
						//addthis.update('share', 'url', url);
						addthis.toolbox("#toolbox" + val.id);
					});
					//Add polyShape to Shapes array.
					shapes.push(polyShape);
				}
			});
			showLabels(2);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			// alert('Unable to load Buildings. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function showSpecialAreas() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/specialareas',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'SpecialAreas',
		cache: 'true',
		success: function (data) {
			$.each(data, function (key, val) {
				if (val.shape != null && val.color != null && val.color != "") {
					var shape, coordinates, polyPoints, polyOptions, polyShape, infoContent, LngLat, i;
					//Get shape
					shape = val.shape;
					//Split shape into array of coordinates
					coordinates = shape.split(",");
					polyPoints = [];
					$.each(coordinates, function (key, val) {
						LngLat = val.toString()
							.split(" ");
						polyPoints.push(new google.maps.LatLng(LngLat[0], LngLat[1]));
					});
					polyOptions = {
						path: polyPoints,
						strokeColor: val.color,
						strokeOpacity: 0.5,
						strokeWeight: 0.5,
						fillColor: val.color,
						fillOpacity: 1,
						zIndex: 10
					};
					polyShape = new google.maps.Polygon(polyOptions);
					polyShape.setMap(map);
					infoContent = '<p><b>' + val.name + '</b></p>';
					infoContent += '<p>' + val.description + '</p>';
					//Add Infowindow to Marker
					if (val.image != "") {
						var marker = new google.maps.Marker({
							position: new google.maps.LatLng(val.latitude, val.longitude),
							map: map,
							title: val.description,
							clickable: false,
							icon: val.image
						});
						google.maps.event.addListener(marker, 'click', function (event) {
							if (infowindow) {
								infowindow.close();
							}
							infowindow = new google.maps.InfoWindow({
								content: infoContent
							});
							infowindow.setPosition(event.latLng);
							infowindow.open(map);
						});
						specialAreaMarkers.push(marker);
					}
					google.maps.event.addListener(polyShape, 'click', function (event) {
						if (infowindow) {
							infowindow.close();
						}
						infowindow = new google.maps.InfoWindow({
							content: infoContent
						});
						infowindow.setPosition(event.latLng);
						infowindow.open(map);
					});
					//Add polyShape to Shapes array.
					shapes.push(polyShape);
				}
			});
			if (map.getZoom() < 16) {
				$.each(specialAreaMarkers, function (key, val) {
					if (val != null) specialAreaMarkers[key].setVisible(false);
				});
			}
		},
		error: function (xhr, ajaxOptions, thrownError) {
			// alert('Unable to load Buildings. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function showBuilding(buildingId) {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/buildings',
		data: {
			buildingId: buildingId
		},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'Building',
		cache: 'true',
		success: function (val) {
			if (val.id == buildingId && val.latitude != null && val.latitude != "" && val.longitude != null && val.longitude != "" && val.shape != null && val.shape != "") {
				//Create Latitude/Longitude object from coordinates
				var latlng = new google.maps.LatLng(val.latitude, val.longitude);
				map.setCenter(latlng);
				map.setZoom(17);
				infoContent = '<p><b>(' + val.code + ') ' + val.name + '</b></p>';
				//Create a marker in the map
				var marker = new google.maps.Marker({
					position: latlng,
					map: map,
					title: val.name
				});
				if (val.address !== '' && val.address !== null) {
					infoContent += '<p>' + val.address + '</p>';
				}
				if (val.city !== '' && val.city !== null) {
					infoContent += '<p>' + val.city + ', ' + val.state + ' ' + val.zip + '</p>';
				}
				if (val.phone !== '' && val.phone !== null) {
					infoContent += '<p>' + val.phone + '</p>';
				}
				if (val.url !== '' && val.url !== null) {
					infoContent += '<p><a href ="' + val.url + '">' + val.url + '</a></p>';
				}
				infoContent += '<br /><!-- AddThis Button BEGIN -->' + '<div id ="toolbox' + val.id + '" class="addthis_toolbox addthis_default_style ">' + '<a class="addthis_button_email" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '<a class="addthis_button_facebook" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '<a class="addthis_button_twitter" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '<a class="addthis_button_google_plusone_share" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '</div>';
				//Add Infowindow to Marker
				google.maps.event.addListener(marker, 'click', function (event) {
					if (infowindow) infowindow.close();
					infowindow = new google.maps.InfoWindow({
						content: infoContent
					});
					infowindow.setPosition(event.latLng);
					infowindow.open(map);
					addthis.toolbox("#toolbox0");
				});
				//Add Marker to Markers array.
				markers.push(marker);
			}
		},
		error: function (xhr, ajaxOptions, thrownError) {
			// alert('Unable to load Buildings. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function onSearch() {
	onMapSearchHover();
	clearDirections();
	locationA = null;
	locationB = null;
	$('#lookfor')
		.addClass("ui-autocomplete-loading");
	searchData = [];
	var search = $('#lookfor')
		.val();
	$.ajax({
		url: 'http://campusdata.uark.edu/api/places',
		data: {
			search: search
		},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'Search',
		cache: 'true',
		success: function (data) {
			var i = 0;
			$.each(data, function (key, val) {
				// if (val.shape != null) {
				searchData[i] = val;
				i = i + 1;
				//  }
			});
			showSearch(1);
			$('#lookfor')
				.removeClass("ui-autocomplete-loading");
		},
		error: function (xhr, ajaxOptions, thrownError) {
			map.setCenter(new google.maps.LatLng(36.068000, - 94.172500));
			map.setZoom(17);
			//clean prev search		 
			clearSearch();
			$('#lookfor')
				.removeClass("ui-autocomplete-loading");
			//alert('Unable to Search. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function clearSearch() {
	var i;
	$('#searchResult')
		.empty();
	if (infowindow) {
		infowindow.close();
	}
	//clear markers
	$.each(searchMarkers, function (key, val) {
		if (val !== null) {
			searchMarkers[key].setMap(null);
		}
	});
	searchMarkers = [];
}

function showSearch(pageNumb) {
	var results, latlngbounds, startIndex, data, i, markerClass, zoomListener, listener;
	//clean prev search		 
	clearSearch();
	results = null;
	//var j =0;
	latlngbounds = new google.maps.LatLngBounds();
	startIndex = 5 * pageNumb - 5;
	data = [];
	for (i = startIndex; i <= 4 + startIndex; i = i + 1) {
		if (i >= searchData.length) {
			break;
		}
		data.push(searchData[i]);
	}
	$.each(data, function (key, val) {
		markerClass = markerClasses[key];
		if (results !== null) {
			if (val.type == '1') {
				if (val.name2 !== 'Office') {
					results = results + '<li style="list-style-type: none; margin-bottom: 4px"><a href="javascript:clickMarker(' + key + ')"><span class="' + markerClass + '"></span><span>(' + val.code + ') ' + val.name + ' - ' + val.name2 + '</span></a></li>';
				} else {
					results = results + '<li style="list-style-type: none; margin-bottom: 4px"><a href="javascript:clickMarker(' + key + ')"><span class="' + markerClass + '"></span><span>(' + val.code + ') ' + val.name + '</span></a></li>';
				}
			} else {
				results = results + '<li style="list-style-type: none; margin-bottom: 4px"><a href="javascript:clickMarker(' + key + ')"><span class="' + markerClass + '"></span><span>(' + val.code + ') ' + val.name + '</span></a></li>';
			}
		} else {
			if (val.type == '1') {
				if (val.name2 !== 'Office') {
					results = '<li style="list-style-type: none; margin-bottom: 4px"><a href="javascript:clickMarker(' + key + ')"><span class="' + markerClass + '"></span><span>(' + val.code + ') ' + val.name + ' - ' + val.name2 + '</span></a></li>';
				} else {
					results = '<li style="list-style-type: none; margin-bottom: 4px"><a href="javascript:clickMarker(' + key + ')"><span class="' + markerClass + '"></span><span>(' + val.code + ') ' + val.name + '</span></a></li>';
				}
			} else {
				results = '<li style="list-style-type: none; margin-bottom: 4px"><a href="javascript:clickMarker(' + key + ')"><span class="' + markerClass + '"></span><span>(' + val.code + ') ' + val.name + '</span></a></li>';
			}
		}
		//Create Latitude/Longitude object from coordinates
		//  latlng = new google.maps.LatLng(val.latitude, val.longitude);
		var latlng = new google.maps.LatLng(val.latitude, val.longitude);
		//Create Latitude/Longitude object from coordinates
		$.each(searchMarkers, function (key2, val2) {
			if (val2.getPosition()
				.lat() == latlng.lat() && val2.getPosition()
				.lng() == latlng.lng()) {
				val.longitude = parseFloat(val.longitude) + 0.00020;
				searchMarkers[key2].setPosition(new google.maps.LatLng(val2.getPosition()
					.lat(), (parseFloat(val2.getPosition()
					.lng()) - 0.00020)));
			}
		});
		latlng = new google.maps.LatLng(val.latitude, val.longitude);
		latlngbounds.extend(latlng);
		//Create custom icon
		//icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/" + markerClasses[key] + ".png", new google.maps.Size(20, 34), new google.maps.Point(0, 0), new google.maps.Point(0, 34));
		// shadow = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/shadow.png", new google.maps.Size(40.0, 34.0), new google.maps.Point(0, 0), new google.maps.Point(10.0, 17.0));
		var icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/" + markerClasses[key] + ".png");
		//Create a marker in the map
		var marker = new google.maps.Marker({
			position: latlng,
			map: map,
			icon: icon,
			//  shape: shape,
			// shadow: shadow,
			title: val.name
		});
		var infoContent = '<p><b>(' + val.code + ') ' + val.name + '</b></p>';
		if (val.type == '1') {
			infoContent += '<p>' + val.name2 + '</p>';
		}
		if (val.room !== '' && val.room !== null) {
			infoContent += '<p>Room: ' + val.room + '</p>';
		}
		if (val.address !== '' && val.address !== null) {
			infoContent += '<p>' + val.address + '</p>';
		}
		if (val.city !== '' && val.city !== null) {
			infoContent += '<p>' + val.city + ', ' + val.state + ' ' + val.zip + '</p>';
		}
		if (val.phone !== '' && val.phone !== null) {
			infoContent += '<p>' + val.phone + '</p>';
		}
		if (val.url !== '' && val.url !== null) {
			infoContent += '<p><a href ="' + val.url + '">' + val.url + '</a></p>';
		}
		if (val.type == '0') {
			infoContent += '<br /><!-- AddThis Button BEGIN -->' + '<div id ="toolbox' + val.id + '" class="addthis_toolbox addthis_default_style ">' + '<a class="addthis_button_email" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '<a class="addthis_button_facebook" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '<a class="addthis_button_twitter" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '<a class="addthis_button_google_plusone_share" addthis:url="http://campusmaps.uark.edu?buildingId=' + val.id + '"></a>' + '</div>';
		}
		//Add Infowindow to Marker
		google.maps.event.addListener(marker, 'click', function () {
			if (infowindow) {
				infowindow.close();
			}
			infowindow = new google.maps.InfoWindow({
				content: infoContent
			});
			infowindow.open(map, marker);
			if (val.type == '0') {
				addthis.toolbox("#shareSearch" + val.type + '-' + val.id);
			}
		});
		//Add Marker to Markers array.
		searchMarkers.push(marker);
	});
	if (results !== null) {
		$('#searchResult')
			.append('Search results: <ul id="resultList" style ="list-style-type: none; margin: 10px;padding-left: 0; ">' + results + '</ul>');
		map.setCenter(latlngbounds.getCenter());
		if (data.length > 1) {
			zoomListener = google.maps.event.addListener(map, 'zoom_changed', function () {
				if (map.getZoom() > 18) {
					map.setZoom(18);
				}
			});
			map.fitBounds(latlngbounds);
			listener = google.maps.event.addListener(map, "idle", function () {
				//if (map.getZoom() > 17) map.setZoom(17);
				google.maps.event.removeListener(zoomListener);
				google.maps.event.removeListener(listener);
			});
		} else {
			map.setZoom(18);
		}
		if (searchData.length > 5) {
			$('#searchResult')
				.append('<div id ="nextPage"style="float:right; margin-right:20px"><div>');
			$('#searchResult')
				.append('<div id ="prevPage"></div>');
			if (startIndex + 5 < searchData.length) {
				$('#nextPage')
					.append('<a href="javascript:showSearch(' + (pageNumb + 1) + ')">Next &gt;&gt;&gt;</a>');
			}
			if (pageNumb > 1) {
				$('#prevPage')
					.append('<a href="javascript:showSearch(' + (pageNumb - 1) + ')">&lt;&lt;&lt; Previous</a>');
			} else {
				$('#prevPage')
					.append('<a href="javascript:showSearch(1)" style="text-decoration:none"disabled="true">&nbsp;</a>');
			}
		}
	} else {
		$('#searchResult')
			.append('<ul id="resultList" style ="list-style-type: none; margin: 10px;padding-left: 0; "><li>No records to display.</li></ul>');
		map.setCenter(new google.maps.LatLng(36.068000, - 94.172500));
		map.setZoom(18);
	}
}

function clickMarker(id) {
	google.maps.event.trigger(searchMarkers[id], 'click');
}

function onMapSearchHover() {
	$('#searchResult')
		.show();
	$('#buses')
		.hide();
	$('#walking')
		.hide();
	$('#parking')
		.hide();
	$('#sights')
		.hide();
	$('#services')
		.hide();
	$('#busesImg')
		.removeClass("menuSelected");
	$('#walkingImg')
		.removeClass("menuSelected");
	$('#parkingImg')
		.removeClass("menuSelected");
	$('#sightsImg')
		.removeClass("menuSelected");
	$('#servicesImg')
		.removeClass("menuSelected");
	$('#feedback')
		.removeClass("selected");
	$('#feedback')
		.hide();
}

function onBuses() {
	//clearSearch();
	$('#searchResult')
		.hide();
	$('#buses')
		.show();
	$('#walking')
		.hide();
	$('#parking')
		.hide();
	$('#sights')
		.hide();
	$('#services')
		.hide();
	$('#busesImg')
		.addClass("menuSelected");
	$('#walkingImg')
		.removeClass("menuSelected");
	$('#parkingImg')
		.removeClass("menuSelected");
	$('#sightsImg')
		.removeClass("menuSelected");
	$('#servicesImg')
		.removeClass("menuSelected");
	$('#feedback')
		.removeClass("selected");
	$('#feedback')
		.hide();
	if (routes.length == 0) {
		$('#buses')
			.append('<div id="alerts" style="color:red;  margin: 10px; text-align:center"></div>');
		$.ajax({
			url: 'http://campusdata.uark.edu/api/routes',
			data: {},
			dataType: 'jsonp',
			jsonp: 'callback',
			jsonpCallback: 'Routes',
			cache: 'true',
			success: function (data) {
				// $('#buses').append('<div id="routesRight" style="float:left;width:80%">');
				// $('#buses').append('<div id="routesLeft" style="float:right;width:20%">');
				$('#buses')
					.append('<ul id="routesList" style ="list-style-type: none; margin: 10px;padding-left: 0; ">');
				// $('#routesLeft').append('<ul id="routesLinks" style ="list-style-type: none; margin: 10px;padding-left: 0; ">');
				$.each(data, function (key, val) {
					if (val.status == 1) {
						$('#routesList')
							.append('<li style="list-style-type: none; margin-bottom: 4px; width:280px"><div style="text-align:right"><span style="float:left;" ><input type="checkbox" id="chk' + val.id + '" name="chk' + val.id + '"  onClick="onRouteSelected(this,' + val.id + ')"/><label for="chk' + val.id + '"><span class="busIcon" style="background-color:' + val.color + ';margin-right:5px"></span>' + val.name + '</label><span id=ofs' + val.id + ' style="font:0.8em Arial,sans-serif; color:red; padding-left:5px"></span><span id=ta' + val.id + '></span></span><a href="javascript:onClock(' + val.id + ')" title="Current Times" class="hoverLink" ><img alt="Clock" src="http://campusmaps.uark.edu/content/clock.png" /></a><a href="' + val.url + '" title="PDF Schedule" target="_blank" class="hoverLink"><img alt="PDF" src="http://campusmap.uark.edu/content/pdf16.png" /></a><div></li>');
						routes[val.id] = val;
					}
				});
				//   $('#buses').append('</ul>');
				showAlerts();
			},
			error: function (xhr, ajaxOptions, thrownError) {
				//  alert('Unable to get Routes. Status: ' + xhr.status + ' Error: ' + thrownError);
			}
		});
	}
}

function showAlerts() {
	var query = 'http://campusdata.uark.edu/api/transitalerts?callback=?';
	$.getJSON(query, function (data) {
		if (data.length > 0) {
			$('#alerts')
				.append('<a href="javascript:onAlerts()" class="hoverLink" style="color:red;text-decoration:none;" title="Transit Alerts"><img alt="Alert" src="http://campusmap.uark.edu/content/alert.png"/><span style="padding-left:2px">Transit Alerts</span></a>');
			$.each(data, function (key, val) {
				$.each(val.routes, function (key1, val1) {
					$('#ta' + val1.id)
						.empty();
					$('#ta' + val1.id)
						.append('<a href="javascript:onRouteAlert(' + val1.id + ')" Title="Route Alerts" class="hoverLink"><img alt="Alert" src="http://campusmap.uark.edu/content/alert.png"/></a>');
				});
			});
		}
	});
}

function onRouteAlert(routeId) {
	var query = 'http://campusdata.uark.edu/api/transitalerts?callback=?&routeId=' + routeId;
	$.getJSON(query, function (data) {
		if (data.length > 0) {
			$('#currentTimes')
				.dialog('option', 'title', '<span class="busIcon" style="background-color:' + routes[routeId].color + ';margin-right:5px;vertical-align: middle;"></span><span style="vertical-align: middle;">' + routes[routeId].name + ' Alerts</span><a style="margin-left:10px" href="javascript:onRouteAlert(' + routeId + ')" title="Refresh"><img alt="Refresh" src="http://campusmap.uark.edu/content/refresh.png" style="vertical-align: middle;" /></a>');
			$('#currentTimes')
				.empty();
			$('#currentTimes')
				.append('<ul id="newAlerts"></ul>');
			$.each(data, function (key, val) {
				$('#newAlerts')
					.append('<li style="margin:10px">' + val.message + '</li>');
			});
			$("#currentTimes")
				.dialog('open');
		} else {
			$('#currentTimes')
				.empty();
			$('#currentTimes')
				.append('<h4 style="color:red">No New Alerts.</h4>');
			$("#currentTimes")
				.dialog('open');
		}
	});
}

function onAlerts() {
	var query = 'http://campusdata.uark.edu/api/transitalerts?callback=?';
	$.getJSON(query, function (data) {
		if (data.length > 0) {
			$('#currentTimes')
				.dialog('option', 'title', 'Transit Alerts <a style="margin-left:10px" href="javascript:onAlerts()" title="Refresh"><img alt="Refresh" src="http://campusmap.uark.edu/content/refresh.png" style="vertical-align: middle;" /></a>');
			$('#currentTimes')
				.empty();
			$('#currentTimes')
				.append('<ul id="newAlerts"></ul>');
			$.each(data, function (key, val) {
				var talerts = '<li style="margin:10px">';
				$.each(val.routes, function (key1, val1) {
					talerts += '<span class="busIcon" style="background-color:' + routes[val1.id].color + ';margin-right:5px"></span>';
				});
				talerts += val.message + '</li>';
				$('#newAlerts')
					.append(talerts);
			});
			$("#currentTimes")
				.dialog('open');
		} else {
			$('#currentTimes')
				.empty();
			$('#currentTimes')
				.append('<h4 style="color:red">No New Alerts.</h4>');
			$("#currentTimes")
				.dialog('open');
		}
	});
}

function onClock(routeId) {
	var query1 = 'http://campusdata.uark.edu/api/routes?callback=?&routeId=' + routeId;
	var query2 = 'http://campusdata.uark.edu/api/stops?callback=?&routeId=' + routeId;
	$.getJSON(query1, function (data) {
		if (data != null) {
			$('#currentTimes')
				.dialog('option', 'title', data.name + '<a style="margin-left:10px" href="javascript:onClock(' + data.id + ')" title="Refresh"><img alt="Refresh" src="http://campusmap.uark.edu/content/refresh.png" style="vertical-align: middle;" /></a>');
			if (data.status == 1 && data.inService == 1) {
				var nextDeparture = data.nextDeparture;
				$.getJSON(query2, function (data) {
					$('#currentTimes')
						.empty();
					if (data != null && data.length > 0) {
						$('#currentTimes')
							.append('<p style="color:red"><b>Next Departure from ' + data[data.length - 1].name + ' in ' + nextDeparture + '.</b></p><br />');
					}
					$('#currentTimes')
						.append('<p><b>Bus Stop</b><span style="float:right"><b>Next Arrival In:</b></span></p>');
					$('#currentTimes')
						.append('<ul id="stopList" style ="list-style-type: none; margin: 10px;padding-left: 0; ">');
					$.each(data, function (key, val) {
						$('#stopList')
							.append('<li style="list-style-type: none; margin-bottom: 4px"><a class="hoverLink" style="text-decoration: none;" href="javascript:showStopInfowindow(' + val.id + ')">' + val.name + '</a><span style="float:right">' + val.nextArrival + '</span></li>');
					});
					$("#currentTimes")
						.dialog('open');
				});
			} else {
				$('#currentTimes')
					.empty();
				$('#currentTimes')
					.append('<h4 style="color:red">This Route is currently Out of Service.</h4><p>Please check the PDF schedule for more information.<a href="' + data.url + '" title="PDF Schedule" target="_blank"><img alt="PDF" src="http://campusmap.uark.edu/content/pdf16.png" /></a></p>');
				$("#currentTimes")
					.dialog('open');
			}
		}
	});
}

function showStopInfowindow(stopId) {
	var query1 = 'http://campusdata.uark.edu/api/stops?callback=?&stopId=' + stopId;
	$.getJSON(query1, function (data) {
		if (data != null) showRoutesInStop(data.id, data.name, new google.maps.LatLng(data.latitude, data.longitude))
	});
}

function showOfS(routeId) {
	var query = 'http://campusdata.uark.edu/api/routes?callback=?&routeId=' + routeId;
	$.getJSON(query, function (data) {
		if (data.inService !== 1) {
			var ofs = '#ofs' + routeId;
			$(ofs)
				.append('<a href="javascript:onClock(' + routeId + ')" Title="Out Of Service" class="hoverLink"><img alt="Out Of Service" src="http://campusmap.uark.edu/content/oof.png"/></a>');
		}
	});
}

function onRouteSelected(chk, routeId) {
	$.each(stopsCircles, function (key, val) {
		if (val != null) {
			stopsCircles[key].setMap(null);
			stopsCircles[key] = null;
		}
	});
	if (chk.checked == 1) {
		showOfS(routeId);
		//clear tracking
		//  if (interval != null) clearInterval(interval);
		routeIds = '';
		selectedRoutes[routeId] = routeId;
		$.each(selectedRoutes, function (key, val) {
			if (val != null) {
				routeIds = routeIds + '-' + val;
			}
		});
		if (routeIds != '') {
			showStops(routeId);
			showBuses(routeIds);
			//trackBuses();
			//interval = setInterval("trackBuses()", 3000);
		}
		if (!started) {
			$.connection.hub.start(function () {
				// hubBuses.listBuses();
				started = true;
			});
		} else {
			// hubBuses.listBuses();
		}
	} else {
		var ofs = '#ofs' + routeId;
		$(ofs)
			.empty();
		selectedRoutes[routeId] = null;
		//clear tracking
		//if (interval != null) clearInterval(interval);
		$.each(activeBuses, function (key, val) {
			if (val != null) {
				if (val.routeId == routeId) {
					if (buses[val.id] != null) buses[val.id].setMap(null);
					buses[val.id] = null;
					activeBuses[key] = null;
				}
			}
		});
		routeIds = '';
		$.each(selectedRoutes, function (key, val) {
			if (val != null) {
				routeIds = routeIds + '-' + val;
			}
		});
		if (routePolylines[routeId] != null) {
			routePolylines[routeId].setMap(null);
		}
		if (routeIds != '') {
			showStops(null);
			// trackBuses();
			// interval = setInterval("trackBuses()", 3000);
		} else {
			$.connection.hub.stop();
			started = false;
			map.setCenter(new google.maps.LatLng(36.068000, - 94.172500));
			map.setZoom(17);
		}
	}
}

function showBuses(routeIds) {
	var query = 'http://campusdata.uark.edu/api/buses?callback=?&routeIds=' + routeIds;
	$.getJSON(query, function (data) {
		$.each(data, function (key, val) {
			if (selectedRoutes[val.routeId] != null) {
				//Create Latitude/Longitude object from coordinates
				var latlng = new google.maps.LatLng(val.latitude, val.longitude);
				var image = new google.maps.MarkerImage('http://campusdata.uark.edu/api/busimages?color=' + val.color.substring(1) + '&heading=' + val.heading);
				if (buses[val.id] != null) {
					buses[val.id].setPosition(latlng);
					buses[val.id].setIcon(image);
				} else {
					activeBuses.push(val);
					buses[val.id] = new google.maps.Marker({
						icon: image,
						map: map,
						position: new google.maps.LatLng(val.latitude, val.longitude)
					});
					//Add Infowindow to Marker
					google.maps.event.addListener(buses[val.id], 'click', function () {
						var query = 'http://campusdata.uark.edu/api/buses?callback=?&routeIds=' + val.routeId + '&busId=' + val.id;
						$.getJSON(query, function (data) {
							var content = '<div style="font:0.8em Arial,sans-serif; overflow:hidden"><p style="border-bottom-style:solid;border-width:1px;margin-bottom:5px;"><img alt="Bus" style="display: inline-block; vertical-align: middle;" src="http://campusmaps.uark.edu/content/bus32.png" /><b>' + val.name + '</b></p>' + '<ul style="list-style-type: none; margin-top: 5px; margin-bottom: 5px;padding-left: 0px;">' + '<li>' + '<span style="margin: 1px 5px 3px 1px; border: 1px solid rgb(192, 192, 192); width: 15px; height: 10px; background-color: ' + val.color + '; display: inline-block; vertical-align: middle;"></span>' + val.routeName + '</li></ul>';
							if (data != null) {
								content = content + '<p style="color:#5c5c5c">Next Stop:<span style="float: right">Arrival In:</span></p><ul style="list-style-type: none; margin-top: 5px; margin-bottom: 5px;padding-left: 0px;">' + '<li>' + data.nextStop + '<span style="float: right;">' + data.nextArrival + '</span></li></ul>';
							}
							content = content + '</div>';
							if (infowindow) infowindow.close();
							infowindow = new google.maps.InfoWindow({
								content: content
							});
							infowindow.open(map, buses[val.id]);
						});
					});
				}
			}
		});
	});
}

function trackBuses(data) {
	$.each(data, function (key, val) {
		if (selectedRoutes[val.routeId] != null) {
			//Create Latitude/Longitude object from coordinates
			var latlng = new google.maps.LatLng(val.latitude, val.longitude);
			var image = new google.maps.MarkerImage('http://campusdata.uark.edu/api/busimages?color=' + val.color.substring(1) + '&heading=' + val.heading);
			if (buses[val.id] != null) {
				buses[val.id].setPosition(latlng);
				buses[val.id].setIcon(image);
			} else {
				activeBuses.push(val);
				buses[val.id] = new google.maps.Marker({
					icon: image,
					map: map,
					position: new google.maps.LatLng(val.latitude, val.longitude)
				});
				//Add Infowindow to Marker
				google.maps.event.addListener(buses[val.id], 'click', function () {
					var query = 'http://campusdata.uark.edu/api/buses?callback=?&routeIds=' + val.routeId + '&busId=' + val.id;
					$.getJSON(query, function (data) {
						var content = '<div style="font:0.8em Arial,sans-serif; overflow:hidden"><p style="border-bottom-style:solid;border-width:1px;margin-bottom:5px;"><img alt="Bus" style="display: inline-block; vertical-align: middle;" src="http://campusmaps.uark.edu/content/bus32.png" /><b>' + val.name + '</b></p>' + '<ul style="list-style-type: none; margin-top: 5px; margin-bottom: 5px;padding-left: 0px;">' + '<li>' + '<span style="margin: 1px 5px 3px 1px; border: 1px solid rgb(192, 192, 192); width: 15px; height: 10px; background-color: ' + val.color + '; display: inline-block; vertical-align: middle;"></span>' + val.routeName + '</li></ul>';
						if (data != null) {
							content = content + '<p style="color:#5c5c5c">Next Stop:<span style="float: right">Arrival In:</span></p><ul style="list-style-type: none; margin-top: 5px; margin-bottom: 5px;padding-left: 0px;">' + '<li>' + data.nextStop + '<span style="float: right;">' + data.nextArrival + '</span></li></ul>';
						}
						content = content + '</div>';
						if (infowindow) infowindow.close();
						infowindow = new google.maps.InfoWindow({
							content: content
						});
						infowindow.open(map, buses[val.id]);
					});
				});
			}
		}
	});
	$.each(activeBuses, function (key1, val1) {
		var found = false;
		$.each(data, function (key2, val2) {
			if (val1 != null) {
				if (val1.id == val2.id) {
					found = true;
				}
			}
		});
		if (!found) {
			if (buses[val1.id] != null) buses[val1.id].setMap(null);
			buses[val1.id] = null;
			activeBuses[key] = null;
		}
	});
	// });    
}

function showRoute(routeId) {
	if (routePolylines[routeId] != null) {
		routePolylines[routeId].setMap(map);
	} else {
		//Get Color  
		var routeColor = routes[routeId].color;
		//Get shape
		var shape = routes[routeId].shape;
		//Split shape into array of coordinates
		var coordinates = shape.split(",");
		var polyPoints = [];
		var i;
		$.each(coordinates, function (key, val) {
			var LngLat = val.toString()
				.split(" ");
			polyPoints.push(new google.maps.LatLng(LngLat[0], LngLat[1]));
		});
		var polyOptions = {
			path: polyPoints,
			strokeColor: routeColor,
			strokeOpacity: 0.6,
			strokeWeight: 5,
			zIndex: 15
		};
		var polyShape = new google.maps.Polyline(polyOptions);
		polyShape.setMap(map);
		//Add polyShape to Shapes array.
		routePolylines[routeId] = polyShape;
	}
}

function showStops(routeId) {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/stops',
		data: {
			routeIds: routeIds
		},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'Stops' + routeId,
		cache: 'true',
		success: function (data) {
			if (data.length > 0) {
				var latlngbounds = new google.maps.LatLngBounds();
				$.each(data, function (key, val) {
					stops[val.id] = val;
					var icon = new google.maps.MarkerImage("http://campusdata.uark.edu/api/stopimages?stopId=" + val.id + "&routeIds=" + routeIds);
					//Create a marker in the map
					var circle = new google.maps.Marker({
						position: new google.maps.LatLng(val.latitude, val.longitude),
						map: map,
						icon: icon,
						title: val.name,
						visible: false
					});
					var latlng = new google.maps.LatLng(val.latitude, val.longitude);
					latlngbounds.extend(latlng);
					//Add Infowindow to Circle
					google.maps.event.addListener(circle, 'click', function (event) {
						showRoutesInStop(val.id, val.name, event.latLng);
					});
					stopsCircles.push(circle);
				});
				map.setCenter(latlngbounds.getCenter());
				var zoomListener = google.maps.event.addListener(map, 'zoom_changed', function () {
					if (map.getZoom() > 18) {
						map.setZoom(18);
					}
				});
				map.fitBounds(latlngbounds);
				var listener = google.maps.event.addListener(map, "idle", function () {
					//if (map.getZoom() > 17) map.setZoom(17);
					google.maps.event.removeListener(zoomListener);
					google.maps.event.removeListener(listener);
				});
			}
			if (routeId != null) showRoute(routeId);
			if (map.getZoom() > 13) {
				$.each(stopsCircles, function (key, val) {
					if (val != null) {
						stopsCircles[key].setVisible(true);
					}
				});
			}
		},
		error: function (xhr, ajaxOptions, thrownError) {
			//  alert('Unable to get Stops. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function showRoutesInStop(stopId, name, latLng) {
	var query = 'http://campusdata.uark.edu/api/routes?callback=?&stopId=' + stopId;
	var content = '<div style="font:0.8em Arial,sans-serif; overflow:hidden;width: 250px;"><p style="border-bottom-style:solid;border-width:1px;margin-bottom:5px;"><b>' + name + '</b></p>';
	// var arrivalIn = '<p style="color:#5c5c5c;text-align:right">Next Arrival In:</p><ul style="list-style-type: none; margin-top: 5px; margin-bottom: 5px;">';
	var servicedBy = '<p style="color:#5c5c5c">Now Serviced By:<span style="float: right">Next Arrival In:</span></p><ul style="list-style-type: none; margin-top: 5px; margin-bottom: 5px;padding-left: 0px;">';
	var otherRoutes = '<p style="color:#5c5c5c">Other Routes:</p><ul style="list-style-type: none; margin-top: 5px; margin-bottom: 5px;padding-left: 0px;color:#5c5c5c">';
	$.getJSON(query, function (data) {
		$.each(data, function (key, val) {
			if (val.status == 1) {
				if (val.inService == 1) {
					if (val.nextArrival == null) val.nextArrival = '...';
					//   arrivalIn = arrivalIn + '<li style="text-align:right; margin-bottom:1px">' + val.nextArrival + '</li>';
					servicedBy = servicedBy + '<li>' + '<span style="margin: 1px 5px 3px 1px; border: 1px solid rgb(192, 192, 192); width: 15px; height: 10px; background-color: ' + val.color + '; display: inline-block; vertical-align: middle;"></span>' + val.name + '<span style="float: right">' + val.nextArrival + '</span></li>';
				} else {
					otherRoutes = otherRoutes + '<li>' + '<span style="margin: 1px 5px 3px 1px; border: 1px solid rgb(192, 192, 192); width: 15px; height: 10px; background-color: ' + val.color + '; display: inline-block; vertical-align: middle;"></span>' + val.name + '</li>';
				}
			}
		});
		//arrivalIn = arrivalIn + '</ul>';
		servicedBy = servicedBy + '</ul>';
		otherRoutes = otherRoutes + '</ul>';
		content = content + '<div>' + servicedBy + otherRoutes + '</div></div>' //'<div style="float:right">' + arrivalIn + '</div><div style="float:left">' + servicedBy + otherRoutes + '</div></div>';
		if (infowindow) infowindow.close();
		infowindow = new google.maps.InfoWindow({
			content: content
		});
		infowindow.setPosition(latLng);
		infowindow.open(map);
	});
}

function onWalking() {
	//clearSearch();
	$('#searchResult')
		.hide();
	$('#buses')
		.hide();
	$('#walking')
		.show();
	$('#parking')
		.hide();
	$('#sights')
		.hide();
	$('#services')
		.hide();
	$('#busesImg')
		.removeClass("menuSelected");
	$('#walkingImg')
		.addClass("menuSelected");
	$('#parkingImg')
		.removeClass("menuSelected");
	$('#sightsImg')
		.removeClass("menuSelected");
	$('#servicesImg')
		.removeClass("menuSelected");
	$('#feedback')
		.removeClass("selected");
	$('#feedback')
		.hide();
}

function onDirections() {
	clearDirections();
	clearSearch();
	$('#btnDirections')
		.addClass("ui-autocomplete-loading");
	var searchA = $('#fromA')
		.val();
	var searchB = $('#toB')
		.val();
	if ((locationA == null && locationB == null) || ((locationA != null && locationB == null) && (locationA.name != searchA))) {
		$.ajax({
			url: 'http://campusdata.uark.edu/api/places',
			data: {
				search: searchA
			},
			dataType: 'jsonp',
			jsonp: 'callback',
			jsonpCallback: 'SearchA',
			cache: 'true',
			success: function (data) {
				if (data.length > 0) {
					if (data.length > 1) {
						showDirectionsOptions(data, 'A');
						$('#fromA')
							.addClass('input-validation-error');
						$('#fromA')
							.focus();
						$('#btnDirections')
							.removeClass("ui-autocomplete-loading");
					} else {
						$.each(data, function (key, val) {
							locationA = val;
							return false;
						});
						$.ajax({
							url: 'http://campusdata.uark.edu/api/places',
							data: {
								search: searchB
							},
							dataType: 'jsonp',
							jsonp: 'callback',
							jsonpCallback: 'SearchB',
							cache: 'true',
							success: function (data) {
								if (data.length > 0) {
									if (data.length > 1) {
										showDirectionsOptions(data, 'B');
										$('#toB')
											.addClass('input-validation-error');
										$('#toB')
											.focus();
										$('#btnDirections')
											.removeClass("ui-autocomplete-loading");
									} else {
										$.each(data, function (key, val) {
											locationB = val;
											return false;
										});
										getDirections();
										$('#btnDirections')
											.removeClass("ui-autocomplete-loading");
									}
								} else {
									$('#toB')
										.addClass('input-validation-error');
									$('#divB')
										.append('<div id="errorB"><span class="field-validation-error">Location "B" not found.</span></div>');
									$('#btnDirections')
										.removeClass("ui-autocomplete-loading");
									$('#toB')
										.focus();
								}
							},
							error: function (xhr, ajaxOptions, thrownError) {
								map.setCenter(new google.maps.LatLng(36.068000, - 94.172500));
								map.setZoom(17);
								$('#btnDirections')
									.removeClass("ui-autocomplete-loading");
								locationA = null;
								locationB = null;
								//clean prev search		 
								//clearSearch();
								//  $('#lookfor').removeClass("ui-autocomplete-loading");
								//alert('Unable to Search. Status: ' + xhr.status + ' Error: ' + thrownError);
							}
						});
					}
				} else {
					$('#fromA')
						.addClass('input-validation-error');
					$('#fromA')
						.focus();
					$('#divA')
						.append('<div id="errorA"><span class="field-validation-error">Location "A" not found.</span></div>');
					$('#btnDirections')
						.removeClass("ui-autocomplete-loading");
				}
			},
			error: function (xhr, ajaxOptions, thrownError) {
				map.setCenter(new google.maps.LatLng(36.068000, - 94.172500));
				map.setZoom(17);
				$('#btnDirections')
					.removeClass("ui-autocomplete-loading");
				locationA = null;
				locationB = null;
				//clean prev search		 
				//clearSearch();
				//  $('#lookfor').removeClass("ui-autocomplete-loading");
				//alert('Unable to Search. Status: ' + xhr.status + ' Error: ' + thrownError);
			}
		});
	}
	if ((locationA == null && locationB != null) || ((locationA != null && locationB != null) && (locationA.name != searchA))) {
		$.ajax({
			url: 'http://campusdata.uark.edu/api/places',
			data: {
				search: searchA
			},
			dataType: 'jsonp',
			jsonp: 'callback',
			jsonpCallback: 'SearchA',
			cache: 'true',
			success: function (data) {
				if (data.length > 0) {
					if (data.length > 1) {
						showDirectionsOptions(data, 'A');
						$('#fromA')
							.addClass('input-validation-error');
						$('#fromA')
							.focus();
						$('#btnDirections')
							.removeClass("ui-autocomplete-loading");
					} else {
						$.each(data, function (key, val) {
							locationA = val;
							return false;
						});
						getDirections();
					}
				} else {
					$('#fromA')
						.addClass('input-validation-error');
					$('#fromA')
						.focus();
					$('#divA')
						.append('<div id="errorA"><span class="field-validation-error">Location "A" not found.</span></div>');
					$('#btnDirections')
						.removeClass("ui-autocomplete-loading");
				}
			},
			error: function (xhr, ajaxOptions, thrownError) {
				map.setCenter(new google.maps.LatLng(36.068000, - 94.172500));
				map.setZoom(17);
				$('#btnDirections')
					.removeClass("ui-autocomplete-loading");
				locationA = null;
				locationB = null;
				//clean prev search		 
				//clearSearch();
				//  $('#lookfor').removeClass("ui-autocomplete-loading");
				//alert('Unable to Search. Status: ' + xhr.status + ' Error: ' + thrownError);
			}
		});
	}
	if ((locationA != null && locationB == null) || ((locationA != null && locationB != null) && (locationB.name != searchB))) {
		$.ajax({
			url: 'http://campusdata.uark.edu/api/places',
			data: {
				search: searchB
			},
			dataType: 'jsonp',
			jsonp: 'callback',
			jsonpCallback: 'SearchB',
			cache: 'true',
			success: function (data) {
				if (data.length > 0) {
					if (data.length > 1) {
						showDirectionsOptions(data, 'B');
						$('#toB')
							.addClass('input-validation-error');
						$('#toB')
							.focus();
						$('#btnDirections')
							.removeClass("ui-autocomplete-loading");
					} else {
						$.each(data, function (key, val) {
							locationB = val;
							return false;
						});
						getDirections();
					}
				} else {
					$('#toB')
						.addClass('input-validation-error');
					$('#toB')
						.focus();
					$('#divB')
						.append('<div id="errorB"><span class="field-validation-error">Location "B" not found.</span></div>');
					$('#btnDirections')
						.removeClass("ui-autocomplete-loading");
				}
			},
			error: function (xhr, ajaxOptions, thrownError) {
				map.setCenter(new google.maps.LatLng(36.068000, - 94.172500));
				map.setZoom(17);
				$('#btnDirections')
					.removeClass("ui-autocomplete-loading");
				locationA = null;
				locationB = null;
				//clean prev search		 
				//clearSearch();
				//  $('#lookfor').removeClass("ui-autocomplete-loading");
				//alert('Unable to Search. Status: ' + xhr.status + ' Error: ' + thrownError);
			}
		});
	}
	if (locationA != null && locationB != null && locationA.name == searchA && locationB.name == searchB) {
		getDirections();
	}
}

function clickOptionWalk(key, type) {
	if (type == 'A') {
		$('#fromA')
			.val(directionOptions[key].name);
		locationA = directionOptions[key];
	} else {
		$('#toB')
			.val(directionOptions[key].name);
		locationB = directionOptions[key];
	}
	onDirections();
}

function showDirectionsOptions(data, type) {
	var results, markerClass, latlngbounds, icon, shadow, latlngbounds;
	results = "";
	if (type == 'A') locationA = null;
	if (type == 'B') locationB = null;
	directionOptions = data;
	latlngbounds = new google.maps.LatLngBounds();
	$.each(data, function (key, val) {
		markerClass = brownClasses[key];
		if (val.type == '1') {
			if (val.name2 !== 'Office') {
				results = results + '<li style="list-style-type: none; margin-bottom: 4px"><a href="javascript:clickOptionWalk(' + key + ',&quot;' + type + '&quot;)"><span class="' + markerClass + '"></span><span>(' + val.code + ') ' + val.name + ' - ' + val.name2 + '</span></a></li>';
			} else {
				results = results + '<li style="list-style-type: none; margin-bottom: 4px"><a href="javascript:clickOptionWalk(' + key + ',&quot;' + type + '&quot;)"><span class="' + markerClass + '"></span><span>(' + val.code + ') ' + val.name + '</span></a></li>';
			}
		} else {
			results = results + '<li style="list-style-type: none; margin-bottom: 4px"><a href="javascript:clickOptionWalk(' + key + ',&quot;' + type + '&quot;)"><span class="' + markerClass + '"></span><span>(' + val.code + ') ' + val.name + '</span></a></li>';
		}
		var latlng = new google.maps.LatLng(val.latitude, val.longitude);
		//Create Latitude/Longitude object from coordinates
		$.each(walkingMarkers, function (key2, val2) {
			if (val2.getPosition()
				.lat() == latlng.lat() && val2.getPosition()
				.lng() == latlng.lng()) {
				val.longitude = parseFloat(val.longitude) + 0.00020;
				walkingMarkers[key2].setPosition(new google.maps.LatLng(val2.getPosition()
					.lat(), (parseFloat(val2.getPosition()
					.lng()) - 0.00020)));
			}
		});
		latlng = new google.maps.LatLng(val.latitude, val.longitude);
		latlngbounds.extend(latlng);
		//Create custom icon
		// icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/" + brownClasses[key] + ".png", new google.maps.Size(20.0, 34.0), new google.maps.Point(0, 0), new google.maps.Point(10.0, 17.0));
		//  shadow = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/shadow.png", new google.maps.Size(40.0, 34.0), new google.maps.Point(0, 0), new google.maps.Point(10.0, 17.0));
		icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/" + brownClasses[key] + ".png"); //, new google.maps.Size(20.0, 34.0), new google.maps.Point(0, 0), new google.maps.Point(10.0, 17.0));
		// shadow = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/shadow.png", new google.maps.Size(40.0, 34.0), new google.maps.Point(0, 0), new google.maps.Point(10.0, 17.0));
		//Create a marker in the map
		var marker = new google.maps.Marker({
			position: latlng,
			map: map,
			icon: icon,
			//  shadow: shadow,
			title: val.name
		});
		var infoContent = '<p><b>(' + val.code + ') ' + val.name + '</b></p>';
		if (val.type == '1') {
			infoContent += '<p>' + val.name2 + '</p>';
		}
		if (val.room !== '' && val.room !== null) {
			infoContent += '<p>Room: ' + val.room + '</p>';
		}
		if (val.address !== '' && val.address !== null) {
			infoContent += '<p>' + val.address + '</p>';
		}
		if (val.city !== '' && val.city !== null) {
			infoContent += '<p>' + val.city + ', ' + val.state + ' ' + val.zip + '</p>';
		}
		if (val.phone !== '' && val.phone !== null) {
			infoContent += '<p>' + val.phone + '</p>';
		}
		if (val.url !== '' && val.url !== null) {
			infoContent += '<p><a href ="' + val.url + '">' + val.url + '</a></p>';
		}
		//Add Infowindow to Marker
		google.maps.event.addListener(marker, 'click', function () {
			if (infowindow) {
				infowindow.close();
			}
			infowindow = new google.maps.InfoWindow({
				content: infoContent
			});
			infowindow.open(map, marker);
		});
		//Add Marker to Markers array.
		walkingMarkers.push(marker);
		//j++;	
		if (key > 3) return false;
	});
	$('#div' + type)
		.append('<div id="optionsWalk" style="text-align: left; display: block; margin: 2px;padding-left: 30px">Did you mean: <ul id="resultListWalk" style ="list-style-type: none">' + results + '</ul></div>');
	map.setCenter(latlngbounds.getCenter());
	zoomListener = google.maps.event.addListener(map, 'zoom_changed', function () {
		if (map.getZoom() > 18) {
			map.setZoom(18);
		}
	});
	map.fitBounds(latlngbounds);
	listener = google.maps.event.addListener(map, "idle", function () {
		//if (map.getZoom() > 17) map.setZoom(17);
		google.maps.event.removeListener(zoomListener);
		google.maps.event.removeListener(listener);
	});
}

function getDirections() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/directions',
		data: {
			latA: locationA.latitude,
			lonA: locationA.longitude,
			latB: locationB.latitude,
			lonB: locationB.longitude
		},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'Directions',
		cache: 'true',
		success: function (data) {
			$.each(data, function (key, val) {
				directionsPath.push(new google.maps.LatLng(val.latitude, val.longitude));
			});
			if (directionsPath.length > 0) {
				showDirections();
			} else {
				$('#directions')
					.append('<div id="errorD"><span class="field-validation-error">Walking route not available.</span></div>');
			}
			$('#btnDirections')
				.removeClass("ui-autocomplete-loading");
			locationA = null;
			locationB = null;
		},
		error: function (xhr, ajaxOptions, thrownError) {
			map.setCenter(new google.maps.LatLng(36.068000, - 94.172500));
			map.setZoom(17);
			$('#btnDirections')
				.removeClass("ui-autocomplete-loading");
			locationA = null;
			locationB = null;
			//clean prev search		 
			//clearSearch();
			//  $('#lookfor').removeClass("ui-autocomplete-loading");
			//alert('Unable to Search. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function showDirections() {
	var latlngbounds = new google.maps.LatLngBounds();
	//Create Latitude/Longitude object from coordinates
	var latlngA = new google.maps.LatLng(locationA.latitude, locationA.longitude);
	var latlngB = new google.maps.LatLng(locationB.latitude, locationB.longitude);
	latlngbounds.extend(latlngA);
	latlngbounds.extend(latlngB);
	//Create custom icon
	var iconA = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/darkgreen_MarkerA.png");
	var iconB = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/darkgreen_MarkerB.png");
	//Create a marker in the map
	markerA = new google.maps.Marker({
		position: latlngA,
		map: map,
		icon: iconA,
		title: locationA.name
	});
	markerB = new google.maps.Marker({
		position: latlngB,
		map: map,
		icon: iconB,
		title: locationB.name
	});
	var infoContentA = '<p><b>(' + locationA.code + ') ' + locationA.name + '</b></p>';
	var infoContentB = '<p><b>(' + locationB.code + ') ' + locationB.name + '</b></p>';
	if (locationA.type == '1') {
		infoContentA += '<p>' + locationA.name2 + '</p>';
	}
	if (locationA.room != '' && locationA.room != null) {
		infoContentA += '<p>Room: ' + locationA.room + '</p>';
	}
	if (locationA.address != '' && locationA.address != null) {
		infoContentA += '<p>' + locationA.address + '</p>';
	}
	if (locationA.city != '' && locationA.city != null) {
		infoContentA += '<p>' + locationA.city + ', ' + locationA.state + ' ' + locationA.zip + '</p>';
	}
	if (locationA.phone != '' && locationA.phone != null) {
		infoContentA += '<p>' + locationA.phone + '</p>';
	}
	if (locationA.url != '' && locationA.url != null) {
		infoContentA += '<p><a href ="' + locationA.url + '">' + locationA.url + '</a></p>';
	}
	//Add Infowindow to Marker
	google.maps.event.addListener(markerA, 'click', function () {
		if (infowindow) infowindow.close();
		infowindow = new google.maps.InfoWindow({
			content: infoContentA
		});
		infowindow.open(map, markerA);
	});
	if (locationB.type == '1') {
		infoContentB += '<p>' + locationB.name2 + '</p>';
	}
	if (locationB.room != '' && locationB.room != null) {
		infoContentB += '<p>Room: ' + locationB.room + '</p>';
	}
	if (locationB.address != '' && locationB.address != null) {
		infoContentB += '<p>' + locationB.address + '</p>';
	}
	if (locationB.city != '' && locationB.city != null) {
		infoContentB += '<p>' + locationB.city + ', ' + locationB.state + ' ' + locationB.zip + '</p>';
	}
	if (locationB.phone != '' && locationB.phone != null) {
		infoContentB += '<p>' + locationB.phone + '</p>';
	}
	if (locationB.url != '' && locationB.url != null) {
		infoContentB += '<p><a href ="' + locationB.url + '">' + locationB.url + '</a></p>';
	}
	//Add Infowindow to Marker
	google.maps.event.addListener(markerB, 'click', function () {
		if (infowindow) infowindow.close();
		infowindow = new google.maps.InfoWindow({
			content: infoContentB
		});
		infowindow.open(map, markerB);
	});
	map.setCenter(latlngbounds.getCenter());
	var zoomListener = google.maps.event.addListener(map, 'zoom_changed', function () {
		if (map.getZoom() > 18) {
			map.setZoom(18);
		}
	});
	map.fitBounds(latlngbounds);
	var listener = google.maps.event.addListener(map, "idle", function () {
		//if (map.getZoom() > 17) map.setZoom(17);
		google.maps.event.removeListener(zoomListener);
		google.maps.event.removeListener(listener);
	});
	var polyOptions = {
		path: directionsPath,
		strokeColor: "#6495ED",
		strokeOpacity: 0.6,
		strokeWeight: 5,
		zIndex: 2
	};
	directionsShape = new google.maps.Polyline(polyOptions);
	directionsShape.setMap(map);
	var distance = directionsShape.inKm() * 0.62;
	var time = (distance * 60) / 3;
	$('#directions')
		.append('<div id="distanceWalk" style="margin-left: 30px; margin-top: 10px;"><ul><li style="list-style-type: none; margin-bottom: 4px; width:240px"><div style="text-align:right"><span style="float:left;">Route distance:</span>' + distance.toFixed(2) + ' miles</div></li><li style="list-style-type: none; margin-bottom: 4px; width:240px"><div style="text-align:right"><span style="float:left;">Estimated time:</span>' + time.toFixed(1) + ' minutes</div></li></ul></div>');
}

function clearDirections() {
	//Walking directions
	//locationA = null;
	// locationB = null;
	directionsPath = [];
	if (directionsShape != null) {
		directionsShape.setMap(null);
	}
	if (markerA !== null) {
		markerA.setMap(null);
	}
	if (markerB !== null) {
		markerB.setMap(null);
	}
	directionsShape = null;
	markerA = null;
	markerB = null;
	//clear markers
	$.each(walkingMarkers, function (key, val) {
		if (val !== null) {
			walkingMarkers[key].setMap(null);
		}
	});
	walkingMarkers = [];
	$('#fromA')
		.removeClass('input-validation-error');
	$('#toB')
		.removeClass('input-validation-error');
	$('#errorA')
		.remove();
	$('#errorB')
		.remove();
	$('#errorD')
		.remove();
	$('#optionsWalk')
		.remove();
	$('#distanceWalk')
		.remove();
	$('#btnDirections')
		.removeClass("ui-autocomplete-loading");
}

function onParking() {
	//clearSearch();
	$('#searchResult')
		.hide();
	$('#buses')
		.hide();
	$('#walking')
		.hide();
	$('#parking')
		.show();
	$('#sights')
		.hide();
	$('#services')
		.hide();
	$('#busesImg')
		.removeClass("menuSelected");
	$('#walkingImg')
		.removeClass("menuSelected");
	$('#parkingImg')
		.addClass("menuSelected");
	$('#sightsImg')
		.removeClass("menuSelected");
	$('#servicesImg')
		.removeClass("menuSelected");
	$('#feedback')
		.removeClass("selected");
	$('#feedback')
		.hide();
	if ($('#parking')
		.is(':empty')) {
		$('#parking')
			.append('<ul id="parkingList" style ="list-style-type: none; margin: 10px;padding-left: 0; ">');
		$('#parkingList')
			.append('<li style="list-style-type: none; margin-bottom: 4px"><input type="checkbox" id="chkLot" name="chkLot"  onClick="onParkingLotsSelected(this)"/><label for="chkLot"><span class="lotIcon" style="margin-right:5px;vertical-align: middle;""></span>Parking Lots</label><ul id="lotLegend" style="display: none; list-style-type: none; margin: 10px; padding-left: 30px;"></ul></li>');
		$('#parkingList')
			.append('<li style="list-style-type: none; margin-bottom: 4px"><input type="checkbox" id="chkRack" name="chkRack"  onClick="onBicycleSelected(this)"/><label for="chkRack"><span class="rackIcon" style="margin-right:5px;vertical-align: middle;""></span>Bicycle Racks</label></li>');
		$('#parkingList')
			.append('<li style="list-style-type: none; margin-bottom: 4px"><input type="checkbox" id="chkMoto" name="chkMoto"  onClick="onMotocycleSelected(this)"/><label for="chkMoto"><span class="motoIcon" style="margin-right:5px;vertical-align: middle;""></span>Moto/Scooter Parking</label></li>');
	}
}

function onSights() {
	//	clearSearch();
	$('#searchResult')
		.hide();
	$('#buses')
		.hide();
	$('#walking')
		.hide();
	$('#parking')
		.hide();
	$('#sights')
		.show();
	$('#services')
		.hide();
	$('#busesImg')
		.removeClass("menuSelected");
	$('#walkingImg')
		.removeClass("menuSelected");
	$('#parkingImg')
		.removeClass("menuSelected");
	$('#sightsImg')
		.addClass("menuSelected");
	$('#servicesImg')
		.removeClass("menuSelected");
	$('#feedback')
		.removeClass("selected");
	$('#feedback')
		.hide();
	if ($('#sights')
		.is(':empty')) {
		$('#sights')
			.append('<ul id="sightsList" style ="list-style-type: none; margin: 10px;padding-left: 0; ">');
		$('#sightsList')
			.append('<li style="list-style-type: none; margin-bottom: 4px"><input type="checkbox" id="chkHistoric" name="chkHistoric"  onClick="onHistoricMarkersSelected(this)"/><label for="chkHistoric"><span class="historicIcon" style="margin-right:5px;vertical-align: middle;""></span>Historic Markers</label></li>');
		$('#sightsList')
			.append('<li style="list-style-type: none; margin-bottom: 4px"><input type="checkbox" id="chkArt" name="chkArt"  onClick="onPublicArtsSelected(this)"/><label for="chkArt"><span class="artIcon" style="margin-right:5px;vertical-align: middle;""></span>Public Arts</label></li>');
		$('#sightsList')
			.append('<li style="list-style-type: none; margin-bottom: 4px"><input type="checkbox" id="chkDisability" name="chkDisability"  onClick="onDisabilitySelected(this)"/><label for="chkDisability"><span class="disabilityIcon" style="margin-right:5px;vertical-align: middle;""></span>Accessible Points</label></li>');
		$('#sightsList')
			.append('<li style="list-style-type: none; margin-bottom: 4px"><input type="checkbox" id="chkEmergency" name="chkEmergency"  onClick="onEmergencySelected(this)"/><label for="chkEmergency"><span class="telephoneIcon" style="margin-right:5px;vertical-align: middle;""></span>Emergency Boxes</label></li>');
	}
}

function onEmergencySelected(chk) {
	if (chk.checked == 1) {
		showEmergencyBoxes();
	} else {
		//clear markers
		$.each(emergencyBoxes, function (key, val) {
			if (val !== null) {
				emergencyBoxes[key].setMap(null);
			}
		});
	}
}

function showEmergencyBoxes() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/emergencyboxes',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'EmergencyBoxes',
		cache: 'true',
		success: function (data) {
			// var latlngbounds = new google.maps.LatLngBounds();
			$.each(data, function (key, val) {
				if (val.latitude !== null && val.longitude !== null) {
					//Create Latitude/Longitude object from coordinates
					var latlng = new google.maps.LatLng(val.latitude, val.longitude);
					//latlngbounds.extend(latlng);
					//Create custom icon
					var icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/telephone.png");
					//Create a marker in the map
					var marker = new google.maps.Marker({
						position: latlng,
						map: map,
						icon: icon,
						title: val.name
					});
					var infoContent = '';
					if (val.name != '' && val.name != 'null') {
						infoContent += '<p><b>' + val.name + '</b></p>';
					}
					if (infoContent != '') {
						//Add Infowindow to Marker
						google.maps.event.addListener(marker, 'click', function () {
							if (infowindow) {
								infowindow.close();
							}
							infowindow = new google.maps.InfoWindow({
								content: infoContent
							});
							infowindow.open(map, marker);
						});
					}
					//Add Marker to Markers array.
					emergencyBoxes.push(marker);
				}
			});
			//map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			//map.setZoom(17);
			/*  map.fitBounds(latlngbounds);
            var listener = google.maps.event.addListener(map, "idle", function () {
            if (map.getZoom() > 17) map.setZoom(17);
            google.maps.event.removeListener(listener);
            }); */
		},
		error: function (xhr, ajaxOptions, thrownError) {
			// map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			// map.setZoom(17);
			// alert('Unable to get Historic Markers. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function onDisabilitySelected(chk) {
	if (chk.checked == 1) {
		showAccessiblePoints();
	} else {
		//clear markers
		$.each(accessiblePoints, function (key, val) {
			if (val != null) {
				accessiblePoints[key].setMap(null);
			}
		});
	}
}

function showAccessiblePoints() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/accessiblepoints',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'AccessiblePoints',
		cache: 'true',
		success: function (data) {
			// var latlngbounds = new google.maps.LatLngBounds();
			$.each(data, function (key, val) {
				if (val.latitude != null && val.longitude != null) {
					//Create Latitude/Longitude object from coordinates
					var latlng = new google.maps.LatLng(val.latitude, val.longitude);
					//latlngbounds.extend(latlng);
					//Create custom icon
					var icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/disability.png");
					//Create a marker in the map
					var marker = new google.maps.Marker({
						position: latlng,
						map: map,
						icon: icon,
						title: val.name
					});
					//Add Infowindow to Marker
					var infoContent = '';
					if (val.bldgFloor != '' && val.bldgFloor != 'null') {
						infoContent += '<p>Building Floor: ' + val.bldgFloor + '</p>';
					}
					if (val.powerDoor == '1') {
						infoContent += '<p>Power Door</p>';
					}
					if (infoContent != '') {
						google.maps.event.addListener(marker, 'click', function () {
							if (infowindow) infowindow.close();
							infowindow = new google.maps.InfoWindow({
								content: infoContent
							});
							infowindow.open(map, marker);
						});
					}
					//Add Marker to Markers array.
					accessiblePoints.push(marker);
				}
			});
			// map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			// map.setZoom(17);
			/*  map.fitBounds(latlngbounds);
            var listener = google.maps.event.addListener(map, "idle", function () {
            if (map.getZoom() > 17) map.setZoom(17);
            google.maps.event.removeListener(listener);
            }); */
		},
		error: function (xhr, ajaxOptions, thrownError) {
			//  map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			//  map.setZoom(17);
			// alert('Unable to get Historic Markers. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function onServices() {
	//   clearSearch();
	$('#searchResult')
		.hide();
	$('#buses')
		.hide();
	$('#walking')
		.hide();
	$('#parking')
		.hide();
	$('#sights')
		.hide();
	$('#services')
		.show();
	$('#busesImg')
		.removeClass("menuSelected");
	$('#walkingImg')
		.removeClass("menuSelected");
	$('#parkingImg')
		.removeClass("menuSelected");
	$('#sightsImg')
		.removeClass("menuSelected");
	$('#servicesImg')
		.addClass("menuSelected");
	$('#feedback')
		.removeClass("selected");
	$('#feedback')
		.hide();
	if ($('#services')
		.is(':empty')) {
		$('#services')
			.append('<ul id="servicesList" style ="list-style-type: none; margin: 10px;padding-left: 0; ">');
		$('#servicesList')
			.append('<li style="list-style-type: none; margin-bottom: 4px"><input type="checkbox" id="chkDining" name="chkDining"  onClick="onDiningSelected(this)"/><label for="chkDining"><span class="diningIcon" style="margin-right:5px;vertical-align: middle;""></span>Dining</label></li>');
		$('#servicesList')
			.append('<li style="list-style-type: none; margin-bottom: 4px"><input type="checkbox" id="chkComputerLabs" name="chkComputer"  onClick="onComputerLabsSelected(this)"/><label for="chkComputerLabs"><span class="computerLabIcon" style="margin-right:5px;vertical-align: middle;""></span>Computer Labs</label></li>');
	}
}

function onHistoricMarkersSelected(chk) {
	if (chk.checked == 1) {
		showHistoricMarkers();
	} else {
		//clear markers
		$.each(historicMarkers, function (key, val) {
			if (val != null) {
				historicMarkers[key].setMap(null);
			}
		});
	}
}

function showHistoricMarkers() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/historicmarkers',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'HistoricMarkers',
		cache: 'true',
		success: function (data) {
			// var latlngbounds = new google.maps.LatLngBounds();
			$.each(data, function (key, val) {
				if (val.latitude != null && val.longitude != null) {
					//Create Latitude/Longitude object from coordinates
					var latlng = new google.maps.LatLng(val.latitude, val.longitude);
					//latlngbounds.extend(latlng);
					//Create custom icon
					var icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/hist32.png");
					//Create a marker in the map
					var marker = new google.maps.Marker({
						position: latlng,
						map: map,
						icon: icon,
						title: val.name
					});
					//Add Infowindow to Marker
					google.maps.event.addListener(marker, 'click', function () {
						if (infowindow) infowindow.close();
						infowindow = new google.maps.InfoWindow({
							content: '<p><b>' + val.name + '</b></p><p>' + val.description + '</p>'
						});
						infowindow.open(map, marker);
					});
					//Add Marker to Markers array.
					historicMarkers.push(marker);
				}
			});
			// map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			// map.setZoom(17);
			/*  map.fitBounds(latlngbounds);
            var listener = google.maps.event.addListener(map, "idle", function () {
            if (map.getZoom() > 17) map.setZoom(17);
            google.maps.event.removeListener(listener);
            }); */
		},
		error: function (xhr, ajaxOptions, thrownError) {
			//map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			// map.setZoom(17);
			// alert('Unable to get Historic Markers. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function onPublicArtsSelected(chk) {
	if (chk.checked == 1) {
		showPublicArts();
	} else {
		//clear markers
		$.each(publicArts, function (key, val) {
			if (val != null) {
				publicArts[key].setMap(null);
			}
		});
	}
}

function showPublicArts() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/publicarts',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'PublicArts',
		cache: 'true',
		success: function (data) {
			//var latlngbounds = new google.maps.LatLngBounds();
			$.each(data, function (key, val) {
				if (val.latitude != null && val.longitude != null) {
					//Create Latitude/Longitude object from coordinates
					var latlng = new google.maps.LatLng(val.latitude, val.longitude);
					// latlngbounds.extend(latlng);
					//Create custom icon
					var icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/art32.png");
					//Create a marker in the map
					var marker = new google.maps.Marker({
						position: latlng,
						map: map,
						icon: icon,
						title: val.name
					});
					//Add Infowindow to Marker
					google.maps.event.addListener(marker, 'click', function () {
						if (infowindow) infowindow.close();
						infowindow = new google.maps.InfoWindow({
							content: '<p><b>' + val.name + '</b></p><p>' + val.description + '</p>'
						});
						infowindow.open(map, marker);
					});
					//Add Marker to Markers array.
					publicArts.push(marker);
				}
			});
			// map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			//  map.setZoom(17);
			/*
            map.fitBounds(latlngbounds);
            var listener = google.maps.event.addListener(map, "idle", function () {
            if (map.getZoom() > 17) map.setZoom(17);
            google.maps.event.removeListener(listener);
            });
            */
		},
		error: function (xhr, ajaxOptions, thrownError) {
			//  map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			//   map.setZoom(17);
			//  alert('Unable to get Public Arts. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function showParkingLotsLegend() {
	if ($('#lotLegend')
		.is(':empty')) {
		$.ajax({
			url: 'http://campusdata.uark.edu/api/parkingzonetypes',
			data: {},
			dataType: 'jsonp',
			jsonp: 'callback',
			jsonpCallback: 'LotTypes',
			cache: 'true',
			success: function (data) {
				$.each(data, function (key, val) {
					if (val.status == 1) {
						$('#lotLegend')
							.append('<li><span style="margin: 1px; border: 1px solid #C0C0C0; width: 25px; height: 15px; background-color:' + val.color + '; display: inline-block; vertical-align: middle; margin-right:10px"></span>' + val.name + '</li>');
					}
				});
			},
			error: function (xhr, ajaxOptions, thrownError) {
				//  alert('Unable to get Routes. Status: ' + xhr.status + ' Error: ' + thrownError);
			}
		});
	}
	$('#lotLegend')
		.show();
}

function onParkingLotsSelected(chk) {
	if (chk.checked == 1) {
		showParkingLots();
		showParkingZones();
		showParkingLotsLegend();
	} else {
		$('#lotLegend')
			.hide();
		//clear markers
		$.each(parkingLots, function (key, val) {
			if (val != null) {
				parkingLots[key].setMap(null);
			}
		});
		//clear zones
		$.each(parkingZones, function (key, val) {
			if (val != null) {
				parkingZones[key].setMap(null);
			}
		});
	}
}

function showParkingLots() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/parkinglots',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'ParkingLots',
		cache: 'true',
		success: function (data) {
			// var latlngbounds = new google.maps.LatLngBounds();
			$.each(data, function (key, val) {
				if (val.latitude != null && val.longitude != null) {
					//Create Latitude/Longitude object from coordinates
					var latlng = new google.maps.LatLng(val.latitude, val.longitude);
					//latlngbounds.extend(latlng);
					//Create custom icon
					var icon = new google.maps.MarkerImage("http://campusdata.uark.edu/api/parkinglotimages?num=" + val.name);
					//Create a marker in the map
					var marker = new google.maps.Marker({
						position: latlng,
						map: map,
						icon: icon,
						title: val.name
					});
					//Add Infowindow to Marker
					google.maps.event.addListener(marker, 'click', function () {
						if (infowindow) infowindow.close();
						infowindow = new google.maps.InfoWindow({
							content: '<p><b>Lot ' + val.name + '</b></p><p>' + val.description + '</p>'
						});
						infowindow.open(map, marker);
					});
					//Add Marker to Markers array.
					parkingLots.push(marker);
				}
			});
			//  map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			// map.setZoom(17);
			/*  map.fitBounds(latlngbounds);
            var listener = google.maps.event.addListener(map, "idle", function () {
            if (map.getZoom() > 17) map.setZoom(17);
            google.maps.event.removeListener(listener);
            }); */
		},
		error: function (xhr, ajaxOptions, thrownError) {
			//   map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
		}
	});
}

function showParkingZones() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/parkingzones',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'ParkingZones',
		cache: 'true',
		success: function (data) {
			$.each(data, function (key, val) {
				if (val.shape != null && val.color != null && val.color != "" && val.status == 1) {
					//Get shape
					var shape = val.shape;
					//Split shape into array of coordinates
					var coordinates = shape.split(",");
					var polyPoints = [];
					$.each(coordinates, function (key, val) {
						var LngLat = val.toString()
							.split(" ");
						polyPoints.push(new google.maps.LatLng(LngLat[0], LngLat[1]));
					});
					var polyOptions = {
						path: polyPoints,
						strokeColor: val.color,
						strokeOpacity: 0.5,
						strokeWeight: 0.5,
						fillColor: val.color,
						fillOpacity: 1,
						zIndex: 1
					};
					var polyShape = new google.maps.Polygon(polyOptions);
					polyShape.setMap(map);
					parkingZones.push(polyShape);
				}
			});
		},
		error: function (xhr, ajaxOptions, thrownError) {}
	});
}

function onBicycleSelected(chk) {
	if (chk.checked == 1) {
		showBicycleRacks();
	} else {
		//clear markers
		$.each(bicycleRacks, function (key, val) {
			if (val != null) {
				bicycleRacks[key].setMap(null);
			}
		});
	}
}

function showBicycleRacks() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/bicycleracks',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'BicycleRacks',
		cache: 'true',
		success: function (data) {
			// var latlngbounds = new google.maps.LatLngBounds();
			$.each(data, function (key, val) {
				if (val.latitude != null && val.longitude != null) {
					//Create Latitude/Longitude object from coordinates
					var latlng = new google.maps.LatLng(val.latitude, val.longitude);
					//latlngbounds.extend(latlng);
					//Create custom icon
					var icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/rack32.png");
					//Create a marker in the map
					var marker = new google.maps.Marker({
						position: latlng,
						map: map,
						icon: icon,
						title: val.name
					});
					//Add Infowindow to Marker
					/* google.maps.event.addListener(marker, 'click', function () {


                    if (infowindow) infowindow.close();
                    infowindow = new google.maps.InfoWindow({ content: '<p><b>' + val.name + '</b></p><p>' + val.description + '</p>' });
                    infowindow.open(map, marker);

                    }); */
					//Add Marker to Markers array.
					bicycleRacks.push(marker);
				}
			});
			// map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			//  map.setZoom(17);
			/*  map.fitBounds(latlngbounds);
            var listener = google.maps.event.addListener(map, "idle", function () {
            if (map.getZoom() > 17) map.setZoom(17);
            google.maps.event.removeListener(listener);
            }); */
		},
		error: function (xhr, ajaxOptions, thrownError) {
			//   map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			// map.setZoom(17);
			//   alert('Unable to get Bicycle Racks. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function onMotocycleSelected(chk) {
	if (chk.checked == 1) {
		showMotoParking();
	} else {
		//clear markers
		$.each(motoParking, function (key, val) {
			if (val != null) {
				motoParking[key].setMap(null);
			}
		});
	}
}

function showMotoParking() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/motoparking',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'MotoParking',
		cache: 'true',
		success: function (data) {
			// var latlngbounds = new google.maps.LatLngBounds();
			$.each(data, function (key, val) {
				if (val.latitude != null && val.longitude != null) {
					//Create Latitude/Longitude object from coordinates
					var latlng = new google.maps.LatLng(val.latitude, val.longitude);
					//latlngbounds.extend(latlng);
					//Create custom icon
					var icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/moto32.png");
					//Create a marker in the map
					var marker = new google.maps.Marker({
						position: latlng,
						map: map,
						icon: icon,
						title: val.name
					});
					//Add Infowindow to Marker
					/* google.maps.event.addListener(marker, 'click', function () {


                    if (infowindow) infowindow.close();
                    infowindow = new google.maps.InfoWindow({ content: '<p><b>' + val.name + '</b></p><p>' + val.description + '</p>' });
                    infowindow.open(map, marker);

                    }); */
					//Add Marker to Markers array.
					motoParking.push(marker);
				}
			});
			//map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			// map.setZoom(17);
			/*  map.fitBounds(latlngbounds);
            var listener = google.maps.event.addListener(map, "idle", function () {
            if (map.getZoom() > 17) map.setZoom(17);
            google.maps.event.removeListener(listener);
            }); */
		},
		error: function (xhr, ajaxOptions, thrownError) {
			//  map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			//  map.setZoom(17);
			// alert('Unable to get Moto/Scooter Parking. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function onDiningSelected(chk) {
	if (chk.checked == 1) {
		showDinings();
	} else {
		//clear markers
		$.each(dinings, function (key, val) {
			if (val != null) {
				dinings[key].setMap(null);
			}
		});
	}
}

function showDinings() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/dinings',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'Dinings',
		cache: 'true',
		success: function (data) {
			// var latlngbounds = new google.maps.LatLngBounds();
			$.each(data, function (key, val) {
				if (val.latitude != null && val.longitude != null) {
					//Create Latitude/Longitude object from coordinates
					var latlng = new google.maps.LatLng(val.latitude, val.longitude);
					//latlngbounds.extend(latlng);
					//Create custom icon
					var icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/dining32.png");
					//Create a marker in the map
					var marker = new google.maps.Marker({
						position: latlng,
						map: map,
						icon: icon,
						title: val.name
					});
					//Add Infowindow to Marker
					google.maps.event.addListener(marker, 'click', function () {
						if (infowindow) infowindow.close();
						infowindow = new google.maps.InfoWindow({
							content: '<p><b>' + val.name + '</b></p><p>' + val.description + '</p>'
						});
						infowindow.open(map, marker);
					});
					//Add Marker to Markers array.
					dinings.push(marker);
				}
			});
			//map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			// map.setZoom(17);
			/*  map.fitBounds(latlngbounds);
            var listener = google.maps.event.addListener(map, "idle", function () {
            if (map.getZoom() > 17) map.setZoom(17);
            google.maps.event.removeListener(listener);
            }); */
		},
		error: function (xhr, ajaxOptions, thrownError) {
			// map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			//map.setZoom(17);
			//  alert('Unable to get Dinings. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function onComputerLabsSelected(chk) {
	if (chk.checked == 1) {
		showComputerLabs();
	} else {
		//clear markers
		$.each(computerLabs, function (key, val) {
			if (val != null) {
				computerLabs[key].setMap(null);
			}
		});
	}
}

function showComputerLabs() {
	$.ajax({
		url: 'http://campusdata.uark.edu/api/computerlabs',
		data: {},
		dataType: 'jsonp',
		jsonp: 'callback',
		jsonpCallback: 'ComputerLabs',
		cache: 'true',
		success: function (data) {
			// var latlngbounds = new google.maps.LatLngBounds();
			$.each(data, function (key, val) {
				if (val.latitude != null && val.longitude != null) {
					//Create Latitude/Longitude object from coordinates
					var latlng = new google.maps.LatLng(val.latitude, val.longitude);
					//latlngbounds.extend(latlng);
					//Create custom icon
					var icon = new google.maps.MarkerImage("http://campusmaps.uark.edu/content/compu32.png");
					//Create a marker in the map
					var marker = new google.maps.Marker({
						position: latlng,
						map: map,
						icon: icon,
						title: val.name
					});
					//Add Infowindow to Marker
					google.maps.event.addListener(marker, 'click', function () {
						if (infowindow) infowindow.close();
						infowindow = new google.maps.InfoWindow({
							content: '<p><b>' + val.name + '</b></p><p>' + val.description + '</p>'
						});
						infowindow.open(map, marker);
					});
					//Add Marker to Markers array.
					computerLabs.push(marker);
				}
			});
			// map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			//  map.setZoom(17);
			/*  map.fitBounds(latlngbounds);
            var listener = google.maps.event.addListener(map, "idle", function () {
            if (map.getZoom() > 17) map.setZoom(17);
            google.maps.event.removeListener(listener);
            }); */
		},
		error: function (xhr, ajaxOptions, thrownError) {
			//  map.setCenter(new google.maps.LatLng(36.068000, -94.172500));
			//  map.setZoom(17);
			//  alert('Unable to get Computer Labs. Status: ' + xhr.status + ' Error: ' + thrownError);
		}
	});
}

function onToggleMenu() {
	$('#toggleHandle')
		.toggleClass('hiding');
	$('#mainMenu')
		.toggleClass('moveRight');
}

function HomeControl(wrapper, map, home) {
	//var wrapper =document.createElement('DIV')
	wrapper.innerHTML = '<a id="toggleHandle" class="selected" href="javascript:onToggleMenu()"></a><div class="topRibbon"><ul id="GlobalLinks"><li><a title ="Home" href="javascript:onHome()">Home</a></li><li><a title ="Clear All" href="javascript:onClearMap()">Clear All</a></li><li><a title ="Building Directory" href="http://campusmaps.uark.edu/buildings">Building Directory</a></li><li><a title ="PDF Map" href="http://campusmaps.uark.edu/campusmap.pdf" class="GlobalLinksLast" ><img src="http://campusmaps.uark.edu/content/pdf_icon_small.png" alt="PDF"></img></a></li><li><a title ="Construction Map" href="http://campusmaps.uark.edu/constructionmap.pdf" class="GlobalLinksLast" ><img src="http://campusmaps.uark.edu/content/constructionPDF.png" alt="Construction Map"></img></a></li></ul></div>';
	wrapper.style.backgroundColor = '#FFFFFF';
	wrapper.style.boxShadow = '3px 3px 5px 3px #C0C0C0';
	wrapper.style.margin = '20px';
	controlDiv = document.createElement('DIV')
	//controlDiv.id = "main"
	controlDiv.style.padding = '20px';
	//controlDiv.style.backgroundColor = '#FFFFFF';
	controlDiv.style.height = 'auto';
	controlDiv.style.width = '300px';
	//controlDiv.style.margin= '20px';
	controlDiv.style.paddingLeft = '20px';
	controlDiv.style.paddingRight = '20px';
	controlDiv.style.paddingBottom = '20px';
	//controlDiv.innerHTML = '<h3 style="text-align: center;">Map Options</h3>';
	// div.append('<div id="mapSearch" style="text-align: center;"><label for="lookfor"></label><input id="lookfor" placeholder="Search Map" type="search" style="width:240px" name="lookfor" /><button id="btnSearch" type="submit" value="search" onClick="onSearch()"><img alt ="Search" src="http://campusmaps.uark.edu/content/magn16.png" /></button></div>');
	var lookfor = document.createElement('INPUT');
	lookfor.id = 'lookfor';
	lookfor.placeholder = 'Search Map';
	// lookfor.type = 'search';
	lookfor.style.width = '240px';
	lookfor.name = 'lookfor';
	var imgSearch = document.createElement('IMG');
	imgSearch.alt = 'Search';
	imgSearch.src = 'http://campusmaps.uark.edu/content/magn16.png';
	var btnSearch = document.createElement('BUTTON');
	btnSearch.id = 'btnSearch';
	//  btnSearch.type = 'submit';
	btnSearch.value = 'search';
	btnSearch.title = "Search Map"
	btnSearch.appendChild(imgSearch);
	var mapSearch = document.createElement('DIV');
	mapSearch.id = "mapSearch";
	mapSearch.style.textAlign = 'center';
	mapSearch.appendChild(lookfor);
	mapSearch.appendChild(btnSearch);
	controlDiv.appendChild(mapSearch);
	var busesBtn = document.createElement('A');
	busesBtn.id = 'busesBtn';
	busesBtn.title = 'Buses';
	busesBtn.href = 'javascript:onBuses()';
	busesBtn.innerHTML = '<img id="busesImg" alt="Buses" class ="menuButton" src="http://campusmaps.uark.edu/content/bus32.png" />';
	var walkBtn = document.createElement('A');
	walkBtn.id = 'walkBtn';
	walkBtn.title = 'Walking';
	walkBtn.href = 'javascript:onWalking()';
	walkBtn.innerHTML = '<img id="walkingImg" alt="Walking" class ="menuButton" src="http://campusmaps.uark.edu/content/walk32.png" />';
	var parkingBtn = document.createElement('A');
	parkingBtn.id = 'parkingBtn';
	parkingBtn.title = 'Parking';
	parkingBtn.href = 'javascript:onParking()';
	parkingBtn.innerHTML = '<img id="parkingImg" alt="Parking" class ="menuButton" src="http://campusmaps.uark.edu/content/parking32.png" />';
	var sightsBtn = document.createElement('A');
	sightsBtn.id = 'sightsBtn';
	sightsBtn.title = 'Sights';
	sightsBtn.href = 'javascript:onSights()';
	sightsBtn.innerHTML = '<img id="sightsImg" alt="Sights" class ="menuButton" src="http://campusmaps.uark.edu/content/place32.png" />';
	var servicesBtn = document.createElement('A');
	servicesBtn.id = 'servicesBtn';
	servicesBtn.title = 'Services';
	servicesBtn.href = 'javascript:onServices()';
	servicesBtn.innerHTML = '<img id="servicesImg" alt="Services" class ="menuButton" src="http://campusmaps.uark.edu/content/serv32.png" />';
	var mapMenu = document.createElement('DIV');
	mapMenu.id = "mapMenu";
	mapMenu.style.marginTop = '10px';
	mapMenu.style.textAlign = 'center';
	mapMenu.appendChild(busesBtn);
	mapMenu.appendChild(walkBtn);
	mapMenu.appendChild(parkingBtn);
	mapMenu.appendChild(sightsBtn);
	mapMenu.appendChild(servicesBtn);
	controlDiv.appendChild(mapMenu);
	var searchResult = document.createElement('DIV');
	searchResult.id = "searchResult";
	controlDiv.appendChild(searchResult);
	var buses = document.createElement('DIV');
	mapMenu.style.paddingLeft = '10px';
	buses.id = "buses";
	controlDiv.appendChild(buses);
	var walking = document.createElement('DIV');
	walking.id = "walking";
	walking.style.display = "none";
	var directions = document.createElement('DIV');
	directions.id = "directions";
	directions.style.textAlign = 'center';
	directions.style.marginTop = '10px';
	var divA = document.createElement('DIV');
	divA.id = "divA";
	divA.innerHTML = '<label for="fromA"><span class="darkGreen_MarkerA" style="vertical-align: middle; margin-right:5px"></span></label>';
	var fromA = document.createElement('INPUT');
	fromA.id = 'fromA';
	fromA.style.width = '230px';
	fromA.name = 'fromA';
	fromA.placeholder = 'From';
	divA.appendChild(fromA);
	directions.appendChild(divA);
	var divB = document.createElement('DIV');
	divB.id = "divB";
	divB.innerHTML = '<label for="toB"><span class="darkGreen_MarkerB" style="vertical-align: middle; margin-right:5px"></span></label>';
	var toB = document.createElement('INPUT');
	toB.id = 'toB';
	// lookfor.placeholder = '';
	// lookfor.type = 'search';
	toB.style.width = '230px';
	toB.name = 'toB';
	toB.placeholder = 'To';
	divB.appendChild(toB);
	directions.appendChild(divB);
	var btnDirections = document.createElement('BUTTON');
	btnDirections.id = "btnDirections";
	btnDirections.innerHTML = "Get Directions";
	directions.appendChild(btnDirections);
	walking.appendChild(directions);
	controlDiv.appendChild(walking);
	var parking = document.createElement('DIV');
	parking.id = "parking";
	// parking.innerHTML = '<ul id="parkingList" style ="list-style-type: none; margin: 10px;padding-left: 0; "></ul>';
	controlDiv.appendChild(parking);
	var sights = document.createElement('DIV');
	sights.id = "sights";
	controlDiv.appendChild(sights);
	var services = document.createElement('DIV');
	services.id = "services";
	controlDiv.appendChild(services);
	var feedback = document.createElement('DIV');
	feedback.id = "feedback";
	//feedback.style.borderColor='#E0E0E0';
	//feedback.style.borderStyle='solid';
	//feedback.style.borderWidth='1px';
	feedback.style.margin = '0px 20px 20px 20px';
	feedback.style.display = 'none';
	feedback.style.boxShadow = '1px 1px 3px 1px #C0C0C0';
	feedback.innerHTML = '<div style="float:right"><a id="closeBtn" title="Close" href="javascript:onFeedback()"><img class="closeButton" src="http://campusmaps.uark.edu/content/close.png" alt="Close"></a></div><div style="margin:5px"><fieldset style="margin: 0px; padding: 0px 0px 5px 5px"><legend>Give us feedback</legend><label for="email" >Email</label><br /><input type="text" name="email" id="feedEmail" value="" style="width: 250px;" placeholder="Your email"><br /><label for="comments" >Comments</label><br /><textarea name="comments" id="feedComments" placeholder="Please provide as much detail as possible." style="width: 250px; height: 150px; resize: none"></textarea></fieldset></div>';
	var btnSubmit = document.createElement('BUTTON');
	btnSubmit.id = "btnSubmit";
	btnSubmit.innerHTML = "Submit";
	var divSub = document.createElement('DIV');
	divSub.style.textAlign = 'center';
	divSub.style.padding = '5px';
	divSub.appendChild(btnSubmit);
	feedback.appendChild(divSub);
	var footer = document.createElement('FOOTER');
	footer.id = "optionsFooter";
	footer.style.padding = '5px';
	footer.style.textAlign = 'center';
	//footer.style.verticalAlign = 'center';
	footer.innerHTML = '<ul style="padding: 0">' + '<li style="margin-bottom: 0;"><a href="javascript:onFeedback()" title="Give Us FeedBack">Give us feedback</a></li>' + '</ul>';
	wrapper.appendChild(controlDiv);
	wrapper.appendChild(feedback);
	wrapper.appendChild(footer);
	google.maps.event.addDomListener(btnSearch, 'click', function () {
		onSearch();
	});
	google.maps.event.addDomListener(btnDirections, 'click', function () {
		onDirections();
	});
	google.maps.event.addDomListener(btnSubmit, 'click', function () {
		onFeedbackSubmit();
	});
	google.maps.event.addDomListener(lookfor, 'keypress', function (e) {
		if (e.keyCode == 13) {
			onSearch();
		}
	});
	google.maps.event.addDomListener(fromA, 'keypress', function (e) {
		if (e.keyCode == 13) {
			onDirections();
		}
	});
	google.maps.event.addDomListener(toB, 'keypress', function (e) {
		if (e.keyCode == 13) {
			onDirections();
		}
	});
	var listenerAutoComplete = google.maps.event.addDomListener(lookfor, 'focus', function (e) {
		$("#lookfor")
			.autocomplete({
			source: function (request, response) {
				$.ajax({
					url: "http://campusdata.uark.edu/api/places",
					dataType: "jsonp",
					jsonp: 'callback',
					jsonpCallback: 'AutoComplete' + request.term.toString()
						.length,
					cache: 'true',
					data: {
						startsWith: request.term
					},
					success: function (data) {
						//create array for response objects  
						var suggestions = [];
						//process response  
						$.each(data, function (i, val) {
							suggestions.push(val.name);
						});
						//pass array to callback  
						// add(suggestions);  
						response(suggestions);
					}
				});
			},
			minLength: 2
		});
		google.maps.event.removeListener(listenerAutoComplete);
	});
	var listenerAutoCompleteA = google.maps.event.addDomListener(fromA, 'focus', function (e) {
		$("#fromA")
			.autocomplete({
			// source: function() { return "GetState.php?country=" + $('#Country').val();},
			source: function (request, response) {
				$.ajax({
					url: "http://campusdata.uark.edu/api/places",
					dataType: "jsonp",
					jsonp: 'callback',
					jsonpCallback: 'AutoComplete' + request.term.toString()
						.length,
					cache: 'true',
					data: {
						startsWith: request.term
					},
					success: function (data) {
						//create array for response objects  
						var suggestions = [];
						//process response  
						$.each(data, function (i, val) {
							suggestions.push(val.name);
						});
						//pass array to callback  
						// add(suggestions);  
						response(suggestions);
					}
				});
			},
			minLength: 2
		});
		google.maps.event.removeListener(listenerAutoCompleteA);
	});
	var listenerAutoCompleteB = google.maps.event.addDomListener(toB, 'focus', function (e) {
		$("#toB")
			.autocomplete({
			// source: function() { return "GetState.php?country=" + $('#Country').val();},
			source: function (request, response) {
				$.ajax({
					url: "http://campusdata.uark.edu/api/places",
					dataType: "jsonp",
					jsonp: 'callback',
					jsonpCallback: 'AutoComplete' + request.term.toString()
						.length,
					cache: 'true',
					data: {
						startsWith: request.term
					},
					success: function (data) {
						//create array for response objects  
						var suggestions = [];
						//process response  
						$.each(data, function (i, val) {
							suggestions.push(val.name);
						});
						//pass array to callback  
						// add(suggestions);  
						response(suggestions);
					}
				});
			},
			minLength: 2
		});
		google.maps.event.removeListener(listenerAutoCompleteB);
	});
}

function onFeedbackSubmit() {
	var email = $('#feedEmail')
		.val();
	var comments = $('#feedComments')
		.val();
	var key = '0F0CD8E7-FD8F-44BD-8C1F-3DE9868B04CD';
	$.ajax({
		type: 'POST',
		url: "http://campusmaps.uark.edu/home/feedback",
		dataType: "json",
		data: {
			email: email,
			content: comments,
			key: key
		},
		success: function (data) {}
	});
	$('#feedback')
		.removeClass("selected");
	$('#feedback')
		.hide();
	$('#feedEmail')
		.val('');
	$('#feedComments')
		.val('');
}

function onHome() {
	map.setCenter(new google.maps.LatLng(36.068000, - 94.172500));
	map.setZoom(17);
}

function onClearMap() {
	clearDirections();
	locationA = null;
	locationB = null;
	$('#fromA')
		.val('');
	$('#toB')
		.val('');
	map.setCenter(new google.maps.LatLng(36.068000, - 94.172500));
	map.setZoom(17);
	clearSearch();
	$('#lookfor')
		.val('');
	$('#searchResult')
		.empty();
	$('#buses')
		.empty();
	$('#walking')
		.hide();
	$('#parking')
		.empty();
	$('#sights')
		.empty();
	$('#services')
		.empty();
	$('#busesImg')
		.removeClass("menuSelected");
	$('#walkingImg')
		.removeClass("menuSelected");
	$('#parkingImg')
		.removeClass("menuSelected");
	$('#sightsImg')
		.removeClass("menuSelected");
	$('#servicesImg')
		.removeClass("menuSelected");
	$('#feedback')
		.removeClass("selected");
	$('#feedback')
		.hide();
	//clear markers
	$.each(markers, function (key, val) {
		if (val != null) {
			markers[key].setMap(null);
		}
	});
	markers = [];
	//clear markers
	$.each(accessiblePoints, function (key, val) {
		if (val != null) {
			accessiblePoints[key].setMap(null);
		}
	});
	accessiblePoints = [];
	//clear markers
	$.each(emergencyBoxes, function (key, val) {
		if (val != null) {
			emergencyBoxes[key].setMap(null);
		}
	});
	emergencyBoxes = [];
	//clear markers
	$.each(bicycleRacks, function (key, val) {
		if (val != null) {
			bicycleRacks[key].setMap(null);
		}
	});
	bicycleRacks = [];
	//clear markers
	$.each(dinings, function (key, val) {
		if (val != null) {
			dinings[key].setMap(null);
		}
	});
	dinings = [];
	//clear markers
	$.each(computerLabs, function (key, val) {
		if (val != null) {
			computerLabs[key].setMap(null);
		}
	});
	computerLabs = [];
	//clear markers
	$.each(motoParking, function (key, val) {
		if (val != null) {
			motoParking[key].setMap(null);
		}
	});
	motoParking = [];
	//clear markers
	$.each(parkingLots, function (key, val) {
		if (val != null) {
			parkingLots[key].setMap(null);
		}
	});
	//clear parking zones
	$.each(parkingZones, function (key, val) {
		if (val != null) {
			parkingZones[key].setMap(null);
		}
	});
	parkingLots = [];
	//clear markers
	$.each(publicArts, function (key, val) {
		if (val != null) {
			publicArts[key].setMap(null);
		}
	});
	publicArts = [];
	//clear markers
	$.each(historicMarkers, function (key, val) {
		if (val != null) {
			historicMarkers[key].setMap(null);
		}
	});
	historicMarkers = [];
	$.each(stopsCircles, function (key, val) {
		if (val != null) {
			stopsCircles[key].setMap(null);
		}
	});
	stopsCircles = [];
	selectedRoutes = [];
	$.each(routePolylines, function (key, val) {
		if (val != null) {
			routePolylines[key].setMap(null);
		}
	});
	routePolylines = [];
	routes = [];
	//clear tracking
	//if (interval != null) clearInterval(interval);
	$.connection.hub.stop();
	started = false;
	$.each(buses, function (key, val) {
		if (val != null) {
			buses[key].setMap(null);
			buses[key] = null;
		}
	});
	buses = [];
	activeBuses = [];
}
//zIndex
// 1 : parkingzones
// 2 : directions
// 5 : buildings
// 10 : special areas
// 15 : routes
// 20 : stops
// 25 : labels