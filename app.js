// Mapbox access token
const mapboxAccessToken = 'pk.eyJ1IjoicnNhbmdleSIsImEiOiJjbTYybnd1Z2IxMjR3MmxvdThzMHRxejBjIn0.FHJ1aQP5xd0N0t5rg9F8oQ';

// NASA FIRMS API key
const nasaApiKey = '3acfaa87cc4834f8fd0edcfe416a533a';

// Initialize the Mapbox map
mapboxgl.accessToken = mapboxAccessToken;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-v9',
    projection: 'globe',
    center: [0, 20], // Center on a global view
    zoom: 2, // Zoom level for global view
    maxBounds: [[-180, -90], [180, 90]], // Restrict panning to valid coordinates
    globe: {
        atmosphereColor: '#000000',
        atmosphereAltitude: 0.1
    }
});

// Add a loading indicator
const loadingIndicator = document.createElement('div');
loadingIndicator.style.position = 'absolute';
loadingIndicator.style.top = '50%';
loadingIndicator.style.left = '50%';
loadingIndicator.style.transform = 'translate(-50%, -50%)';
loadingIndicator.style.padding = '20px';
loadingIndicator.style.background = 'rgba(255, 255, 255, 0.9)';
loadingIndicator.style.borderRadius = '10px';
loadingIndicator.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
loadingIndicator.innerText = 'Loading wildfire data...';
document.body.appendChild(loadingIndicator);

// Function to get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Function to format time in 12-hour format
function formatTime(timeStr) {
    if (!timeStr || timeStr === 'undefined' || timeStr === 'n' || timeStr === 'N') return null;
    console.log('Formatting time:', timeStr); // Debug log
    try {
        // Convert minutes since midnight to hours and minutes
        const totalMinutes = parseInt(timeStr);
        if (isNaN(totalMinutes)) {
            console.log('Invalid minutes:', timeStr);
            return null;
        }
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        // Format hours and minutes with leading zeros
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        
        // Convert to 12-hour format
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        return `${hour12}:${formattedMinutes} ${ampm}`;
    } catch (error) {
        console.log('Error formatting time:', error);
        return null;
    }
}

// Function to fetch data for a specific country
async function fetchCountryData(country) {
    console.log(`Fetching data for ${country}...`);
    const today = getTodayDate();
    
    // Format the API URL with proper parameters
    const response = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/country/csv/${nasaApiKey}/VIIRS_SNPP_NRT/${country}/1/${today}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.text();
    console.log(`Raw data received for ${country}:`, data.substring(0, 500) + '...');
    
    // Parse CSV data
    const rows = data.split('\n').filter(row => row.trim()); // Remove empty rows
    console.log(`Number of rows for ${country}:`, rows.length);
    
    if (rows.length >= 2) {
        const headers = rows[0].split(',');
        return rows.slice(1).map(row => {
            const values = row.split(',');
            const fire = {};
            headers.forEach((header, index) => {
                fire[header.trim()] = values[index];
            });
            return fire;
        });
    }
    return [];
}

// Function to fetch global data
async function fetchGlobalData() {
    console.log('Fetching global data...');
    const today = getTodayDate();
    
    // Fetch data for the entire world with proper formatting
    const response = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${nasaApiKey}/VIIRS_SNPP_NRT/-180,-90,180,90/1/${today}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.text();
    console.log('Raw global data received:', data.substring(0, 500) + '...');
    
    // Parse CSV data
    const rows = data.split('\n').filter(row => row.trim()); // Remove empty rows
    console.log('Number of global rows:', rows.length);
    
    if (rows.length >= 2) {
        const headers = rows[0].split(',');
        return rows.slice(1).map(row => {
            const values = row.split(',');
            const fire = {};
            headers.forEach((header, index) => {
                fire[header.trim()] = values[index];
            });
            return fire;
        });
    }
    return [];
}

