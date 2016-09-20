var map;

// fullzoom area 
var southWest = L.latLng(42.3, -5),
        northEast = L.latLng(51.10, 8.57),
        bounds = L.latLngBounds(southWest, northEast);


var decide = L.geoJson(null, {
    pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
            icon: L.icon({
                iconUrl: "img/here.png",
                iconSize: [32, 32],
                iconAnchor: [12, 28],
                popupAnchor: [0, -25]
            }),
            title: feature.properties.NAME,
            riseOnHover: true
        });
    },
    onEachFeature: function (feature, layer) {
        if (feature.properties) {
            var content =   "<table class='table table-striped table-bordered table-condensed'>"+
                                "<tr><th>Nom</th><td>" + feature.properties.NAME + "</td></tr>"+
                                "<tr><th>Téléphone</th><td>" + feature.properties.TEL + "</td></tr>"+
                                "<tr><th>Addresse</th><td>" + feature.properties.ADDRESS1 + "</td></tr>"+
                                "<tr><th>Site internet</th><td><a class='url-break' href='" + feature.properties.URL + "' target='_blank'>" + feature.properties.URL + "</a></td></tr>"+
                            "<table>";

            if (document.body.clientWidth <= 767) {
                layer.on({
                    click: function(e) {
                        $("#feature-title").html(feature.properties.NAME);
                        $("#feature-info").html(content);
                        $("#featureModal").modal("show");
                    }
                });

            } else {
                layer.bindPopup(content, {
                    maxWidth: "auto",
                    closeButton: false
                });
            };
        }
    }
});
$.getJSON("data/decide.geojson", function (data) {
    decide.addData(data);
});


// Larger screens get expanded layer control
if (document.body.clientWidth <= 767) {
    var isCollapsed = true;
} else {
    var isCollapsed = false;
}
;

var basemap = L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

//var cloudmadeUrl = 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';
//var basemap = L.tileLayer(cloudmadeUrl, {attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors', maxZoom: 18});



map = L.map("map", {
    zoom: 6,
    center: bounds.getCenter(),
    layers: [basemap,decide]
});

//Create a custom group of layers
var baseLayers = {
    "Fond de carte": basemap
};

//Add some layers delivered with geoserver
var unites_urbaines = L.tileLayer.wms("http://geoserver.orbisgis.org/geoserver/mapuce/wms", {
    layers: 'mapuce:unites_urbaines',
    format: 'image/png',
    transparent: true,
    styles: 'unites_urbaines',
    version: '1.3.0',
    attribution: "Unités Urbaines selon l'INSEE'."
});
map.addLayer(unites_urbaines);


var usr_dash = L.tileLayer.wms("http://geoserver.orbisgis.org/geoserver/mapuce/wms", {
    layers: 'mapuce:usr_lienss',
    format: 'image/png',
    transparent: true,
    styles: 'usr_dashstroke',
    version: '1.3.0'
});

map.addLayer(usr_dash);

var blocks_h_mean = L.tileLayer.wms("http://geoserver.orbisgis.org/geoserver/mapuce/wms", {
    layers: 'mapuce:block_indicators_metropole',
    format: 'image/png',
    transparent: true,
    version: '1.3.0'
});

map.addLayer(blocks_h_mean);

// Groupes de couches
var groupedLayers = {
    "Zones d'étude": {
        "Unités urbaines": unites_urbaines
    },
    "Unités spatiales": {
        "Ilôts urbains": usr_dash,
	"Blocs de bâtiments": blocks_h_mean
    }
};


//Load the group layers plugin
var layerControl = L.control.groupedLayers(baseLayers, groupedLayers);
map.addControl(layerControl);


var sidebar = L.control.sidebar("sidebar", {
    closeButton: true,
    position: "left"
}).addTo(map);


//Create a legend for urban areas
legend1 = function() {
    var div = L.DomUtil.create('div', 'info legend'), labels = ["<h6>Unités urbaines</h6>"];
    div.innerHTML = labels.join('');
    div.innerHTML += '<img src="http://geoserver.orbisgis.org/geoserver/mapuce/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=mapuce:unites_urbaines&STYLE=mapuce:unites_urbaines" alt="legend" width="20" height="20">';
    return div;
};

