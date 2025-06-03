from flask import Flask, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder='.')

@app.route('/')
@app.route('/<path:path>')
def serve_static(path='index.html'):
    if os.path.exists(path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

@app.route('/api/officers')
def get_officers():
    # Get the directory of the current script (app.py)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    officers_json_path = os.path.join(base_dir, 'officers.json') # officers.json is in the same directory as app.py

    if not os.path.exists(officers_json_path):
        # Log an error or return a specific error message if the file is not found
        print(f"Error: officers.json not found at {officers_json_path}")
        return jsonify({"error": "Officer data file not found"}), 500

    try:
        with open(officers_json_path, 'r') as f:
            officers = json.load(f)
        return jsonify(officers)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {officers_json_path}")
        return jsonify({"error": "Error decoding officer data"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3000)