// Add atmosphere effect when the map loads
map.on('load', () => {
    // Add atmosphere effect
    map.setFog({
        'horizon-blend': 0.02,
        'star-color': [0, 0, 0],
        'high-color': '#000000',
        'space-color': '#000000',
        'horizon-color': '#000000',
        'atmosphere-color': '#000000',
        'atmosphere-horizon-blend': 0.2,
        'atmosphere-sun': [0.0, 90.0],
        'atmosphere-sun-intensity': 15
    });

    // Add the source for clustered points
    map.addSource('fires', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
    });

    // Add the cluster layer
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'fires',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#ffebee',
                10,
                '#ffcdd2',
                30,
                '#ef9a9a',
                50,
                '#e57373',
                100,
                '#ef5350'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                20,
                10,
                30,
                30,
                40,
                50,
                50,
                100,
                60
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
            'circle-stroke-opacity': 0.5
        }
    });

    // Add the unclustered point layer
    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'fires',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#ef5350',
            'circle-radius': 8,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    });

    // Add click handlers for clusters
    map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('fires').getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
                if (err) return;
                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
    });

    // Add click handlers for points
    map.on('click', 'unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const popupContent = e.features[0].properties.popupContent;
        
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);

        map.flyTo({
            center: coordinates,
            zoom: 10
        });
    });

    // Change cursor to pointer when hovering over clusters or points
    map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
    });
    map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
    });
});

// Fetch wildfire data from NASA FIRMS API
async function fetchFireData() {
    try {
        console.log('Fetching data from NASA FIRMS API...');
        
        // Fetch data for specific countries to ensure good coverage
        const countries = ['CAN', 'USA', 'AUS', 'RUS', 'BRA', 'ZAF']; // Added more countries for better coverage
        let allFires = [];
        
        for (const country of countries) {
            try {
                const fires = await fetchCountryData(country);
                allFires = allFires.concat(fires);
            } catch (error) {
                console.log(`Error fetching data for ${country}:`, error);
            }
        }

        // Remove duplicates based on coordinates and time
        const uniqueFires = allFires.filter((fire, index, self) =>
            index === self.findIndex((f) => 
                f.latitude === fire.latitude && 
                f.longitude === fire.longitude && 
                f.acq_date === fire.acq_date && 
                f.acq_time === fire.acq_time
            )
        );

        console.log('Total unique fires found:', uniqueFires.length);
        if (uniqueFires.length > 0) {
            console.log('Sample fire data:', uniqueFires[0]);
        }

        // Limit the number of fires to prevent performance issues
        const maxFires = 1000;
        let limitedFires = uniqueFires;
        if (uniqueFires.length > maxFires) {
            console.log(`Limiting fires to ${maxFires} for better performance`);
            limitedFires = uniqueFires.slice(0, maxFires);
        }

        // Convert fires to GeoJSON features
        const features = limitedFires.map(fire => {
            const latitude = parseFloat(fire.latitude);
            const longitude = parseFloat(fire.longitude);
            const confidence = fire.confidence;
            const date = fire.acq_date;
            const time = formatTime(fire.acq_time);
            const satellite = fire.satellite;
            const country = fire.country_id;

            if (isNaN(latitude) || isNaN(longitude)) return null;

            // Build popup content
            let popupContent = [];
            if (country) popupContent.push(`<strong>Country:</strong> ${country}`);
            if (date) popupContent.push(`<strong>Date:</strong> ${date}`);
            if (time) popupContent.push(`<strong>Time:</strong> ${time}`);
            if (confidence && confidence !== 'n' && confidence !== 'N') popupContent.push(`<strong>Confidence:</strong> ${confidence}%`);
            if (satellite && satellite !== 'n' && satellite !== 'N' && satellite !== 'undefined') popupContent.push(`<strong>Satellite:</strong> ${satellite}`);

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                properties: {
                    popupContent: popupContent.join('<br>')
                }
            };
        }).filter(feature => feature !== null);

        // Update the map source with new data
        map.getSource('fires').setData({
            type: 'FeatureCollection',
            features: features
        });

        // Remove loading indicator
        document.body.removeChild(loadingIndicator);

    } catch (error) {
        console.error('Error fetching wildfire data:', error);
        document.body.removeChild(loadingIndicator);
        alert('Error loading wildfire data. Please try again later.');
    }
}

// Fetch data when the map loads
map.on('load', fetchFireData);