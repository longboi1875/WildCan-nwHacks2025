// Mapbox access token
const mapboxAccessToken = 'pk.eyJ1IjoicnNhbmdleSIsImEiOiJjbTYybnd1Z2IxMjR3MmxvdThzMHRxejBjIn0.FHJ1aQP5xd0N0t5rg9F8oQ';

// NASA FIRMS API keys
const nasaApiKeys = [
    '3acfaa87cc4834f8fd0edcfe416a533a',
    'JafOWen9fGxlPLgQBmZ8BdywllmSIe0evvOjLBGS'
];

// Initialize the Mapbox map
mapboxgl.accessToken = mapboxAccessToken;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-v9',
    projection: 'globe',
    center: [0, 20], // Center on a global view
    zoom: 2, // Zoom level for global view
    worldCopyJump: true, // Allow continuous panning around the globe
    globe: {
        atmosphereColor: '#000000',
        atmosphereAltitude: 0
    }
});
console.log("Mapbox map object created:", map);

// Add userLocationMarker as a global variable
let userLocationMarker = null;

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
    
        const totalMinutes = parseInt(timeStr);
    if (isNaN(totalMinutes)) return null;
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
    // Use template literals and direct string concatenation for better performance
    return `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

// Country code to name mapping
const countryCodeToName = {
    'CAN': 'Canada',
    'USA': 'United States',
    'MEX': 'Mexico',
    'BRA': 'Brazil',
    'ARG': 'Argentina',
    'AUS': 'Australia',
    'RUS': 'Russia',
    'CHN': 'China',
    'IND': 'India',
    'IDN': 'Indonesia',
    'MYS': 'Malaysia',
    'THA': 'Thailand',
    'ZAF': 'South Africa',
    'COD': 'Democratic Republic of the Congo',
    'AGO': 'Angola',
    'ZMB': 'Zambia',
    'TZA': 'Tanzania',
    'MOZ': 'Mozambique',
    'ZWE': 'Zimbabwe',
    'BWA': 'Botswana',
    'NAM': 'Namibia',
    'SWZ': 'Eswatini',
    'LSO': 'Lesotho',
    'MWI': 'Malawi',
    'UGA': 'Uganda',
    'KEN': 'Kenya',
    'ETH': 'Ethiopia',
    'SOM': 'Somalia',
    'SDN': 'Sudan',
    'SSD': 'South Sudan',
    'CAF': 'Central African Republic',
    'CMR': 'Cameroon',
    'GAB': 'Gabon',
    'COG': 'Republic of the Congo',
    'GNQ': 'Equatorial Guinea',
    'GIN': 'Guinea',
    'SLE': 'Sierra Leone',
    'LBR': 'Liberia',
    'CIV': 'Ivory Coast',
    'GHA': 'Ghana',
    'TGO': 'Togo',
    'BEN': 'Benin',
    'NGA': 'Nigeria',
    'NER': 'Niger',
    'TCD': 'Chad',
    'MLI': 'Mali',
    'BFA': 'Burkina Faso',
    'SEN': 'Senegal',
    'GMB': 'Gambia',
    'GNB': 'Guinea-Bissau',
    'MRT': 'Mauritania',
    'DZA': 'Algeria',
    'TUN': 'Tunisia',
    'LBY': 'Libya',
    'EGY': 'Egypt',
    'MAR': 'Morocco',
    'ESH': 'Western Sahara',
    'CPV': 'Cape Verde',
    'STP': 'São Tomé and Príncipe',
    'MDG': 'Madagascar',
    'COM': 'Comoros',
    'MUS': 'Mauritius',
    'SYC': 'Seychelles',
    'DJI': 'Djibouti',
    'ERI': 'Eritrea',
    'GAB': 'Gabon',
    'GNQ': 'Equatorial Guinea',
    'GIN': 'Guinea',
    'SLE': 'Sierra Leone',
    'LBR': 'Liberia',
    'CIV': 'Ivory Coast',
    'GHA': 'Ghana',
    'TGO': 'Togo',
    'BEN': 'Benin',
    'NGA': 'Nigeria',
    'NER': 'Niger',
    'TCD': 'Chad',
    'MLI': 'Mali',
    'BFA': 'Burkina Faso',
    'SEN': 'Senegal',
    'GMB': 'Gambia',
    'GNB': 'Guinea-Bissau',
    'MRT': 'Mauritania',
    'DZA': 'Algeria',
    'TUN': 'Tunisia',
    'LBY': 'Libya',
    'EGY': 'Egypt',
    'MAR': 'Morocco',
    'ESH': 'Western Sahara',
    'CPV': 'Cape Verde',
    'STP': 'São Tomé and Príncipe',
    'MDG': 'Madagascar',
    'COM': 'Comoros',
    'MUS': 'Mauritius',
    'SYC': 'Seychelles',
    'DJI': 'Djibouti',
    'ERI': 'Eritrea'
};

// Function to process fire data
function processFireData(fires) {
    return fires.map(fire => {
        const latitude = parseFloat(fire.latitude);
        const longitude = parseFloat(fire.longitude);
        
        if (isNaN(latitude) || isNaN(longitude)) {
            return {
                ...fire,
                locationName: 'Unknown Location'
            };
        }
        
        // Get country name from the mapping
        const countryCode = fire.country_id || '';
        const countryName = countryCodeToName[countryCode] || 'Unknown Country';
        
        // Build location string
        const parts = [];
        if (fire.province) parts.push(fire.province);
        parts.push(countryName);
        
        return {
            ...fire,
            locationName: parts.join(', ')
        };
    });
}

// Function to fetch data for a specific country using multiple API keys
async function fetchCountryData(country) {
    console.log(`Fetching data for ${country}...`);
    const today = getTodayDate();
    
    try {
        // Create an array of promises for each API key
        const apiKeyPromises = nasaApiKeys.map(apiKey => 
            Promise.all([
                fetch(`https://firms.modaps.eosdis.nasa.gov/api/country/csv/${apiKey}/VIIRS_SNPP_NRT/${country}/1/${today}`),
                fetch(`https://firms.modaps.eosdis.nasa.gov/api/country/csv/${apiKey}/MODIS_NRT/${country}/1/${today}`)
            ])
        );
        
        // Wait for all API key requests to complete
        const results = await Promise.allSettled(apiKeyPromises);
        
        let allFires = [];
        
        // Process results from each API key
        for (const result of results) {
            if (result.status === 'fulfilled') {
                const [viirsResponse, modisResponse] = result.value;
                
                if (viirsResponse.ok && modisResponse.ok) {
                    const [viirsData, modisData] = await Promise.all([
                        viirsResponse.text(),
                        modisResponse.text()
                    ]);
                    
                    const viirsFires = parseCSVData(viirsData);
                    const modisFires = parseCSVData(modisData);
                    
                    // Log detailed information for Canada
                    if (country === 'CAN') {
                        console.log(`Canada VIIRS fires: ${viirsFires.length}`);
                        console.log(`Canada MODIS fires: ${modisFires.length}`);
                        if (viirsFires.length > 0) {
                            console.log('Sample VIIRS fire:', viirsFires[0]);
                        }
                        if (modisFires.length > 0) {
                            console.log('Sample MODIS fire:', modisFires[0]);
                        }
                    }
                    
                    allFires = [...allFires, ...viirsFires, ...modisFires];
                } else {
                    console.error(`API response not OK for ${country}:`, {
                        viirs: viirsResponse.ok,
                        modis: modisResponse.ok
                    });
                }
            } else {
                console.error(`Failed to fetch data for ${country}:`, result.reason);
            }
        }
        
        console.log(`Fetched ${allFires.length} fires for ${country}`);
        return allFires;
    } catch (error) {
        console.error(`Error fetching data for ${country}:`, error);
        return [];
    }
}

