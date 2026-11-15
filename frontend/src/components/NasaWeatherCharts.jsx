import React, { useState } from 'react';

/**
 * Monthly Rainfall Bar Chart (Pure Responsive SVG)
 */
export function MonthlyRainfallChart({ monthlyData, totalRainfall, metadata }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!monthlyData || monthlyData.length === 0) return null;

  const width = 680;
  const height = 260;
  const padLeft = 60;
  const padRight = 25;
  const padTop = 30;
  const padBottom = 45;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Find max precipitation to scale Y axis nicely
  const maxRain = Math.max(...monthlyData.map((d) => d.total_precipitation_mm || 0));
  const yMax = Math.ceil(maxRain / 100) * 100 || 500;
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const barW = Math.min(32, (chartW / monthlyData.length) * 0.65);
  const stepX = chartW / monthlyData.length;

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <div>
          <h4 className="chart-title">
            {metadata?.period_display_label ? `${metadata.period_display_label} Precipitation` : 'Monthly Precipitation'}
          </h4>
          <span className="chart-subtitle">Rainfall volume in millimeters (mm/month)</span>
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-box" style={{ background: 'linear-gradient(180deg, #52b788, #2d6a4f)' }}></span>
            Monthly Total
          </span>
          <span className="legend-item">
            <span className="legend-box" style={{ background: '#74c69d', border: '1px solid #1b4332' }}></span>
            Monsoon Peak
          </span>
        </div>
      </div>

      <div className="svg-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="responsive-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="barGradientNormal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#52b788" />
              <stop offset="100%" stopColor="#2d6a4f" />
            </linearGradient>
            <linearGradient id="barGradientPeak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#74c69d" />
              <stop offset="100%" stopColor="#1b4332" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((tickVal, i) => {
            const yPos = padTop + chartH - (tickVal / yMax) * chartH;
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={width - padRight}
                  y2={yPos}
                  stroke="#e5ede7"
                  strokeDasharray={tickVal === 0 ? 'none' : '3,3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#75887e"
                  fontWeight="500"
                >
                  {Math.round(tickVal)} mm
                </text>
              </g>
            );
          })}

          {/* Month Bars & X-Axis Labels */}
          {monthlyData.map((d, idx) => {
            const val = d.total_precipitation_mm || 0;
            const barH = (val / yMax) * chartH;
            const xPos = padLeft + idx * stepX + (stepX - barW) / 2;
            const yPos = padTop + chartH - barH;
            const isHovered = hoveredIdx === idx;
            // Monsoon months in Malnad: June (5), July (6), August (7)
            const isMonsoonPeak = idx >= 5 && idx <= 7;

            const shortMonth = d.month_name.slice(0, 3);

            return (
              <g
                key={d.month}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Invisible hover capture area */}
                <rect
                  x={padLeft + idx * stepX}
                  y={padTop}
                  width={stepX}
                  height={chartH}
                  fill="transparent"
                />

                {/* Bar */}
                <rect
                  x={xPos}
                  y={yPos}
                  width={barW}
                  height={Math.max(barH, 2)}
                  rx="4"
                  fill={isMonsoonPeak ? 'url(#barGradientPeak)' : 'url(#barGradientNormal)'}
                  opacity={hoveredIdx !== null && !isHovered ? 0.45 : 1}
                  stroke={isHovered ? '#132a20' : 'none'}
                  strokeWidth={isHovered ? '1.5' : '0'}
                  style={{ transition: 'opacity 0.2s ease, transform 0.2s ease' }}
                />

                {/* Value on top of bar if space permits or on hover */}
                {(isHovered || (val > 100 && chartH > 100)) && (
                  <text
                    x={xPos + barW / 2}
                    y={yPos - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#1b4332"
                    fontWeight="700"
                  >
                    {Math.round(val)}
                  </text>
                )}

                {/* X-Axis Month Label */}
                <text
                  x={xPos + barW / 2}
                  y={padTop + chartH + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isHovered ? '#1b4332' : '#586960'}
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {shortMonth}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {hoveredIdx !== null && (
          <div className="chart-tooltip">
            <strong>{monthlyData[hoveredIdx].month_name} ({monthlyData[hoveredIdx].month})</strong>
            <div>Total Rainfall: <span>{monthlyData[hoveredIdx].total_precipitation_mm} mm</span></div>
            {totalRainfall && (
              <div style={{ fontSize: '0.75rem', color: '#6d8e7e' }}>
                ({((monthlyData[hoveredIdx].total_precipitation_mm / totalRainfall) * 100).toFixed(1)}% of recorded total)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Monthly Temperature Profile Chart (Pure Responsive SVG)
 */
export function MonthlyTemperatureChart({ monthlyData, metadata }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!monthlyData || monthlyData.length === 0) return null;

  const width = 680;
  const height = 260;
  const padLeft = 55;
  const padRight = 25;
  const padTop = 30;
  const padBottom = 45;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Temperature ranges: Min ~12°C, Max ~42°C, scale from 10°C to 45°C
  const yMin = 10;
  const yMax = 45;
  const yRange = yMax - yMin;
  const yTicks = [10, 20, 30, 40];

  const stepX = chartW / (monthlyData.length - 1);

  const getY = (val) => padTop + chartH - ((val - yMin) / yRange) * chartH;
  const getX = (idx) => padLeft + idx * stepX;

  // Build SVG path strings
  const maxPoints = monthlyData.map((d, i) => `${getX(i)},${getY(d.avg_max_temperature_c)}`);
  const meanPoints = monthlyData.map((d, i) => `${getX(i)},${getY(d.avg_temperature_c)}`);
  const minPoints = monthlyData.map((d, i) => `${getX(i)},${getY(d.avg_min_temperature_c)}`);

  // Area band between Max and Min temperatures
  const reversedMinPoints = [...minPoints].reverse();
  const areaPath = `M ${maxPoints.join(' L ')} L ${reversedMinPoints.join(' L ')} Z`;

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <div>
          <h4 className="chart-title">
            {metadata?.period_display_label ? `${metadata.period_display_label} Temperature Progression` : 'Monthly Temperature Progression'}
          </h4>
          <span className="chart-subtitle">Monthly mean, daytime maximum & nighttime minimum (°C)</span>
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-line" style={{ background: '#d97706' }}></span>
            Avg Max
          </span>
          <span className="legend-item">
            <span className="legend-line" style={{ background: '#2d6a4f' }}></span>
            Mean
          </span>
          <span className="legend-item">
            <span className="legend-line" style={{ background: '#0284c7' }}></span>
            Avg Min
          </span>
        </div>
      </div>

      <div className="svg-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="responsive-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="tempAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((tickVal, i) => {
            const yPos = getY(tickVal);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={width - padRight}
                  y2={yPos}
                  stroke="#e5ede7"
                  strokeDasharray={i === 0 ? 'none' : '3,3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#75887e"
                  fontWeight="500"
                >
                  {tickVal}°C
                </text>
              </g>
            );
          })}

          {/* Diurnal Temperature Range Shaded Envelope */}
          <path d={areaPath} fill="url(#tempAreaGradient)" />

          {/* Lines */}
          <polyline
            fill="none"
            stroke="#d97706"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={maxPoints.join(' ')}
          />
          <polyline
            fill="none"
            stroke="#2d6a4f"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={meanPoints.join(' ')}
          />
          <polyline
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={minPoints.join(' ')}
          />

          {/* Data Points & Vertical Hover Bars */}
          {monthlyData.map((d, idx) => {
            const cx = getX(idx);
            const cyMax = getY(d.avg_max_temperature_c);
            const cyMean = getY(d.avg_temperature_c);
            const cyMin = getY(d.avg_min_temperature_c);
            const isHovered = hoveredIdx === idx;
            const shortMonth = d.month_name.slice(0, 3);

            return (
              <g
                key={d.month}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Vertical hover guide line */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + chartH}
                    stroke="#1b4332"
                    strokeDasharray="2,2"
                    strokeWidth="1"
                  />
                )}

                {/* Invisible hover hit area */}
                <rect
                  x={cx - stepX / 2}
                  y={padTop}
                  width={stepX}
                  height={chartH}
                  fill="transparent"
                />

                {/* Circle markers */}
                <circle cx={cx} cy={cyMax} r={isHovered ? 5 : 3.5} fill="#ffffff" stroke="#d97706" strokeWidth="2" />
                <circle cx={cx} cy={cyMean} r={isHovered ? 6 : 4} fill="#2d6a4f" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx={cx} cy={cyMin} r={isHovered ? 5 : 3.5} fill="#ffffff" stroke="#0284c7" strokeWidth="2" />

                {/* X-Axis Month Label */}
                <text
                  x={cx}
                  y={padTop + chartH + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isHovered ? '#1b4332' : '#586960'}
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {shortMonth}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {hoveredIdx !== null && (
          <div className="chart-tooltip">
            <strong>{monthlyData[hoveredIdx].month_name} ({monthlyData[hoveredIdx].month})</strong>
            <div>Daytime Max: <span style={{ color: '#d97706', fontWeight: 700 }}>{monthlyData[hoveredIdx].avg_max_temperature_c}°C</span></div>
            <div>Monthly Mean: <span style={{ color: '#2d6a4f', fontWeight: 700 }}>{monthlyData[hoveredIdx].avg_temperature_c}°C</span></div>
            <div>Nighttime Min: <span style={{ color: '#0284c7', fontWeight: 700 }}>{monthlyData[hoveredIdx].avg_min_temperature_c}°C</span></div>
            <div style={{ fontSize: '0.75rem', color: '#6d8e7e', marginTop: '2px' }}>
              Humidity: {monthlyData[hoveredIdx].avg_relative_humidity_pct}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Monthly Climatology Data Table
 */
export function MonthlyDataTable({ monthlyData, metadata }) {
  if (!monthlyData || monthlyData.length === 0) return null;

  return (
    <div className="data-table-card">
      <div className="data-table-header">
        <div>
          <h4 className="data-table-title">
            NASA POWER {metadata?.period_display_label ? `${metadata.period_display_label} Monthly Observations` : 'Monthly Observations Table'}
          </h4>
          <span className="data-table-subtitle">
            Aggregated from {metadata?.total_observations || monthlyData.reduce((acc, m) => acc + (m.days_recorded || 0), 0)} daily satellite-gauge assimilated records {metadata?.is_complete_year ? '(Full Year)' : '(Incomplete Year)'}
          </span>
        </div>
        <span className="badge-tag">{metadata?.assimilation_model || 'MERRA-2, GEOS-IT'}</span>
      </div>

      <div className="table-responsive-container">
        <table className="climatology-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Mean Temp (°C)</th>
              <th>Avg Max (°C)</th>
              <th>Avg Min (°C)</th>
              <th>Total Rainfall (mm)</th>
              <th>Relative Humidity (%)</th>
              <th>Recorded Days</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((row) => {
              // Highlight high rainfall monsoon months (> 100mm)
              const isHighRain = row.total_precipitation_mm > 100;
              return (
                <tr key={row.month} className={isHighRain ? 'monsoon-row' : ''}>
                  <td className="month-cell">
                    <strong>{row.month_name}</strong>
                    <span className="month-sub">{row.month}</span>
                  </td>
                  <td className="temp-val">{row.avg_temperature_c}°C</td>
                  <td className="temp-max-val">{row.avg_max_temperature_c}°C</td>
                  <td className="temp-min-val">{row.avg_min_temperature_c}°C</td>
                  <td className="rain-val">
                    <div className="rain-bar-cell">
                      <span>{row.total_precipitation_mm} mm</span>
                      <div
                        className="mini-bar"
                        style={{
                          width: `${Math.min(100, (row.total_precipitation_mm / 450) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </td>
                  <td>{row.avg_relative_humidity_pct}%</td>
                  <td className="days-cell">{row.days_recorded}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
