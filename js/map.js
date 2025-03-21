// Initialize the map
var map = L.map('map').setView([49.251546, -123.127252], 12);
const stationMarkers = {};

document.addEventListener('DOMContentLoaded', function () {
    // All your DOM interaction code goes here
    document.getElementById('heatmap-toggle').addEventListener('change', function(e) {
        if (e.target.checked) {
            map.addLayer(heatmapLayer);
        } else {
            map.removeLayer(heatmapLayer);
        }
    });

    // Add the heatmap layer
    var heatmapLayer = L.tileLayer('data/heatmap_tiles/{z}/{x}/{y}/{x}-{y}.png', {
        opacity: 0.7,
        attribution: 'Heatmap &copy; Chris Hoornaert'
    });

    // Add the heatmap layer first, so it appears beneath other layers
    heatmapLayer.addTo(map);

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
        [49.33166, -122.96559]  // Northeast corner
    ]);

    // Optional: Prevent panning beyond the bounds
    map.options.maxBoundsViscosity = 1.0;

    function getIcon(rank) {
        let iconPath;
        let iconSize = [50, 50];

        if (rank === 1) {
            iconPath = 'images/first-place.svg';
        } else if (rank === 2) {
            iconPath = 'images/second-place.svg';
        } else if (rank === 3) {
            iconPath = 'images/third-place.svg';
        } else if (rank === 4) {
            iconPath = 'images/fourth-place.svg';
        } else if (rank === 5) {
            iconPath = 'images/fifth-place.svg';
        } else {
            iconPath = 'images/other-stations.svg';
            iconSize = [25, 25];
        }

        return L.icon({
            iconUrl: iconPath,
            iconSize: iconSize,
            iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
            popupAnchor: [0, -iconSize[1] / 2],
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

    function populateStationDropdown(stationsData) {
        const dropdown = document.getElementById('station-dropdown');

        stationsData.features.sort((a, b) =>
            a.properties.station.localeCompare(b.properties.station)
        );

        stationsData.features.forEach((station, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.text = station.properties.station;
            dropdown.add(option);
        });

        dropdown.addEventListener('change', function() {
            const selectedIndex = dropdown.value;
            if (selectedIndex !== "") {
                const selectedStation = stationsData.features[selectedIndex];
                zoomToStation(selectedStation);
            }
        });
    }

    function zoomToStation(station) {
        const stationName = station.properties.station;

        let marker = stationMarkers[stationName];

        if (marker) {
            map.setView(marker.getLatLng(), 15);

            setTimeout(() => marker.openPopup(), 600);
        } else {
            console.error("Station marker not found: ", stationName);
        }
    }

    // Fetch and process the SkyTrain station GeoJSON
    fetch('data/skytrain_stations.geojson')
        .then(response => response.json())
        .then(data => {
            populateStationDropdown(data);
            L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    let rank = feature.properties.rank;
                    let marker = L.marker(latlng, { icon: getIcon(rank) });

                    let popupContent = `
                        <img src="images/maple-leaf.svg" alt="Maple Leaf"
                             style="display: block; margin: 0 auto; width: 2rem; height: 2rem;">
                        <b>Station: ${feature.properties['station']}</b><br>
                        <b>Neighbourhood: ${feature.properties['geo_local_area']}</b><br>
                        <b>Coffee Shops: ${feature.properties['id_count']}</b><br>
                        <b>Rank (out of 20): ${feature.properties['rank']}</b><br>
                    `;

                    marker.bindPopup(popupContent, { offset: [0, 0] });

                    // Bind Tooltip
                    marker.bindTooltip(`${feature.properties.station} (Coffee Shops: ${feature.properties.id_count})`, {
                        permanent: false,
                        direction: "top",
                        className: "station-tooltip"
                    });

                    stationMarkers[feature.properties.station] = marker;

                    return marker;
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading GeoJSON:', error));

    fetch('data/skytrain_lines.geojson')
        .then(response => response.json())
        .then(data => {
            var skytrain_lines = L.geoJSON(data, {
                style: function(feature) {
                    return getSkyTrainLine(feature.properties.line);
                }
            }).addTo(map);
        });
});

