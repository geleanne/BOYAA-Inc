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
    with open('officers.json', 'r') as f:
        officers = json.load(f)
    return jsonify(officers)

if __name__ == '__main__':
    app.run(debug=True, port=3000)