import { jsPDF } from 'jspdf';
import { ProcessedWeatherData, TemperatureUnit, ComparisonWeather } from '../types';
import {
  formatTemp,
  toFahrenheit,
  getWeatherCondition,
  getWindDirectionCardinal,
  getUvCategory,
  calculateTempDelta,
} from '../utils/weatherCodes';

/**
 * Sanitizes a string for filenames
 */
function sanitizeFileName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Triggers client-side browser download for generated file
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates an ASCII/Plain Text Offline Weather Report (.txt)
 */
export function downloadTextReport(
  data: ProcessedWeatherData,
  unit: TemperatureUnit,
  comparisonWeather?: ComparisonWeather | null
): void {
  const { location, current, daily, alerts } = data;
  const condition = getWeatherCondition(current.weatherCode, current.isDay);
  const now = new Date();
  const generatedAt = now.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });
  const todayForecast = daily[0];

  const tempC = current.temperature;
  const tempF = toFahrenheit(tempC);
  const apparentC = current.apparentTemperature;
  const apparentF = toFahrenheit(apparentC);

  const cityName = location.name;
  const regionParts = [location.name, location.admin1, location.country].filter(Boolean).join(', ');

  const separator = '======================================================================';
  const subSeparator = '----------------------------------------------------------------------';

  let txt = `${separator}\n`;
  txt += `           WEATHERPULSE - OFFLINE WEATHER SUMMARY REPORT           \n`;
  txt += `${separator}\n\n`;

  txt += `LOCATION:       ${regionParts}\n`;
  txt += `COORDINATES:    ${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E\n`;
  txt += `LOCAL TIME:     ${current.localTime}\n`;
  txt += `REPORT DATE:    ${generatedAt}\n`;
  txt += `DATA SOURCE:    Open-Meteo REST API (Offline Snapshot)\n\n`;

  txt += `${subSeparator}\n`;
  txt += `[1] CURRENT CONDITIONS\n`;
  txt += `${subSeparator}\n`;
  txt += `Condition:      ${condition.description} (${current.isDay ? 'Daytime' : 'Nighttime'})\n`;
  txt += `Temperature:    ${formatTemp(tempC, unit)}  (Celsius: ${Math.round(tempC)}°C | Fahrenheit: ${Math.round(tempF)}°F)\n`;
  txt += `Feels Like:     ${formatTemp(apparentC, unit)}  (Celsius: ${Math.round(apparentC)}°C | Fahrenheit: ${Math.round(apparentF)}°F)\n`;
  if (todayForecast) {
    txt += `Today's Range:  Min ${formatTemp(todayForecast.tempMin, unit)} | Max ${formatTemp(todayForecast.tempMax, unit)}\n`;
  }
  txt += `Sunrise:        ${current.formattedSunrise || todayForecast?.formattedSunrise || 'N/A'}\n`;
  txt += `Sunset:         ${current.formattedSunset || todayForecast?.formattedSunset || 'N/A'}\n`;
  txt += `Daylight Span:  ${current.daylightDuration || todayForecast?.daylightDuration || 'N/A'}\n\n`;

  txt += `${subSeparator}\n`;
  txt += `[2] ATMOSPHERIC & ENVIRONMENTAL METRICS\n`;
  txt += `${subSeparator}\n`;
  txt += `Relative Humidity:      ${current.humidity}%\n`;
  txt += `Wind Speed:             ${current.windSpeed} km/h  (${getWindDirectionCardinal(current.windDirection)})\n`;
  if (current.windGusts !== undefined) {
    txt += `Wind Gusts:             ${current.windGusts} km/h\n`;
  }
  txt += `Atmospheric Pressure:   ${current.pressure} hPa\n`;
  txt += `Cloud Cover:            ${current.cloudCover}%\n`;
  txt += `Precipitation:          ${current.precipitation} mm\n`;
  if (todayForecast?.uvIndexMax !== undefined) {
    const uvInfo = getUvCategory(todayForecast.uvIndexMax);
    txt += `Maximum UV Index:       ${todayForecast.uvIndexMax} (${uvInfo.label})\n`;
  }
  txt += `\n`;

  // Secondary City Comparison (if active)
  if (comparisonWeather) {
    const delta = calculateTempDelta(current.temperature, comparisonWeather.temperature, unit);
    const compParts = [comparisonWeather.location.name, comparisonWeather.location.country].filter(Boolean).join(', ');
    txt += `${subSeparator}\n`;
    txt += `[3] TEMPERATURE COMPARISON ANALYSIS\n`;
    txt += `${subSeparator}\n`;
    txt += `Primary City:       ${cityName} [${formatTemp(current.temperature, unit)}]\n`;
    txt += `Comparison City:    ${compParts} [${formatTemp(comparisonWeather.temperature, unit)}]\n`;
    txt += `Temperature Delta:  ${delta.formattedDelta}\n`;
    txt += `Evaluation:         ${cityName} is ${delta.isWarmer ? `${delta.absDeltaStr} warmer` : delta.isCooler ? `${delta.absDeltaStr} cooler` : 'identical in temperature'} compared to ${comparisonWeather.location.name}.\n\n`;
  }

  // Weather Alerts section
  txt += `${subSeparator}\n`;
  txt += `[4] WEATHER ALERTS & WARNINGS\n`;
  txt += `${subSeparator}\n`;
  if (alerts && alerts.length > 0) {
    alerts.forEach((alert, idx) => {
      txt += `Alert #${idx + 1}: ${alert.event.toUpperCase()} [Severity: ${alert.severity.toUpperCase()}]\n`;
      txt += `Headline: ${alert.headline}\n`;
      txt += `Instruction: ${alert.instruction}\n`;
      if (alert.metricTrigger) {
        txt += `Trigger: ${alert.metricTrigger.label} reached ${alert.metricTrigger.value} (Threshold: ${alert.metricTrigger.threshold})\n`;
      }
      txt += `\n`;
    });
  } else {
    txt += `No severe weather advisories or warnings currently active for ${cityName}.\n\n`;
  }

  // 7-Day Extended Forecast Table
  txt += `${subSeparator}\n`;
  txt += `[5] 7-DAY EXTENDED FORECAST\n`;
  txt += `${subSeparator}\n`;
  txt += `Date         | Day        | Weather Condition          | Low / High Temp   | Precip %\n`;
  txt += `-------------+------------+----------------------------+-------------------+---------\n`;

  daily.forEach((item) => {
    const itemCond = getWeatherCondition(item.weatherCode, true);
    const dateStr = item.date.padEnd(12);
    const dayStr = item.dayName.padEnd(10);
    const condStr = itemCond.description.slice(0, 26).padEnd(26);
    const tempStr = `${formatTemp(item.tempMin, unit)} / ${formatTemp(item.tempMax, unit)}`.padEnd(17);
    const rainStr = `${item.precipitationProbability ?? 0}%`.padStart(8);
    txt += `${dateStr} | ${dayStr} | ${condStr} | ${tempStr} | ${rainStr}\n`;
  });

  txt += `\n${separator}\n`;
  txt += `Generated for offline consultation by WeatherPulse.\n`;
  txt += `Weather data verified via Open-Meteo REST API.\n`;
  txt += `${separator}\n`;

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const filename = `weather-report-${sanitizeFileName(cityName)}-${now.toISOString().slice(0, 10)}.txt`;
  triggerDownload(blob, filename);
}