// Function to parse CSV data
function parseCSVData(data) {
    const rows = data.split('\n');
    if (rows.length < 2) return [];
    
    const headers = rows[0].split(',').map(h => h.trim());
    const result = [];
    
    // Process rows in a single loop
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;
        
            const values = row.split(',');
            const fire = {};
        
        // Use a single loop to process headers and values
        for (let j = 0; j < headers.length; j++) {
            fire[headers[j]] = values[j];
        }
        
        result.push(fire);
    }
    
    return result;
}

// Function to fetch global data using multiple API keys
async function fetchGlobalData() {
    console.log('Fetching global data...');
    const today = getTodayDate();
    
    try {
        // Create an array of promises for each API key
        const apiKeyPromises = nasaApiKeys.map(apiKey => 
            Promise.all([
                fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/-180,-90,180,90/1/${today}`),
                fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/MODIS_NRT/-180,-90,180,90/1/${today}`)
            ])
        );
        
        // Wait for all API key requests to complete
        const results = await Promise.allSettled(apiKeyPromises);
        
        let allFires = [];
        
        // Process results from each API key
        for (const result of results) {
            if (result.status === 'fulfilled') {
                const [viirsResponse, modisResponse] = result.value;
                
                if (viirsResponse.ok && modisResponse.ok) {
                    const [viirsData, modisData] = await Promise.all([
                        viirsResponse.text(),
                        modisResponse.text()
                    ]);
                    
                    const viirsFires = parseCSVData(viirsData);
                    const modisFires = parseCSVData(modisData);
                    allFires = [...allFires, ...viirsFires, ...modisFires];
                }
            }
        }
        
        console.log(`Fetched ${allFires.length} fires globally`);
        return allFires;
    } catch (error) {
        console.error("Failed to fetch global data:", error);
        return [];
    }
}

