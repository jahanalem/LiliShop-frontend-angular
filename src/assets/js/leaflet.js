// ------------------------------------------------------ //
// styled Leaflet  Map
// ------------------------------------------------------ //
var mymap = L.map('map').setView([53.14, 8.22], 13);
L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    zoom: 13,
    ext: 'png',
    iconUrl: 'img/marker.png'
}).addTo(mymap);

var customIcon = L.icon({
    iconUrl: 'img/marker.png',
    iconSize:     [25, 40]
});

mymap.scrollWheelZoom.disable();

var marker = L.marker([53.14, 8.22], {icon: customIcon}).addTo(mymap);

marker.bindPopup("<div class='p-4'><h5>Info Window Content</h5><p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.</p></div>", {
    minwidth: 200,
    maxWidth: 600,
    className: 'map-custom-popup'
});

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
}

mymap.on('click', onMapClick);
