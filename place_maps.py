from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
import datetime

app = Flask(__name__)
CORS(app)

# MongoDB connection
mongo_uri = "mongodb+srv://nwhacksuser:nwhackspassword@nwhacks.nmgdk.mongodb.net/?retryWrites=true&w=majority&appName=nwhacks"
client = MongoClient(mongo_uri)
db = client['wildfires']

# Collections
users_collection = db['users']
coordinates_collection = db['coordinates']

@app.route('/add-user-data', methods=['POST'])
def add_user_data():
    """
    API endpoint to save user phone number and location with enhanced error logging.
    """
    try:
        # Log the incoming request
        app.logger.debug("Incoming request received.")

        # Parse the JSON body
        data = request.json
        app.logger.debug(f"Request JSON: {data}")

        # Validate the input data
        if data is None:
            app.logger.error("No JSON data received in request.")
            return jsonify({'error': "No JSON data received."}), 400

        phone = data.get('phoneNumber')
        location = data.get('location')

        if not phone:
            app.logger.error("Missing 'phoneNumber' in request.")
            return jsonify({'error': "'phoneNumber' is required."}), 400

        if not location:
            app.logger.error("Missing 'location' in request.")
            return jsonify({'error': "'location' is required."}), 400

        if not isinstance(location, dict) or 'latitude' not in location or 'longitude' not in location:
            app.logger.error(f"Invalid 'location' format: {location}")
            return jsonify({'error': "'location' must be a dictionary with 'latitude' and 'longitude'."}), 400

        # Insert data into the database
        result = users_collection.insert_one({
            'phone_number': phone,
            'location': {
                'latitude': location['latitude'],
                'longitude': location['longitude']
            },
            'timestamp': datetime.datetime.utcnow()
        })

        # Log the success and return a response
        app.logger.info(f"User data inserted with ID: {result.inserted_id}")
        return jsonify({'message': 'User data added successfully!', 'id': str(result.inserted_id)}), 201

    except Exception as e:
        # Log any unexpected errors
        app.logger.exception("An error occurred while processing the request.")
        return jsonify({'error': 'An internal server error occurred.', 'details': str(e)}), 500


@app.route('/api/fires', methods=['GET'])
def get_fires():
    """
    API endpoint to retrieve fire coordinates.
    """
    try:
        fire_data = [
            [doc['longitude'], doc['latitude']]
            for doc in coordinates_collection.find({}, {"_id": 0, "latitude": 1, "longitude": 1})
        ]
        return jsonify(fire_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

#------------------------------
