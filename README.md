# Real-Time Weather Dashboard

A modern, responsive Weather Dashboard that fetches and displays live weather information using public REST APIs.

## Features

* Search weather by city name
* Display live temperature, humidity, and wind speed
* Fetch data using the Fetch API
* Use async/await for asynchronous JavaScript
* Process nested JSON data
* Display hourly and 7-day forecasts
* Handle network and API errors
* Responsive design for desktop and mobile
* Dynamic weather icons and weather conditions

## Technologies Used

* React
* TypeScript
* Vite
* HTML5
* CSS3
* JavaScript (ES6+)
* Fetch API
* RESTful APIs
* JSON
* Async/Await

## Weather API

This project uses the Open-Meteo public weather API.

* Geocoding API: https://geocoding-api.open-meteo.com/v1/search
* Weather API: https://api.open-meteo.com/v1/forecast

**No Gemini API key is required for this project.**

## Run Locally in VS Code

### Prerequisites

* Node.js
* npm
* Visual Studio Code

### 1. Open the Project

Open the project folder in Visual Studio Code.

### 2. Install Dependencies

Open the VS Code terminal and run:

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

### 4. Open the Website

Open the local URL displayed in the terminal.

Example:

```text
http://localhost:3000
```

If your terminal displays a different port, open that URL instead.

## Build for Production

```bash
npm run build
```

## Project Objective

This project demonstrates:

1. Asynchronous JavaScript programming.
2. Fetching data from RESTful APIs.
3. Using async/await.
4. Handling network and API errors.
5. Parsing nested JSON objects.
6. Dynamically rendering live weather data.
7. Implementing city-based search functionality.

## Expected Outcome

A fully functional real-time Weather Dashboard that displays accurate live weather metrics, including temperature, humidity, wind speed, and forecast information based on the selected city.

## Author

Govinda K T
