// App.js
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import Datetime from "react-datetime";
import moment from "moment";
import "react-calendar/dist/Calendar.css";
import "react-datetime/css/react-datetime.css";
import "./App.css";
import logo from "./logo.png";

function App() {
  const [taskName, setTaskName] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentTaskHeader, setCurrentTaskHeader] = useState("");

  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          console.log("Notification permission status:", permission);
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    };
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const savedReminders = localStorage.getItem("taskReminders");
    if (savedReminders) {
      setReminders(
        JSON.parse(savedReminders).map((reminder) => ({
          ...reminder,
          date: new Date(reminder.date),
          notified: reminder.notified || false,
        }))
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("taskReminders", JSON.stringify(reminders));
  }, [reminders]);

  const checkReminders = (showAll = false) => {
    const now = new Date();
    reminders.forEach((reminder) => {
      const reminderTime = new Date(reminder.date);
      if (!showAll) {
        const timeDiff = Math.abs(now - reminderTime) / (1000 * 60);
        if (!reminder.notified && now >= reminderTime && timeDiff <= 1) {
          showNotification(reminder);
          updateReminderNotificationStatus(reminder, reminderTime);
        }
      } else if (!reminder.notified && now >= reminderTime) {
        showNotification(reminder);
        updateReminderNotificationStatus(reminder, reminderTime);
      }
    });
  };

  const updateReminderNotificationStatus = (reminder, reminderTime) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.task === reminder.task &&
        new Date(r.date).getTime() === reminderTime.getTime()
          ? { ...r, notified: true }
          : r
      )
    );
  };

  useEffect(() => {
    checkReminders(false);
    const intervalId = setInterval(() => checkReminders(false), 5000);
    return () => clearInterval(intervalId);
  }, [reminders]);

  const showNotification = (reminder) => {
    if (!("Notification" in window)) {
      alert(`Task Reminder: ${reminder.header}\n${reminder.task}`);
      return;
    }

    if (Notification.permission === "granted") {
      try {
        const notification = new Notification(
          `Task Reminder: ${reminder.header}`,
          {
            body: `It's time for: ${reminder.task}\nDuration: ${reminder.duration}`,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            requireInteraction: true,
            silent: false,
            timestamp: new Date().getTime(),
          }
        );

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        const audio = new Audio("/notification-sound.mp3");
        audio.play().catch((e) => console.log("Error playing sound:", e));
      } catch (error) {
        alert(`Task Reminder: ${reminder.header}\n${reminder.task}`);
      }
    } else {
      alert(`Task Reminder: ${reminder.header}\n${reminder.task}`);
    }
  };

  const submitTask = async (e) => {
    if (e.key === "Enter" || e.type === "click") {
      if (!taskName) {
        alert("Please enter a task name.");
        return;
      }
      try {
        const response = await fetch(
          "https://stepwise.onrender.com/generate_tasks",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task_name: taskName }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const tasksWithHeader = data.subtasks.map((task) => ({
            ...task,
            header: taskName,
          }));
          setSubtasks(tasksWithHeader);
          setAllTasks(tasksWithHeader);
          setCurrentTaskHeader(taskName);
          setTaskName("");
        } else {
          alert("Error generating tasks. Please try again.");
        }
      } catch (error) {
        console.error(error);
        alert("Error generating tasks. Please try again.");
      }
    }
  };

  const openDateTimePicker = (task) => {
    setSelectedTask(task);
    setSelectedDateTime(new Date());
    setShowDateTimePicker(true);
  };

  const addAllTasksToCalendar = () => {
    setShowDateTimePicker(true);
    setSelectedTask("all");
  };

  const scheduleAllTasks = () => {
    let currentDateTime = new Date(selectedDateTime);
    const newReminders = subtasks.map((task) => {
      const duration = parseInt(task[1]);
      const reminder = {
        task: task[0],
        duration: task[1],
        date: new Date(currentDateTime),
        header: currentTaskHeader,
        notified: false,
        id: Date.now() + Math.random(),
      };

      currentDateTime = new Date(
        currentDateTime.getTime() + duration * 60 * 60 * 1000
      );
      return reminder;
    });

    setReminders((prev) => [...prev, ...newReminders]);
    generateCombinedICSFile(newReminders);
    setSubtasks([]);
    setShowDateTimePicker(false);
    setSelectedTask(null);
  };

  const addSingleTaskToCalendar = () => {
    if (!selectedTask) return;

    const newReminder = {
      task: selectedTask[0],
      duration: selectedTask[1],
      date: new Date(selectedDateTime),
      header: selectedTask.header,
      notified: false,
      id: Date.now(),
    };

    setReminders((prev) => [...prev, newReminder]);
    setSubtasks((prev) => prev.filter((task) => task[0] !== selectedTask[0]));
    generateICSFile(newReminder);
    setShowDateTimePicker(false);
    setSelectedTask(null);
  };

  const generateICSFile = (reminder) => {
    const startDateTime = moment(reminder.date).format("YYYYMMDDTHHmmss");
    const endDateTime = moment(reminder.date)
      .add(reminder.duration, "hours")
      .format("YYYYMMDDTHHmmss");

    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${reminder.header}: ${reminder.task}
DTSTART:${startDateTime}
DTEND:${endDateTime}
DESCRIPTION:${reminder.task}
END:VEVENT
END:VCALENDAR`;

    downloadICSFile(icsData, `${reminder.task}.ics`);
  };

  const generateCombinedICSFile = (reminders) => {
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Company//Your Product//EN\n`;

    reminders.forEach((reminder) => {
      const startDateTime = moment(reminder.date).format("YYYYMMDDTHHmmss");
      const endDateTime = moment(reminder.date)
        .add(reminder.duration, "hours")
        .format("YYYYMMDDTHHmmss");

      icsContent += `BEGIN:VEVENT
SUMMARY:${reminder.header}: ${reminder.task}
DTSTART:${startDateTime}
DTEND:${endDateTime}
DESCRIPTION:${reminder.task}
UID:${reminder.id}@yourapp.com
SEQUENCE:0
STATUS:CONFIRMED
END:VEVENT\n`;
    });

    icsContent += "END:VCALENDAR";
    downloadICSFile(icsContent, `${reminders[0].header}_tasks.ics`);
  };

  const downloadICSFile = (content, filename) => {
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <img src={logo} alt="StepWise Logo" className="logo" />
      </header>

      <div className="content">
        <div className="left-panel">
          <div className="calendar-section">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              className="calendar"
            />
          </div>
          <div className="reminders-section">
            <h3>Scheduled Tasks</h3>
            <div className="reminders-list">
              {reminders.map((reminder, index) => (
                <div key={index} className="reminder-item">
                  <p className="reminder-header">{reminder.header}</p>
                  <p className="reminder-task">{reminder.task}</p>
                  <p className="reminder-duration">{reminder.duration}</p>
                  <p className="reminder-date">
                    {moment(reminder.date).format("MMMM D, YYYY h:mm A")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="center-panel">
          <h1 className="main-heading">We Got a Plan For You</h1>
          <div className="search-container">
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyDown={submitTask}
              placeholder="Enter your project/task name"
              className="search-input"
            />
            <button onClick={submitTask} className="search-button">
              Plan It
            </button>
          </div>

          {subtasks.length > 0 && (
            <div className="subtasks-container">
              <h2 className="current-task-header">{currentTaskHeader}</h2>
              <div className="add-all-button-container">
                <button
                  onClick={addAllTasksToCalendar}
                  className="add-all-button"
                >
                  Add All Tasks to Calendar
                </button>
              </div>
              {subtasks.map((subtask, index) => (
                <div key={index} className="subtask-card">
                  <div className="subtask-content">
                    <p className="subtask-name">{subtask[0]}</p>
                    <p className="subtask-time">Estimated time: {subtask[1]}</p>
                  </div>
                  <button
                    className="calendar-button"
                    onClick={() => openDateTimePicker(subtask)}
                  >
                    Add to Calendar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="right-panel">
          <h3>All Steps</h3>
          <div className="all-tasks-list">
            {allTasks.map((task, index) => (
              <div key={index} className="all-task-item">
                <span className="task-number">{index + 1}.</span>
                <span className="task-name">{task[0]}</span>
                <span className="task-duration">{task[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDateTimePicker && (
        <div className="datetime-picker-modal">
          <div className="datetime-picker-content">
            <h3>Select Date and Time</h3>
            <Datetime
              value={selectedDateTime}
              onChange={(value) => setSelectedDateTime(value.toDate())}
              className="datetime-picker"
              inputProps={{
                placeholder: "Select date and time",
                readOnly: true,
              }}
              timeFormat="hh:mm A"
              dateFormat="MMMM D, YYYY"
              closeOnSelect={false}
            />
            <div className="datetime-picker-buttons">
              <button
                onClick={() =>
                  selectedTask === "all"
                    ? scheduleAllTasks()
                    : addSingleTaskToCalendar()
                }
                className="confirm-btn"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowDateTimePicker(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>&copy; 2025 StepWise. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
