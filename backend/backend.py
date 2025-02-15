from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from datetime import datetime, timedelta
import pytz
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.getenv("API_KEY"))

def generate_subtasks(task_name):
    response = client.models.generate_content(
        model="gemini-2.0-flash", 
        contents=f"Break down the task '{task_name}' into smaller steps with estimated completion times. Don't provide any extra sentences and explanation and formatting. Just give very brief subtask names and timeline."
    )

    subtasks = []
    plan_text = ''
    for line in response.text.split('\n'):
        if line.strip():
            parts = line.split(' - ')
            if len(parts) == 2:
                subtask_name = parts[0].strip()
                time_estimate = parts[1].strip()
                subtasks.append((subtask_name, time_estimate))
                plan_text += f"{subtask_name} - {time_estimate}\n"
    return plan_text, subtasks

@app.route('/generate_tasks', methods=['POST'])
def generate_tasks():
    data = request.json
    task_name = data.get("task_name")

    plan_text, subtasks = generate_subtasks(task_name)

    return jsonify({
        "plan": plan_text,
        "subtasks": subtasks
    })

def add_to_calendar(subtasks):
    start_time = datetime.now(pytz.utc)
    for subtask, time_estimate in subtasks:
        hours = int(time_estimate.split()[0])
        end_time = start_time + timedelta(hours=hours)

        print(f"Adding to calendar: {subtask} from {start_time} to {end_time}")

        start_time = end_time

@app.route('/add_to_calendar', methods=['POST'])
def add_to_calendar_endpoint():
    data = request.json
    subtasks = data.get("subtasks")

    add_to_calendar(subtasks)

    return jsonify({"message": "Subtasks added to calendar"})

if __name__ == '__main__':
    app.run(debug=True)
