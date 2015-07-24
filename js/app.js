'use strict';

// Initial markers
var initialMarkers = [
  {
    name : 'Palace of culture and science',
    lat: 52.231,
    long: 21.006
  },
  {
    name : 'Copernicus Center in Warsaw',
    lat: 52.241,
    long: 21.028
  },
  {
    name : 'National Museum in Warsaw',
    lat: 52.231,
    long: 21.024
  },  
  {
    name : 'Warsaw',
    lat: 52.229,
    long: 21.011
  },  
];

// Google Map definition.
var center = new google.maps.LatLng(52.231, 21.006);

// Create google map and disable movement
var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 14,
    center: center,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true,
    draggable: false,
    scrollwheel: false,
    disableDoubleClickZoom: true,
    zoomControl: false
});

// Make map center on resize.
google.maps.event.addDomListener(window, 'resize', function() {
    map.setCenter(center);
});

// Marker view
var Marker = function(data) {
    this.name = data.name;
    this.lat = ko.observable(data.lat);
    this.long = ko.observable(data.long);
    this.selected = ko.observable(false);
    this.visible = ko.observable(true);

    // Initialized google marker with map.
    this.googleMarker = new google.maps.Marker({
      position: new google.maps.LatLng(data.lat, data.long),
      title: data.name,
      map: map
    });

    // In order to make marker clickable and with consistent behaviour set this instance as 'marker' property so we can retrive it inside event.
    this.googleMarker.set('marker', this);
    google.maps.event.addListener(this.googleMarker, 'click', function(event) {
      viewModel.toggleBounce(this.get('marker'));
    });

    // Set bouncing
    this.setBounce = function() {
      this.googleMarker.setAnimation(google.maps.Animation.BOUNCE);
      this.selected(true);
    };

    // Remove bouncing
    this.removeBounce = function() {
      this.googleMarker.setAnimation(null);
      this.selected(false);
    };

    // Set visibility for searching
    this.setVisible = function(isVisible) {
      this.googleMarker.setVisible(isVisible);
      this.visible(isVisible);

      // Add back bouncing for selected elements when set again visible.
      if(isVisible && this.selected()){
        this.googleMarker.setAnimation(google.maps.Animation.BOUNCE);
      }
    };
};

// Info view
var Info = function() {
    this.visible = ko.observable(false);
    this.message = ko.observable('');
    this.title = ko.observable('');
    this.articles = ko.observableArray([]);

    // Initialize view for specific name
    this.init = function(name) {
      var self = this;
      self.title(name);
      self.articles([]);
      self.message('');

      // load data from Wikipedia based on name
      // Wikipedia JSONP
      var wikiRequestTimeout = setTimeout(function(){
          // If failed disply message
          self.message('Failed to get wikipedia resources');
      }, 8000);

      // Get data from wiki and place it in observable articles array
      $.ajax({
          url: 'https://en.wikipedia.org/w/api.php?action=opensearch&search='+name+'&format=json&callback=wikiCallback',
          dataType: 'jsonp',

          success: function( response ){
              var items = response[1];
              var url;

              if(items.length === 0){
                self.message('No articles found');
              }

              $.each(items, function( i ){
                  url = response[3][i];
                  self.articles.push({url : url, title: items[i]});
              });

              clearTimeout(wikiRequestTimeout);
          }
      });
    };

    // Control visibility
    this.setVisible = function(isVisible) {
      this.visible(isVisible);
    };
};

// View model
var ViewModel = function() {
    var self = this;
    this.markers = ko.observableArray([]);
    this.query = ko.observable('');
    this.infoPanel = ko.observable(new Info());

    initialMarkers.forEach(function(marker){
      self.markers.push(new Marker(marker));
    });

    this.toggleBounce = function(clickedMarker){
      self.markers().forEach(function(marker){
        marker.removeBounce();
      });

      clickedMarker.setBounce();
    };

    this.search = function(value) {
      self.markers().forEach(function(marker){
        if(marker.name.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
          marker.setVisible(true);
        } else {
          marker.setVisible(false);
        }
      });      
    };

    this.closeInfo = function(clickedInfo){
      clickedInfo.setVisible(false);
    };

    this.showInfo = function(clickedMarker){
      self.infoPanel().init(clickedMarker.name);
      self.infoPanel().setVisible(true);
    };
};

var viewModel = new ViewModel();
viewModel.query.subscribe(viewModel.search);
ko.applyBindings(viewModel);




