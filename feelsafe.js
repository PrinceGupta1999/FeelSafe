  // Initialize Firebase
var config = {
  ........
  // Firebase Initializations
};
firebase.initializeApp(config);
function getLocation() {
  //Initializations
  var map = null;
  var watchPosition = null;
  var img_url = null;
  var name = null;
  var icon = "";
  var dist = null;
  var toggle = true;
  var alert_warning = function(message) {
          $('#alert_placeholder').html('<div class="alert alert-danger"><a class="close" data-dismiss="alert">&times;</a><span>'+message+'</span></div>')
  }
  var myLocButton = document.getElementById('loc_button');
  var url = new URL(window.location.href);
  var params = new URLSearchParams(url.search);
  var userId = params.get('uid');
  var userPos = null;
  var userMarker = null;
  var myPos = null;
  var myMarker = null;
  var userInfoWindow = null;
  var url = "avatar.jpg";
  // Get Location of userId
  var firebaseRef = firebase.database().ref('FeelSafe/userLoction');
  var geoFire = new GeoFire(firebaseRef);
  var geoQuery = geoFire.query({
  center: [28.7041, 77.1025], radius: 1500
  });
  var onKeyEnteredRegistration = geoQuery.on("key_entered", function(key, location, distance) {
    if(key == userId) {
      console.log(key + " entered query at " + location + " (" + distance + " km from center)");
      var personalDetailRef = firebase.database().ref('FeelSafe/Users/' + userId)
      personalDetailRef.on('value', function(snapshot) {
        img_url = snapshot.val().imgurl;
        name = snapshot.val().name;
        var panic = true;
        //var panic = snapshot.val().panic;
        if(!Boolean(panic)){
          geoQuery.cancel();
          if(watchPosition){
            navigator.geolocation.clearWatch(watchPosition);
          }
          alert_warning("The user is not in Panic State. Locations will not update");
          return 0;
        }
        $.get(img_url)
          .done(function() {
            url = img_url;
            makeMap(location[0], location[1]);
            getMyLocation();
          })

          .fail(function() {
          	$.get(url)
          	  .done(function() {
		        makeMap(location[0], location[1]);
		        getMyLocation();
		      })
		  })
      });
    }
  });
  var onKeyMovedRegistration = geoQuery.on("key_moved", function(key, location, distance) {
    if(key == userId) {
        console.log(key + " moved within query to " + location + " (" + distance + " km from center)");
        updateUserMarker(location[0], location[1]);
    }
  });
  // Get My Location
  function getMyLocation(){
    if(navigator.geolocation){
      watchPosition = navigator.geolocation.watchPosition(placeMyMarker, showError, {enableHighAccuracy : true});
    }
    else{
      alert_warning("Geolocation Not Supported");
    }
  }
  function showError(error){
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert_warning("User denied the request for Geolocation. If you are on Android enable location manually first and try again.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert_warning("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert_warning("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert_warning("An unknown error occurred.");
            break;
    }
  }
  function updateUserMarker(lat, lng) {
    
    userPos = new google.maps.LatLng(lat, lng);
    userMarker.setPosition(userPos);
    dist = GeoFire.distance([myMarker.position.lat(), myMarker.position.lng()], [userMarker.position.lat(), userMarker.position.lng()]);
    if(dist <= 0.001) {
      dist = 0;
      userInfoWindow.setContent("Name: " + name + "<br>Distance: " + dist + " m");
    }
    else if (dist <= 1){
      dist = Number(dist.toFixed(3)) * 1000;
      userInfoWindow.setContent("Name: " + name + "<br>Distance: " + dist + " m");
    }
    else {
      dist = dist.toFixed(1);
      userInfoWindow.setContent("Name: " + name + "<br>Distance: " + dist + " km");
    }
  }
  function placeMyMarker(pos) {
    myPos = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
    if(myMarker == null) { 
      myMarker = new google.maps.Marker({position:myPos, map:map, icon:'loc-icon.png'});
      myLocButton.style.display = "initial";
      $('#loc_button').popover({content:"Click this button to toggle between your and user's location", placement:"left"});
      $('#loc_button').popover("show");
      setTimeout(function() {
        $('#loc_button').popover('dispose');	
        }, 4000);
      var myInfoWindow = new google.maps.InfoWindow({content:"You are Here!"});
      myMarker.addListener('click', function() {
	    myInfoWindow.open(map, myMarker);
	  });
      myLocButton.addEventListener('click', function() {
      	if(toggle) {
      	  map.setCenter(myMarker.getPosition());
      	  toggle = false;	
      	  myInfoWindow.open(map, myMarker);	
      	}
      	else {
      	  map.setCenter(userMarker.getPosition());
      	  toggle = true;
      	  userInfoWindow.open(map, userMarker);	
      	}	
      });
    }
    else {
      myMarker.setMap(null);
      myMarker = new google.maps.Marker({position:myPos, map:map, icon:'loc-icon.png'});
    }
    map.setCenter(userMarker.getPosition());
    dist = GeoFire.distance([myMarker.position.lat(), myMarker.position.lng()], [userMarker.position.lat(), userMarker.position.lng()]);
    dist = GeoFire.distance([myMarker.position.lat(), myMarker.position.lng()], [userMarker.position.lat(), userMarker.position.lng()]);
    if(dist <= 0.001) {
      dist = 0;
      userInfoWindow.setContent("Name: " + name + "<br>Distance: " + dist + " m");
    }
    else if (dist <= 1) {
      dist = Number(dist.toFixed(3)) * 1000;
      userInfoWindow.setContent("<div><img src=" + url + " style='float:left;width:60px;height:60px;'> Name: " + name + "<br>Distance: " + dist + " m");
    }
    else {
      dist = dist.toFixed(1);
      userInfoWindow.setContent("<div><img src=" + url + " style='float:left;width:60px;height:60px;'> Name: " + name + "<br>Distance: " + dist + " km");
    }
  }

// Show Location on Map
  function makeMap(lat, lng){
    userPos = new google.maps.LatLng(lat, lng);
    var myCanvas = document.getElementById("myMap");
    var myOptions = {
    center: userPos,
    zoom: 17,
    panControl: true,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: false,
    overviewMapControl: true,
    rotateControl: true ,
    mapTypeId:google.maps.MapTypeId.HYBRID
    };
    map = new google.maps.Map(myCanvas,myOptions);
    userMarker = new google.maps.Marker({position:userPos, map:map, icon:icon});
    userInfoWindow = new google.maps.InfoWindow({content:"<div><img src=" + url + " style='float:left;width:60px;height:60px;'> Name: " + name});
    userInfoWindow.open(map, userMarker);
    userMarker.addListener('click', function() {
    userInfoWindow.open(map, userMarker);
    });
  }
}
