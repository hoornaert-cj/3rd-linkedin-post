// Initialize the map
var map = L.map('map').setView([49.251546,-123.127252], 12);

// Add tile layer
L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png?api_key=22685591-9232-45c7-a495-cfdf0e81ab86', {
    minZoom: 11,
    maxZoom: 18,
    maxBounds: [
        [49.17880,-123.28709],
        [49.33166,-122.96559]
    ],
    maxBoundsViscosity: 1.0,
    attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
}).addTo(map);

// Make sure map cannot be panned beyond bounds
map.setMaxBounds([
    [49.17880, -123.28709], // Southwest corner
    [49.33166,-122.96559]  // Northeast corner
]);

// Optional: Prevent panning beyond the bounds
map.options.maxBoundsViscosity = 1.0;

function getIcon(rank) {
    let iconPath;
    let iconSize = [50,50];

    if(rank===1) {
        iconPath='images/first-place.svg';
    }else if(rank===2) {
        iconPath='images/second-place.svg';
    }else if(rank===3) {
        iconPath = 'images/third-place.svg';
    }else if(rank===4) {
        iconPath ='images/fourth-place.svg';
    }else if (rank===5) {
        iconPath = 'images/fifth-place.svg';
    }else {
        iconPath = 'images/other-stations.svg';
        iconSize = [25,25];
    }

    return L.icon({
        iconUrl: iconPath,iconSize: iconSize,
        iconAnchor:[iconSize[0]/2, iconSize[1]/2],
        popupAnchor:[0, -iconSize[1]/2],
    });
}

function getSkyTrainLine(line) {
    // Define a base style that applies to all SkyTrain lines
    const baseStyle = {
        weight: 5,
        lineJoin: 'round',
        lineCap: 'round'
    };

    // Define a mapping of line names to their respective colors
    const lineColors = {
        "Canada Line": "#5699c4",
        "Expo Line": "#365da5",
        "Millennium Line": "#f2d44b"
    };

    return {
        // Spread operator to include base style properties
        ...baseStyle,
         // Assigns the correct color or a fallback color
        color: lineColors[line] || "#888888"
    };
}


//Fetch and process the SkyTrain station GeoJSON
fetch('data/skytrain_stations.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                let rank=feature.properties.rank;
                return L.marker(latlng, { icon: getIcon(rank) });
            }
        }).addTo(map);  // Add the layer to the map
    })
    .catch(error => console.error('Error loading GeoJSON:', error))

fetch('data/skytrain_lines.geojson')
    .then(response => response.json())
    .then(data => {
        var skytrain_lines = L.geoJSON(data, {
            style: function(feature){
                return getSkyTrainLine(feature.properties.line);
            }
        }).addTo(map);
    })
