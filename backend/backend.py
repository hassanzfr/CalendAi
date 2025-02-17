# Backend (app.py)
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from datetime import datetime, timedelta
import pytz
import os
import re
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.getenv("API_KEY"))

@app.route('/')
def home():
    return "Welcome to CalendAI" 

def generate_subtasks(task_name):
    response = client.models.generate_content(
        model="gemini-2.0-flash", 
        contents=f"Break down the task '{task_name}' into major steps with estimated completion times. Don't provide any extra sentences and explanation and formatting(bullets, bold, italic, extra characters etc). Just give very brief subtask names and allocated time duration in Days, hours or minutes(1 Hour, 2 Hours, 3o Minutes, 45 Minutes etc) separated by colon"
    )

    cleaned_text = re.sub(r'[*•]+', '', response.text)
    cleaned_text = re.sub(r'\*\*+', '', cleaned_text)
    cleaned_text = cleaned_text.strip()
    subtasks = []
    for line in response.text.split('\n'):
        line = line.strip()
        if line and ':' in line:
            parts = line.split(':', 1)
            subtask_name = parts[0].strip().lstrip('*').strip()
            time_estimate = parts[1].strip()
            time_estimate = re.sub(r'[^0-9\.DaysHoursMinutes]+', ' ', time_estimate).strip()
            subtasks.append((subtask_name, time_estimate))
    return subtasks

@app.route('/generate_tasks', methods=['POST'])
def generate_tasks():
    data = request.json
    task_name = data.get("task_name")
    subtasks = generate_subtasks(task_name)
    return jsonify({"subtasks": subtasks})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv("PORT", 5000)), debug=True)