//Create a legend for urban islets
legend2 = function() {
    var div = L.DomUtil.create('div', 'info legend'), labels = ["<h6>Ilôts urbains</h6>"];
    ;
    div.innerHTML = labels.join('');
    div.innerHTML += '<img src="http://geoserver.orbisgis.org/geoserver/mapuce/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=mapuce:usr_lienss&STYLE=mapuce:usr_dashstroke" alt="legend" width="20" height="20">';
    return div;
};



//Add the legends to the legend frame
$("#legendBar").html(legend1);
$("#legendBar").append(legend2);


// Highlight search box text on click
$("#searchbox").click(function() {
    $(this).select();
});

/* Prevent hitting enter from refreshing the page */
$("#searchbox").keypress(function (e) {
  if (e.which == 13) {
    e.preventDefault();
  }
});

addressResult = function(house_number, road, city, state, country) {
    result = "";
    if (house_number !== undefined) {
        result += house_number;
    }    
    if (road !== undefined) {
        if (result.length !== 0) {
            result += ", ";
        }
        result += road;
    }
    if(city !== undefined){
        if (result.length !== 0) {
            result += ", ";
        }
        result += city;
    }    
    if(state !== undefined){
        if(result.length !== 0) {
            result += ", ";
        }
        result += state;
    }
    if(country !== undefined){
        if(result.length !== 0) {
            result += ", ";
        }
        result += country;
    }
    return result;
};

// Typeahead search functionality
$(document).one("ajaxStop", function() {

    var geonamesBH = new Bloodhound({
        name: "GeoNames",
        datumTokenizer: function(d) {
            return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: "http://nominatim.openstreetmap.org/search?format=json&limit=5&q=%QUERY&addressdetails=1",
            filter: function(list) {
                return $.map(list, function(osm) {
                    return {
                        name: addressResult(osm.address["house_number"], osm.address["road"], osm.address["city"], osm.address["state"], osm.address["country"]),
                        bbox: osm.boundingbox,
                        source: "GeoNames"
                    };
                });
            },
            ajax: {
                // beforeSend: function (jqXhr, settings) {
                //   settings.url += "&east=" + map.getBounds().getEast() + "&west=" + map.getBounds().getWest() + "&north=" + map.getBounds().getNorth() + "&south=" + map.getBounds().getSouth();
                // $("#searchicon").removeClass("fa-search").addClass("fa-refresh fa-spin");
                //},
                complete: function(jqXHR, status) {
                    $('#searchicon').removeClass("fa-refresh fa-spin").addClass("fa-search");
                }
            }
        },
        limit: 10
    });
    geonamesBH.initialize();

    // instantiate the typeahead UI
    $("#searchbox").typeahead({
        minLength: 3,
        highlight: true,
        hint: false
    }, {
        name: "GeoNames",
        displayKey: "name",
        source: geonamesBH.ttAdapter(),
        templates: {
            header: "<h4 class='typeahead-header'><img src='img/globe.png' width='20' height='20'>&nbsp;Résultat(s)</h4>"
        }
    }).on("typeahead:selected", function(obj, datum) {
        
        if (datum.source === "GeoNames") {
             var   southWest = new L.LatLng(datum.bbox[0],datum.bbox[2]),
                northEast = new L.LatLng(datum.bbox[1], datum.bbox[3]),
                bounds = new L.LatLngBounds(southWest, northEast);
            map.fitBounds(bounds);
        }
        ;
        if ($(".navbar-collapse").height() > 50) {
            $(".navbar-collapse").collapse("hide");
        }
        ;
    }).on("typeahead:opened", function() {
        $(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
        $(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
    }).on("typeahead:closed", function() {
        $(".navbar-collapse.in").css("max-height", "");
        $(".navbar-collapse.in").css("height", "");
    });
    $(".twitter-typeahead").css("position", "static");
    $(".twitter-typeahead").css("display", "block");
});

// Placeholder hack for IE
if (navigator.appName == "Microsoft Internet Explorer") {
    $("input").each(function() {
        if ($(this).val() == "" && $(this).attr("placeholder") != "") {
            $(this).val($(this).attr("placeholder"));
            $(this).focus(function() {
                if ($(this).val() == $(this).attr("placeholder"))
                    $(this).val("");
            });
            $(this).blur(function() {
                if ($(this).val() == "")
                    $(this).val($(this).attr("placeholder"));
            });
        }
    });
}
