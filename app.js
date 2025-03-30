// Mapbox access token
const mapboxAccessToken = 'pk.eyJ1IjoicnNhbmdleSIsImEiOiJjbTYybnd1Z2IxMjR3MmxvdThzMHRxejBjIn0.FHJ1aQP5xd0N0t5rg9F8oQ';

// NASA FIRMS API key
const nasaApiKey = '3acfaa87cc4834f8fd0edcfe416a533a';

// Initialize the Mapbox map
mapboxgl.accessToken = mapboxAccessToken;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [0, 20], // Center on a global view
    zoom: 2 // Zoom level for global view
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

// Function to fetch data for a specific country
async function fetchCountryData(country) {
    console.log(`Fetching data for ${country}...`);
    const today = getTodayDate();
    
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
    
    // Fetch data for the entire world
    const response = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${nasaApiKey}/VIIRS_SNPP_NRT/-180/-90/180/90/1/${today}`);
    
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

// Fetch wildfire data from NASA FIRMS API
async function fetchFireData() {
    try {
        console.log('Fetching data from NASA FIRMS API...');
        
        // Fetch global data
        let allFires = await fetchGlobalData();
        console.log('Global fires found:', allFires.length);

        // Fetch data for specific countries to ensure good coverage
        const countries = ['CAN', 'USA', 'AUS', 'RUS', 'BRA', 'ZAF']; // Added more countries for better coverage
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

        // Remove loading indicator
        document.body.removeChild(loadingIndicator);

        // Add markers for each fire
        let markersAdded = 0;
        uniqueFires.forEach(fire => {
            const latitude = parseFloat(fire.latitude);
            const longitude = parseFloat(fire.longitude);
            const confidence = fire.confidence;
            const date = fire.acq_date;
            const time = fire.acq_time;
            const satellite = fire.satellite;
            const country = fire.country_id;

            if (!isNaN(latitude) && !isNaN(longitude)) {
                console.log(`Adding marker at lat: ${latitude}, lon: ${longitude} in ${country}`);
                new mapboxgl.Marker({ color: 'red' })
                    .setLngLat([longitude, latitude])
                    .setPopup(
                        new mapboxgl.Popup().setHTML(
                            `<strong>Country:</strong> ${country}<br>
                             <strong>Satellite:</strong> ${satellite}<br>
                             <strong>Confidence:</strong> ${confidence}%<br>
                             <strong>Date:</strong> ${date}<br>
                             <strong>Time:</strong> ${time}`
                        )
                    )
                    .addTo(map);
                markersAdded++;
            }
        });

        console.log(`Total markers added to map: ${markersAdded}`);

    } catch (error) {
        console.error('Error fetching wildfire data:', error);
        document.body.removeChild(loadingIndicator);
        alert('Error loading wildfire data. Please try again later.');
    }
}

// Fetch data when the map loads
map.on('load', fetchFireData);