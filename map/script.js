// Initialize the map centered on Sicily
var map = L.map("map").setView([37.6, 14.1], 9);

var baseLayers = {
  "Street View": L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors.',
    }
  ).addTo(map),
  "Satellite View": L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution:
        'Map data &copy; <a href="https://www.arcgis.com/">ArcGIS</a>',
    }
  ),
  "Relief View": L.tileLayer(
    "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 17,
      attribution:
        'Map data &copy; <a href="https://www.opentopomap.org/">OpenTopoMap</a>',
    }
  ),

  "Google Maps": L.tileLayer(
    "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution:
        'Map data &copy; <a href="https://www.google.com/maps">Google Maps</a>',
    }
  ),
  "Google Satellite": L.tileLayer(
    "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution:
        'Map data &copy; <a href="https://www.google.com/maps">Google Maps</a>',
    }
  ),
};

L.control.layers(baseLayers).addTo(map);

// Initialize the Marker Cluster Group
var markers = L.markerClusterGroup();

// Function to get the marker color based on status
function getMarkerColor(status) {
  switch (status) {
    case "active":
      return "#28a745"; // green
    case "inactive":
      return "#dc3545"; // red
    case "soon":
      return "#ffc107"; // yellow
    case "mobile_active":
      return "#17a2b8"; // blue
    case "mobile_inactive":
      return "#6c757d"; // gray
    case "mobile_soon":
      return "#ffc107"; // yellow
    default:
      return "#6c757d"; // gray
  }
}

function statusToDescription(status) {
  switch (status) {
    case "active":
      return "This node is active. You can watch it's state on LoRaItalia.";
    case "inactive":
      return "This node is inactive and not working.";
    case "soon":
      return "This node is not active yet, but will be soon.";
    case "mobile_active":
      return "This mobile node is active. You can watch it's state on LoRaItalia.";
    case "mobile_inactive":
      return "This mobile node is inactive and not working.";
    case "mobile_soon":
      return "This mobile node is not active yet, but will be soon.";
    default:
      return "The status of this node is unknown.";
  }
}

let nodesStats = {
  active: 0,
  inactive: 0,
  soon: 0,
  mobile_active: 0,
  mobile_inactive: 0,
  mobile_soon: 0,
  unknown: 0,
};
// Fetch data from the local JSON file
fetch("points.json?nocache=" + new Date().getTime())
  .then((response) => response.json())
  .then((data) => {
    // Add the markers from the data
    data.points.forEach((point) => {
      nodesStats[point.status] += 1;

      var markerColor = getMarkerColor(point.status);

      var customIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${markerColor}">${point.label}</div>`,
        iconSize: [40, 40], // Increase size for better visibility
        iconAnchor: [20, 20], // Center the marker
      });

      customIcon.options["--marker-bg-color"] = markerColor;

      var marker = L.marker([point.lat, point.lng], { icon: customIcon });

      // Add popup to marker
      marker.bindPopup(`
            <b>${point.name} (${point.label})</b><br>
            ${point.description}<br><br>
            Status: ${statusToDescription(point.status)}<br>
            
            ${
              point.status === "active"
                ? `<a href="https://map.loraitalia.it/?page=details&nodeID=${point.id}" target="_blank">More info on LoraItalia</a>`
                : ""
            }
            <br>
            <a href="${point.tg_link}" target="_blank">User</a><br>
            `);

      markers.addLayer(marker);
    });

    // Add the markers to the map
    map.addLayer(markers);

    // Project info at left bottom with legend
    var info = L.control({ position: "bottomleft" });

    info.onAdd = function (map) {
      var div = L.DomUtil.create("div", "info");
      div.innerHTML = `
    <h4><b>Meshtastic Sicily Map</b></h4>
    <p>Map of the Meshtastic nodes in Sicily.</p>
    <p>${nodesStats.active + nodesStats.mobile_active} active nodes, ${
        nodesStats.soon
      } soon nodes. TOT: ${
        data.points.length
      } nodes.</p>
    <p>More info on <a href="https://github.com/Matt0550/Meshtastic-Sicily" target="_blank">GitHub</a>.</p>
    `;
      return div;
    };

    info.addTo(map);
  })
  .catch((error) => console.error("Error loading the data:", error));

// Add legend to the map
var legend = L.control({ position: "bottomright" });

legend.onAdd = function (map) {
  var div = L.DomUtil.create("div", "legend");
  div.innerHTML += '<i style="background: #28a745"></i> Active<br>';
  div.innerHTML += '<i style="background: #dc3545"></i> Inactive<br>';
  div.innerHTML += '<i style="background: #ffc107"></i> Soon<br>';
  div.innerHTML += '<i style="background: #17a2b8"></i> Mobile Active<br>';
  div.innerHTML += '<i style="background: #6c757d"></i> Unknown<br>';
  return div;
};

legend.addTo(map);
