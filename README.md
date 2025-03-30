# WildCan - nwHacks Project 2025 - Real-time Wildfire Monitoring

As a team of first-year students at the University of British Columbia, hacking at our first major hackathon, we set out to create a project with real impact. After countless hours of hard work, determination, and many hours of sleep sacrificed, we are proud to present **WildCan!**

WildCan is a real-time wildfire monitoring application that provides up-to-date information about active wildfires across the globe. Built with modern web technologies, it offers an intuitive interface for tracking and analyzing wildfire data.

## Features

- **Real-Time Fire Detection**: Monitors active wildfires using NASA FIRMS satellite data
- **Interactive Map**: Powered by Mapbox GL JS, providing a detailed view of fire locations
- **Time-Based Filtering**: View fires from the last 24, 48, or 72 hours
- **Location Tracking**: Find your location on the map
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Active Fires Panel**: Detailed list of current wildfires with location information

## Technologies Used

- **Frontend**:
  - HTML5
  - CSS3 (with modern features like CSS Grid and Flexbox)
  - JavaScript (ES6+)
  - Mapbox GL JS for map visualization

- **Backend**:
  - Node.js
  - Express.js
  - MongoDB for data storage

- **APIs**:
  - NASA FIRMS API for wildfire data
  - Mapbox API for map services

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Mapbox access token
- NASA FIRMS API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd wildcan
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following:
   ```
   MAPBOX_ACCESS_TOKEN=your_mapbox_token
   NASA_API_KEY=your_nasa_api_key
   MONGODB_URI=your_mongodb_uri
   ```

4. Start the server:
   ```bash
   node server.js
   ```

5. Open the application in your web browser:
   ```
   http://localhost:3000
   ```

## Project Structure

```
wildcan/
├── assets/           # Static assets (images, icons)
├── public/           # Public files served by Express
├── server.js         # Express server setup
├── app.js           # Main application logic
├── styles.css       # Application styles
├── package.json     # Project dependencies
└── README.md        # Project documentation
```

## Contributing

We welcome contributions to improve WildCan. Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- NASA FIRMS for providing wildfire data
- Mapbox for map visualization services
- The open-source community for various tools and libraries used in this project

---

## Features
- **Real-Time Data Collection:** Monitors wildfire activity and provides up-to-date information.
- **Impact Radius Calculation:** Dynamically determines the potential impact of each fire.
- **Personalized Notifications:** Alerts users based on their location and proximity to active wildfires.
- **Donation Integration:** Includes a link to a wildfire relief fund for users who wish to contribute.

---

## Contribution
We welcome contributions from the community to improve WildCan. To get started:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request describing your changes.

---





