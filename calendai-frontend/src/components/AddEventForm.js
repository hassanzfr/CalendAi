import React, { useState } from 'react';
import '../App.css';

const AddEventForm = () => {
  const [summary, setSummary] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Send event data to the backend
    // Uncomment this when the backend is ready
    /*
    axios.post('http://localhost:5000/add-event', {
      summary,
      startDateTime,
      endDateTime,
    })
      .then(response => alert('Event added successfully!'))
      .catch(error => console.error(error));
    */

    // Mock success message for now
    alert('Event added successfully! (Mock)');
    setSummary('');
    setStartDateTime('');
    setEndDateTime('');
  };

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <h2>Add New Event</h2>
      <div>
        <label>Event Summary:</label>
        <input
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Start Date & Time:</label>
        <input
          type="datetime-local"
          value={startDateTime}
          onChange={(e) => setStartDateTime(e.target.value)}
          required
        />
      </div>
      <div>
        <label>End Date & Time:</label>
        <input
          type="datetime-local"
          value={endDateTime}
          onChange={(e) => setEndDateTime(e.target.value)}
          required
        />
      </div>
      <button type="submit">Add Event</button>
    </form>
  );
};

export default AddEventForm;