// Function to safely remove loading indicator
function removeLoadingIndicator() {
    console.log("Attempting to remove loading indicator...");
    const loadingIndicator = document.querySelector('.loading');
    console.log("Loading indicator element found:", loadingIndicator);
    if (loadingIndicator) {
        // Add hidden class for transition
        loadingIndicator.classList.add('hidden');
        // Remove after transition
        setTimeout(() => {
            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
                console.log("Loading indicator removed after fade-out.");
            }
        }, 300);
    } else {
        console.log("Loading indicator element NOT found.");
    }
}

// Function to show error in loading indicator
function showLoadingError(message) {
    console.log("Showing loading error:", message);
    const loadingIndicator = document.querySelector('.loading');
    if (loadingIndicator) {
        const loadingContent = loadingIndicator.querySelector('.loading-content');
        if (loadingContent) {
            loadingContent.innerHTML = `
                <div class="loading-error">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">${message}</div>
                </div>
            `;
        }
    }
}

// Function to update loading text
function updateLoadingText(message) {
    console.log("Updating loading text:", message);
    const loadingIndicator = document.querySelector('.loading');
    if (loadingIndicator) {
        const loadingText = loadingIndicator.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }
}

// Add atmosphere effect when the map loads
map.on('load', () => {
    console.log("Map 'load' event fired.");
    // Set fog with valid properties
    map.setFog({
        'horizon-blend': 0,
        'high-color': '#000000',
        'space-color': '#000000'
    });

    // Add the source for clustered points
    map.addSource('fires', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        },
        cluster: true,
        clusterMaxZoom: 8,
        clusterRadius: 30
    });

    // Add a glow effect layer for better visibility (bottom layer)
    map.addLayer({
        id: 'glow',
        type: 'circle',
        source: 'fires',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#ef5350',
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 8,
                10, 14
            ],
            'circle-opacity': 0.3,
            'circle-blur': 2,
            'circle-translate': [0, 0],
            'circle-pitch-alignment': 'map',
            'circle-pitch-scale': 'map'
        }
    });

    // Add the unclustered point layer (middle layer)
    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'fires',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#ef5350',
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 6,
                10, 10
            ],
            'circle-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 0.7,
                10, 0.9
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
            'circle-stroke-opacity': 0.8,
            'circle-translate': [0, 0],
            'circle-pitch-alignment': 'map',
            'circle-pitch-scale': 'map'
        }
    });

    // Add the cluster layer (top layer)
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
                5,
                '#ffcdd2',
                10,
                '#ef9a9a',
                20,
                '#e57373',
                50,
                '#ef5350'
            ],
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, ['step', ['get', 'point_count'], 15, 5, 20, 10, 25, 20, 30, 40, 35],
                10, ['step', ['get', 'point_count'], 25, 5, 30, 10, 35, 20, 40, 40, 45]
            ],
            'circle-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 0.7,
                10, 0.9
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
            'circle-stroke-opacity': 0.8,
            'circle-translate': [0, 0],
            'circle-pitch-alignment': 'map',
            'circle-pitch-scale': 'map'
        }
    });

    // Add cluster count labels
    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'fires',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        },
        paint: {
            'text-color': '#ffffff'
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
                    zoom: Math.min(zoom, 8)
                });
            }
        );
    });

    // Add click handlers for points
    map.on('click', 'unclustered-point', (e) => {
        // Remove any existing popups
        const existingPopups = document.getElementsByClassName('mapboxgl-popup');
        if (existingPopups.length) {
            Array.from(existingPopups).forEach(popup => popup.remove());
        }

        const coordinates = e.features[0].geometry.coordinates.slice();
        const popupContent = e.features[0].properties.popupContent;
        
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);

        // Center on the fire but maintain current zoom level
        map.flyTo({
            center: coordinates,
            zoom: map.getZoom()
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

    // Add user location marker source and layer
    map.addSource('user-location', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });

    // Add a pulsing dot for user location
    map.addLayer({
        id: 'user-location-point',
        type: 'circle',
        source: 'user-location',
        paint: {
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 6,
                10, 12
            ],
            'circle-color': '#4285F4',
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.8
        }
    });
    
    // Add the pulsing effect
    map.addLayer({
        id: 'user-location-pulse',
        type: 'circle',
        source: 'user-location',
        paint: {
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 10,
                10, 20
            ],
            'circle-color': '#4285F4',
            'circle-opacity': [
                'interpolate',
                ['linear'],
                ['get', 'pulse'],
                0, 0.3,
                1, 0
            ],
            'circle-stroke-width': 0
        }
    });

    // Fetch data when the map loads
    fetchFireData().finally(() => {
        console.log("Entered finally block in map.on('load')");
        // Always remove the loading indicator after data fetch attempt
        console.log("Calling removeLoadingIndicator...");
        removeLoadingIndicator();
    });
});

