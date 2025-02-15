import React from 'react';
import Calendar from './components/Calendar';
import AddEventForm from './components/AddEventForm';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>CalendAi</h1>
      <AddEventForm />
      <Calendar />
    </div>
  );
}

export default App;