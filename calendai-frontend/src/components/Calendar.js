import React, { useState, useEffect } from 'react';
import '../App.css';

const Calendar = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch calendar events from the backend
    // Uncomment this when the backend is ready
    /*
    axios.get('http://localhost:5000/calendar-events')
      .then(response => setEvents(response.data))
      .catch(error => console.error(error));
    */

    // Mock data for now
    const mockEvents = [
      {
        id: 1,
        summary: 'Team Meeting',
        start: { dateTime: '2023-10-15T09:00:00' },
        end: { dateTime: '2023-10-15T10:00:00' },
      },
      {
        id: 2,
        summary: 'Lunch Break',
        start: { dateTime: '2023-10-15T12:00:00' },
        end: { dateTime: '2023-10-15T13:00:00' },
      },
    ];
    setEvents(mockEvents);
  }, []);

  return (
    <div>
      <h2>Calendar Events</h2>
      <ul>
        {events.map(event => (
          <li key={event.id}>
            <strong>{event.summary}</strong>
            <p>
              {new Date(event.start.dateTime).toLocaleString()} -{' '}
              {new Date(event.end.dateTime).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Calendar;