/**
 * Generates an elegant, printable PDF Offline Weather Report (.pdf)
 */
export function downloadPdfReport(
  data: ProcessedWeatherData,
  unit: TemperatureUnit,
  comparisonWeather?: ComparisonWeather | null
): void {
  const { location, current, daily, alerts } = data;
  const condition = getWeatherCondition(current.weatherCode, current.isDay);
  const now = new Date();
  const dateStamp = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStamp = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const todayForecast = daily[0];

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // 1. Top Header Banner
  doc.setFillColor(14, 116, 144); // Cyan / Sky 700
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('WEATHERPULSE', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('OFFLINE WEATHER SUMMARY REPORT', margin, 18);

  doc.setFontSize(8);
  doc.text(`Generated: ${dateStamp} ${timeStamp}`, pageWidth - margin, 12, { align: 'right' });
  doc.text('Source: Open-Meteo REST API', pageWidth - margin, 18, { align: 'right' });

  cursorY = 32;

  // 2. City Title & Coordinates Bar
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const fullCityText = [location.name, location.admin1, location.country].filter(Boolean).join(', ');
  doc.text(fullCityText, margin, cursorY);

  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(
    `Coordinates: ${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E   |   Local Time: ${current.localTime}`,
    margin,
    cursorY
  );

  cursorY += 6;

  // 3. Current Weather Box & Atmospheric Metrics (2-column layout)
  const boxHeight = 44;
  const colWidth = (contentWidth - 6) / 2;

  // Left Box: Current Temperature & Condition
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, cursorY, colWidth, boxHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(14, 116, 144); // Sky 700
  doc.text('CURRENT CONDITIONS', margin + 4, cursorY + 7);

  // Big Temperature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(formatTemp(current.temperature, unit), margin + 4, cursorY + 20);

  // Condition description
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(condition.description, margin + 4, cursorY + 27);

  // Feels like & range
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Feels like ${formatTemp(current.apparentTemperature, unit)}`, margin + 4, cursorY + 34);
  if (todayForecast) {
    doc.text(
      `Today's Range: High ${formatTemp(todayForecast.tempMax, unit)}  |  Low ${formatTemp(todayForecast.tempMin, unit)}`,
      margin + 4,
      cursorY + 39
    );
  }

  // Right Box: Atmospheric Measurements & Solar Info
  const rightColX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightColX, cursorY, colWidth, boxHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(14, 116, 144);
  doc.text('ATMOSPHERIC & SOLAR METRICS', rightColX + 4, cursorY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const metricsLeft = [
    `Humidity: ${current.humidity}%`,
    `Wind: ${current.windSpeed} km/h (${getWindDirectionCardinal(current.windDirection)})`,
    `Pressure: ${current.pressure} hPa`,
  ];
  const metricsRight = [
    `Precipitation: ${current.precipitation} mm`,
    `Sunrise: ${current.formattedSunrise || todayForecast?.formattedSunrise || 'N/A'}`,
    `Sunset: ${current.formattedSunset || todayForecast?.formattedSunset || 'N/A'}`,
  ];

  metricsLeft.forEach((m, idx) => {
    doc.text(m, rightColX + 4, cursorY + 16 + idx * 8);
  });
  metricsRight.forEach((m, idx) => {
    doc.text(m, rightColX + colWidth / 2, cursorY + 16 + idx * 8);
  });

  cursorY += boxHeight + 6;

  // 4. Comparison City Section (if present)
  if (comparisonWeather) {
    const delta = calculateTempDelta(current.temperature, comparisonWeather.temperature, unit);
    const compBoxHeight = 18;

    doc.setFillColor(delta.isWarmer ? 254 : delta.isCooler ? 240 : 236, delta.isWarmer ? 243 : delta.isCooler ? 249 : 253, delta.isWarmer ? 199 : delta.isCooler ? 255 : 245);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, cursorY, contentWidth, compBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `TEMPERATURE COMPARISON: ${location.name} (${formatTemp(current.temperature, unit)}) vs. ${comparisonWeather.location.name} (${formatTemp(comparisonWeather.temperature, unit)})`,
      margin + 4,
      cursorY + 6
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(
      `Temperature Delta: ${delta.formattedDelta}  -  ${location.name} is ${
        delta.isWarmer ? `${delta.absDeltaStr} warmer` : delta.isCooler ? `${delta.absDeltaStr} cooler` : 'at the same temperature'
      } compared to ${comparisonWeather.location.name}.`,
      margin + 4,
      cursorY + 12
    );

    cursorY += compBoxHeight + 6;
  }

  // 5. Severe Weather Alerts Section (if active)
  if (alerts && alerts.length > 0) {
    const alertBoxHeight = 18;
    doc.setFillColor(254, 242, 242); // Light red
    doc.setDrawColor(248, 113, 113);
    doc.roundedRect(margin, cursorY, contentWidth, alertBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28); // Red 700
    doc.text(`ACTIVE ALERT: ${alerts[0].event.toUpperCase()} (${alerts[0].severity.toUpperCase()})`, margin + 4, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(127, 29, 29);
    doc.text(alerts[0].instruction.slice(0, 110), margin + 4, cursorY + 12);

    cursorY += alertBoxHeight + 6;
  }

  // 6. 7-Day Extended Forecast Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('7-DAY EXTENDED FORECAST', margin, cursorY);
  cursorY += 4;

  // Table Header
  const tableX = margin;
  const colWidths = [24, 26, 60, 42, 30]; // Sums to 182mm (contentWidth)
  const headerHeight = 7;

  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(203, 213, 225);
  doc.rect(tableX, cursorY, contentWidth, headerHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  let curX = tableX;
  const headers = ['Date', 'Day', 'Condition', 'Min / Max Temp', 'Rain Prob.'];
  headers.forEach((h, i) => {
    doc.text(h, curX + 3, cursorY + 5);
    curX += colWidths[i];
  });

  cursorY += headerHeight;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const rowHeight = 7;

  daily.slice(0, 7).forEach((item, idx) => {
    const isAlt = idx % 2 === 1;
    if (isAlt) {
      doc.setFillColor(248, 250, 252);
      doc.rect(tableX, cursorY, contentWidth, rowHeight, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(tableX, cursorY + rowHeight, tableX + contentWidth, cursorY + rowHeight);

    const itemCond = getWeatherCondition(item.weatherCode, true);
    doc.setTextColor(15, 23, 42);

    let rowX = tableX;
    // Date
    doc.text(item.date, rowX + 3, cursorY + 5);
    rowX += colWidths[0];

    // Day
    doc.text(item.dayName, rowX + 3, cursorY + 5);
    rowX += colWidths[1];

    // Condition
    doc.text(itemCond.description.slice(0, 32), rowX + 3, cursorY + 5);
    rowX += colWidths[2];

    // Temp range
    doc.text(
      `${formatTemp(item.tempMin, unit)} / ${formatTemp(item.tempMax, unit)}`,
      rowX + 3,
      cursorY + 5
    );
    rowX += colWidths[3];

    // Rain prob
    doc.text(`${item.precipitationProbability ?? 0}%`, rowX + 3, cursorY + 5);

    cursorY += rowHeight;
  });

  cursorY += 12;

  // 7. Footer Note & Offline Assurance
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(
    'This summary is formatted for offline viewing and printing. Real-time data provided by Open-Meteo REST Weather APIs.',
    margin,
    cursorY
  );
  doc.text('WeatherPulse Dashboard', pageWidth - margin, cursorY, { align: 'right' });

  const filename = `weather-summary-${sanitizeFileName(location.name)}-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