// Function to check if two coordinates are close enough to be considered the same fire
function areCoordinatesClose(coord1, coord2, threshold = 0.01) {
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;
    return Math.abs(lng1 - lng2) < threshold && Math.abs(lat1 - lat2) < threshold;
}

// Function to deduplicate fires based on proximity and exact matches
function deduplicateFires(fires) {
    const uniqueFires = [];
    const processedCoords = new Set();

    // First, sort fires by date (most recent first)
    fires.sort((a, b) => {
        if (!a.acq_date || !b.acq_date) return 0;
        return new Date(b.acq_date) - new Date(a.acq_date);
    });

    fires.forEach(fire => {
        const coords = [parseFloat(fire.longitude), parseFloat(fire.latitude)];
        const coordKey = coords.join(',');
        
        // Skip if we've already processed these exact coordinates
        if (processedCoords.has(coordKey)) {
            return;
        }

        // Check if this fire is close to any already processed fire
        const isDuplicate = uniqueFires.some(existingFire => {
            const existingCoords = [parseFloat(existingFire.longitude), parseFloat(existingFire.latitude)];
            return areCoordinatesClose(coords, existingCoords);
        });

        if (!isDuplicate) {
            uniqueFires.push(fire);
            processedCoords.add(coordKey);
        }
    });

    return uniqueFires;
}

