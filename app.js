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

// Function to convert date string to local time
function convertToLocalTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const totalMinutes = parseInt(timeStr);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        // Create date object in UTC
        const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
        
        // Get local time components
        const localHours = utcDate.getHours();
        const localMinutes = utcDate.getMinutes();
        
        // Format time
        const ampm = localHours >= 12 ? 'PM' : 'AM';
        const hour12 = localHours % 12 || 12;
        
        return `${hour12}:${localMinutes.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
        console.log('Error converting time:', error);
        return null;
    }
}

// Function to format time in 12-hour format
function formatTime(timeStr) {
    if (!timeStr) return null;
    
    try {
        const totalMinutes = parseInt(timeStr);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
        console.log('Error formatting time:', error);
        return null;
    }
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
    
    const headers = rows[0].split(',');
    const headerMap = new Map(headers.map((h, i) => [h, i]));
    const fires = [];
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;
        
        const values = row.split(',');
        const fire = {};
        
        // Only process required fields
        if (headerMap.has('latitude')) fire.latitude = values[headerMap.get('latitude')];
        if (headerMap.has('longitude')) fire.longitude = values[headerMap.get('longitude')];
        if (headerMap.has('acq_date')) fire.acq_date = values[headerMap.get('acq_date')];
        if (headerMap.has('acq_time')) fire.acq_time = values[headerMap.get('acq_time')];
        if (headerMap.has('country_id')) fire.country_id = values[headerMap.get('country_id')];
        if (headerMap.has('confidence')) fire.confidence = values[headerMap.get('confidence')];
        
        fires.push(fire);
    }
    
    return fires;
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
function areCoordinatesClose(coord1, coord2, threshold = 0.001) {
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;
    return Math.abs(lng1 - lng2) < threshold && Math.abs(lat1 - lat2) < threshold;
}

// Function to deduplicate fires based on proximity and exact matches
function deduplicateFires(fires) {
    const uniqueFires = [];
    const processedCoords = new Set();
    const processedDates = new Set();

    // First, sort fires by date (most recent first)
    fires.sort((a, b) => {
        if (!a.acq_date || !b.acq_date) return 0;
        return new Date(b.acq_date) - new Date(a.acq_date);
    });

    fires.forEach(fire => {
        const coords = [parseFloat(fire.longitude), parseFloat(fire.latitude)];
        const coordKey = coords.join(',');
        const dateKey = fire.acq_date;
        
        // Skip if we've already processed these exact coordinates and date
        if (processedCoords.has(coordKey) && processedDates.has(dateKey)) {
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
            processedDates.add(dateKey);
        }
    });

    return uniqueFires;
}

// Fetch wildfire data from NASA FIRMS API
async function fetchFireData() {
    let allFires = [];
    
    try {
        updateLoadingText('Fetching wildfire data...');
        console.log('Fetching data from multiple NASA FIRMS API sources...');
        
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
        
        // Process results, including rejected promises
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'fulfilled') {
                const countryFires = result.value;
                console.log(`Country ${countries[i]} fires:`, countryFires.length);
                if (countries[i] === 'CAN') {
                    console.log('Canada fires details:', countryFires);
                }
                allFires = allFires.concat(countryFires);
            } else {
                console.error(`Failed to fetch data for ${countries[i]}:`, result.reason);
            }
        }
        
        // Always fetch global data as a backup
        updateLoadingText('Fetching global wildfire data...');
        console.log("Fetching global data as backup");
        const globalFires = await Promise.race([
            fetchGlobalData(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout fetching global data')), 15000)
            )
        ]);
        
        // Combine country-specific and global data
        allFires = [...allFires, ...globalFires];
        
        console.log(`Total fires fetched: ${allFires.length}`);
        
        updateLoadingText('Processing wildfire data...');

        // Get the time filter value
        const timeFilter = parseInt(document.getElementById('time-filter').value);
        
        // Current date for filtering
        const currentDate = new Date();
        const cutoffDate = new Date(currentDate);
        cutoffDate.setHours(currentDate.getHours() - timeFilter);

        // Create a Map for deduplication
        const uniqueFiresMap = new Map();
        
        // Process and filter fires in a single pass
        const filteredFires = allFires.filter(fire => {
            // Skip if no valid date
            if (!fire.acq_date) return false;
            
            const fireDateParts = fire.acq_date.split('-');
            if (fireDateParts.length !== 3) return false;
            
            const fireDate = new Date(
                parseInt(fireDateParts[0]), 
                parseInt(fireDateParts[1]) - 1, 
                parseInt(fireDateParts[2])
            );
            
            // Add time component if available
            if (fire.acq_time && !isNaN(parseInt(fire.acq_time))) {
                const totalMinutes = parseInt(fire.acq_time);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                fireDate.setHours(hours, minutes);
            }
            
            // Check if fire is within time range
            if (fireDate < cutoffDate) return false;
            
            // Create unique key for deduplication
            const key = `${fire.latitude},${fire.longitude},${fire.acq_date},${fire.acq_time}`;
            
            // Skip if we've already seen this fire
            if (uniqueFiresMap.has(key)) return false;
            
            // Add to unique fires map
            uniqueFiresMap.set(key, fire);
            return true;
        });

        console.log(`Filtered fires by last ${timeFilter} hours:`, filteredFires.length);
        
        // Update the fire count in the UI
        document.getElementById('fireCount').textContent = filteredFires.length;
        
        // Populate the fire list
        const fireList = document.getElementById('fireList');
        fireList.innerHTML = '';
        
        if (filteredFires.length === 0) {
            // Display a message if no fires are found
            const noFiresMessage = document.createElement('div');
            noFiresMessage.className = 'no-fires-message';
            noFiresMessage.innerHTML = 'No fires detected in the selected time range.';
            fireList.appendChild(noFiresMessage);
        } else {
            // Sort fires by date (most recent first)
            filteredFires.sort((a, b) => {
                if (!a.acq_date || !b.acq_date) return 0;
                return new Date(b.acq_date) - new Date(a.acq_date);
            });
            
            // Filter out fires with unknown location and take first 50
            const displayFires = filteredFires
                .filter(fire => fire.country_id && fire.country_id !== 'Unknown Location')
                .slice(0, 50);
            
            // Create fire list items
            for (const fire of displayFires) {
                const fireItem = document.createElement('div');
                fireItem.className = 'fire-item';
                
                // Format location name
                const locationName = fire.country_id;
                
                // Format date
                let dateStr = 'Unknown Date';
                if (fire.acq_date) {
                    const date = new Date(fire.acq_date);
                    dateStr = date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                }
                
                // Format time
                const timeStr = fire.acq_time ? ` at ${formatTime(fire.acq_time)}` : '';
                
                fireItem.innerHTML = `
                    <h3>${locationName}</h3>
                    <p>Detected: ${dateStr}${timeStr}</p>
                    <p>Coordinates: ${parseFloat(fire.latitude).toFixed(4)}, ${parseFloat(fire.longitude).toFixed(4)}</p>
                `;
                
                // Add click event to fly to fire location
                fireItem.addEventListener('click', () => {
                    // Remove any existing popups
                    const existingPopups = document.getElementsByClassName('mapboxgl-popup');
                    if (existingPopups.length) {
                        Array.from(existingPopups).forEach(popup => popup.remove());
                    }

                    map.flyTo({
                        center: [parseFloat(fire.longitude), parseFloat(fire.latitude)],
                        zoom: map.getZoom()
                    });
                });
                
                fireList.appendChild(fireItem);
            }
        }

        // Convert fires to GeoJSON features
        const features = filteredFires.map(fire => ({
            type: 'Feature',
            properties: {
                country: fire.country_id,
                date: fire.acq_date,
                time: formatTime(fire.acq_time),
                confidence: fire.confidence,
                popupContent: `
                    <div class="popup-content">
                        <h3>${fire.country_id}</h3>
                        <p>Detected: ${fire.acq_date} at ${formatTime(fire.acq_time)}</p>
                        <p>Coordinates: ${parseFloat(fire.latitude).toFixed(4)}, ${parseFloat(fire.longitude).toFixed(4)}</p>
                    </div>
                `
            },
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(fire.longitude), parseFloat(fire.latitude)]
            }
        }));

        // Update the map source
        map.getSource('fires').setData({
            type: 'FeatureCollection',
            features: features
        });

        removeLoadingIndicator();
    } catch (error) {
        console.error('Error fetching fire data:', error);
        removeLoadingIndicator();
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
    const timeFilter = parseInt(document.getElementById('time-filter').value);
    
    // Get all features from the fires source
    const features = map.querySourceFeatures('fires', {
        sourceLayer: 'fires'
    });
    
    // Filter features within current map bounds and exclude clusters
    const visibleFires = features.filter(feature => {
        // Skip clusters
        if (feature.properties.cluster) {
            return false;
        }
        
        const [lng, lat] = feature.geometry.coordinates;
        return lng >= bounds.getWest() && 
               lng <= bounds.getEast() && 
               lat >= bounds.getSouth() && 
               lat <= bounds.getNorth();
    });
    
    // Deduplicate fires based on coordinates
    const uniqueFires = [];
    const processedCoords = new Set();
    
    visibleFires.forEach(fire => {
        const coords = fire.geometry.coordinates.join(',');
        if (!processedCoords.has(coords)) {
            uniqueFires.push(fire);
            processedCoords.add(coords);
        }
    });
    
    // Update fire count with unique fires
    document.getElementById('fireCount').textContent = uniqueFires.length;
    
    // Clear current list
    fireList.innerHTML = '';
    
    if (uniqueFires.length === 0) {
        const noFiresMessage = document.createElement('div');
        noFiresMessage.className = 'no-fires-message';
        noFiresMessage.innerHTML = 'No fires detected in the current view.';
        fireList.appendChild(noFiresMessage);
        return;
    }
    
    // Sort fires by date (most recent first)
    uniqueFires.sort((a, b) => {
        const dateA = a.properties.date ? new Date(a.properties.date) : new Date(0);
        const dateB = b.properties.date ? new Date(b.properties.date) : new Date(0);
        return dateB - dateA;
    });
    
    // Create fire list items
    uniqueFires.forEach(fire => {
        const fireItem = document.createElement('div');
        fireItem.className = 'fire-item';
        
        // Format location name
        const locationName = fire.properties.country;
        
        // Skip if no valid country
        if (!locationName) {
            return;
        }
        
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
            <h3>${locationName}</h3>
            <p>Detected: ${dateStr}${timeStr}</p>
            <p>Coordinates: ${fire.geometry.coordinates[1].toFixed(4)}, ${fire.geometry.coordinates[0].toFixed(4)}</p>
        `;
        
        // Add click event to fly to fire location and show popup
        fireItem.addEventListener('click', () => {
            // Remove any existing popups
            const existingPopups = document.getElementsByClassName('mapboxgl-popup');
            if (existingPopups.length) {
                Array.from(existingPopups).forEach(popup => popup.remove());
            }

            // Fly to the fire location
            map.flyTo({
                center: fire.geometry.coordinates,
                zoom: map.getZoom()
            });
            
            // Create and show popup
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