// Fetch wildfire data from NASA FIRMS API
async function fetchFireData() {
    let allFires = [];
    
    try {
        updateLoadingText('Fetching wildfire data...');
        
        // Fetch data for specific countries to ensure good coverage
        const countries = ['CAN', 'USA', 'AUS', 'RUS', 'BRA', 'ZAF', 'COD', 'IDN', 'MYS', 'THA'];
        
        // Create an array of promises for all countries with timeout
        const countryPromises = countries.map(country => 
            Promise.race([
                fetchCountryData(country),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Timeout fetching data for ${country}`)), 10000)
                )
            ])
        );
        
        // Wait for all promises to resolve
        const results = await Promise.allSettled(countryPromises);
        
        // Process results more efficiently
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'fulfilled') {
                allFires = allFires.concat(result.value);
            }
        }
        
        // Always fetch global data as a backup
        updateLoadingText('Fetching global wildfire data...');
        const globalFires = await Promise.race([
            fetchGlobalData(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout fetching global data')), 15000)
            )
        ]);
        
        // Combine country-specific and global data
        allFires = allFires.concat(globalFires);
        
        // After getting allFires, process them with the simpler method
        updateLoadingText('Processing wildfire data...');
        const processedFires = processFireData(allFires);
        
        // Get the time filter value
        const timeFilter = parseInt(document.getElementById('time-filter').value);
        const cutoffDate = new Date(Date.now() - timeFilter * 60 * 60 * 1000);

        // Create a Map for deduplication
        const uniqueFiresMap = new Map();
        
        // Process fires in a single pass
        processedFires.forEach(fire => {
            if (!fire.acq_date) return;
            
            const key = `${fire.latitude},${fire.longitude},${fire.acq_date},${fire.acq_time}`;
            if (!uniqueFiresMap.has(key)) {
                const fireDate = new Date(fire.acq_date);
                if (fire.acq_time && !isNaN(parseInt(fire.acq_time))) {
                    const totalMinutes = parseInt(fire.acq_time);
                    fireDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60);
                }
                
                const bufferCutoffDate = new Date(cutoffDate.getTime() - 60 * 60 * 1000);
                if (fireDate >= bufferCutoffDate) {
                    uniqueFiresMap.set(key, fire);
                }
            }
        });
        
        const uniqueFires = Array.from(uniqueFiresMap.values());
        const deduplicatedFires = deduplicateFires(uniqueFires);
        
        updateLoadingText('Updating map...');
        
        // Update the fire count in the UI
        document.getElementById('fireCount').textContent = deduplicatedFires.length;

        // Convert fires to GeoJSON features
        const features = deduplicatedFires.map(fire => {
            const latitude = parseFloat(fire.latitude);
            const longitude = parseFloat(fire.longitude);
            
            if (isNaN(latitude) || isNaN(longitude)) {
                return null;
            }
            
            const popupContent = [
                `<strong>Location:</strong> ${fire.locationName}`,
                fire.acq_date && `<strong>Date:</strong> ${fire.acq_date}`,
                fire.acq_time && `<strong>Last Updated:</strong> ${formatTime(fire.acq_time)}`,
                fire.confidence && fire.confidence !== 'n' && fire.confidence !== 'N' && 
                    `<strong>Confidence:</strong> ${fire.confidence}%`
            ].filter(Boolean).join('<br>');

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                properties: {
                    popupContent,
                    locationName: fire.locationName,
                    date: fire.acq_date,
                    time: formatTime(fire.acq_time),
                    confidence: fire.confidence
                }
            };
        }).filter(Boolean);

        // Update the map source with new data
        map.getSource('fires').setData({
            type: 'FeatureCollection',
            features
        });
        
        // Update the map source filter to only exclude invalid coordinates
        map.setFilter('unclustered-point', [
            'all',
            ['!', ['has', 'point_count']]
        ]);
        
        // Update the fire list
        updateFireList();

    } catch (error) {
        console.error('Error fetching wildfire data:', error);
        showLoadingError('Error loading wildfire data. Please try again later.');
        document.getElementById('fireCount').textContent = '0';
        document.getElementById('fireList').innerHTML = '';
    }
}

// Add event listener for time filter
document.getElementById('time-filter').addEventListener('change', fetchFireData);

// Update the locationButton listener to set the user location marker
const locationButton = document.getElementById('locationButton');
locationButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = [position.coords.longitude, position.coords.latitude];
                
                // Fly to user location
                map.flyTo({
                    center: userLocation,
                    zoom: 8
                });
                
                // Update user location marker
                map.getSource('user-location').setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        properties: {
                            title: 'Your Location',
                            pulse: 1
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: userLocation
                        }
                    }]
                });
                
                // Start pulse animation
                let pulseValue = 0;
                const pulseAnimation = setInterval(() => {
                    pulseValue = (pulseValue + 0.1) % 1;
                    map.getSource('user-location').setData({
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            properties: {
                                title: 'Your Location',
                                pulse: pulseValue
                            },
                            geometry: {
                                type: 'Point',
                                coordinates: userLocation
                            }
                        }]
                    });
                }, 100);
                
                // Store animation interval for cleanup
                window.userPulseAnimation = pulseAnimation;
            },
            (error) => {
                alert('Unable to get your location. Please enable location services.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
});

// Function to update fire list based on current map view
function updateFireList() {
    const bounds = map.getBounds();
    const fireList = document.getElementById('fireList');
    
    // Get all features from the fires source
    const features = map.querySourceFeatures('fires', {
        sourceLayer: 'fires'
    });
    
    // Filter features within current map bounds and exclude clusters
    const visibleFires = features.filter(feature => {
        if (feature.properties.cluster) return false;
        const [lng, lat] = feature.geometry.coordinates;
        return lng >= bounds.getWest() && 
               lng <= bounds.getEast() && 
               lat >= bounds.getSouth() && 
               lat <= bounds.getNorth();
    });
    
    // Clear current list
    fireList.innerHTML = '';
    
    if (visibleFires.length === 0) {
        const noFiresMessage = document.createElement('div');
        noFiresMessage.className = 'no-fires-message';
        noFiresMessage.innerHTML = 'No fires detected in the current view.';
        fireList.appendChild(noFiresMessage);
        return;
    }
    
    // Create fire list items
    visibleFires.forEach(fire => {
        const fireItem = document.createElement('div');
        fireItem.className = 'fire-item';
        
        // Format date
        let dateStr = 'Unknown Date';
        if (fire.properties.date) {
            const date = new Date(fire.properties.date);
            if (!isNaN(date)) {
                dateStr = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
            }
        }
        
        // Format time
        const timeStr = fire.properties.time ? ` at ${fire.properties.time}` : '';
        
        fireItem.innerHTML = `
            <h3>${fire.properties.locationName}</h3>
            <p>Detected: ${dateStr}${timeStr}</p>
            <p>Coordinates: ${fire.geometry.coordinates[1].toFixed(4)}, ${fire.geometry.coordinates[0].toFixed(4)}</p>
        `;
        
        // Add click event to fly to fire location and show popup
        fireItem.addEventListener('click', () => {
            const existingPopups = document.getElementsByClassName('mapboxgl-popup');
            if (existingPopups.length) {
                Array.from(existingPopups).forEach(popup => popup.remove());
            }

            map.flyTo({
                center: fire.geometry.coordinates,
                zoom: map.getZoom()
            });
            
            new mapboxgl.Popup()
                .setLngLat(fire.geometry.coordinates)
                .setHTML(fire.properties.popupContent)
                .addTo(map);
        });
        
        fireList.appendChild(fireItem);
    });
}

// Add event listeners for map movement to update fire list
map.on('moveend', updateFireList);
map.on('zoomend', updateFireList);

// Update the time filter event listener
document.getElementById('time-filter').addEventListener('change', () => {
    const timeFilter = parseInt(document.getElementById('time-filter').value);
    const currentDate = new Date();
    const cutoffDate = new Date(currentDate);
    cutoffDate.setHours(currentDate.getHours() - timeFilter);
    
    // Get the current features from the source
    const currentFeatures = map.querySourceFeatures('fires', {
        sourceLayer: 'fires'
    });
    
    // Filter features based on date and country
    const filteredFeatures = currentFeatures.filter(feature => {
        // Skip if no date property
        if (!feature.properties.date) return false;
        
        // Skip if unknown location
        if (feature.properties.country === 'Unknown Location') return false;
        
        // Parse the date string (format: YYYY-MM-DD)
        const [year, month, day] = feature.properties.date.split('-').map(Number);
        const featureDate = new Date(year, month - 1, day); // month is 0-based in JavaScript
        
        // Add time component if available
        if (feature.properties.time) {
            const [hours, minutes] = feature.properties.time.split(':');
            featureDate.setHours(parseInt(hours), parseInt(minutes));
        }
        
        // Compare dates
        return featureDate >= cutoffDate;
    });
    
    console.log(`Time filter: ${timeFilter} hours`);
    console.log(`Cutoff date: ${cutoffDate.toISOString()}`);
    console.log(`Total features before filtering: ${currentFeatures.length}`);
    console.log(`Features after filtering: ${filteredFeatures.length}`);
    
    // Update the map source with filtered features
    map.getSource('fires').setData({
        type: 'FeatureCollection',
        features: filteredFeatures
    });
    
    // Update the fire list
    updateFireList();
});

// Add after map initialization
let mapState = {
    center: [0, 20],
    zoom: 2
};

// Store map state before fullscreen
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        // Exiting fullscreen - restore map state
        map.flyTo({
            center: mapState.center,
            zoom: mapState.zoom,
            duration: 0
        });
    }
});

// Update map state before entering fullscreen
document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement) {
        // Exiting fullscreen - restore map state
        map.flyTo({
            center: mapState.center,
            zoom: mapState.zoom,
            duration: 0
        });
    }
});

// Store map state before entering fullscreen
document.addEventListener('webkitfullscreenchange', () => {
    if (document.webkitFullscreenElement) {
        // Store current map state before entering fullscreen
        mapState = {
            center: map.getCenter(),
            zoom: map.getZoom()
        };
    }
});

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        // Store current map state before entering fullscreen
        mapState = {
            center: map.getCenter(),
            zoom: map.getZoom()
        };
    }
});