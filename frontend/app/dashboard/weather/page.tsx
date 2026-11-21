"use client";

import React, { useCallback, useState } from "react";
import {
  CloudSun,
  CloudRain,
  Cloud,
  Sun,
  CloudDrizzle,
  Wind,
  Droplets,
  MapPin,
  LocateFixed,
  Search,
  Loader2,
  Thermometer,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

interface WeatherData {
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    precipitation: number;
    rain: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    precipitation_probability: number[];
    precipitation: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
  };
}

function getWeatherInfo(code: number) {
  if (code === 0) return { label: "Clear Sky", Icon: Sun };
  if ([1, 2].includes(code)) return { label: "Partly Cloudy", Icon: CloudSun };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if ([45, 48].includes(code)) return { label: "Foggy", Icon: Cloud };
  if ([51, 53, 55, 56, 57].includes(code))
    return { label: "Drizzle", Icon: CloudDrizzle };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { label: "Rain", Icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { label: "Snow", Icon: Cloud };
  if ([95, 96, 99].includes(code))
    return { label: "Thunderstorm", Icon: CloudRain };

  return { label: "Weather", Icon: CloudSun };
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeather = useCallback(
    async (latitude: number, longitude: number, name: string) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/weather/forecast?latitude=${latitude}&longitude=${longitude}`,
        );

        if (!response.ok) {
          throw new Error(`Weather request failed (${response.status})`);
        }

        const result: WeatherData = await response.json();

        setWeather(result);
        setLocationName(name);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to fetch weather data.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const detectLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError("Your browser does not support location detection.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(
          position.coords.latitude,
          position.coords.longitude,
          "Your current location",
        );
      },
      (err) => {
        setLoading(false);
        setError(
          err.code === 1
            ? "Location permission denied. Search for your farm location instead."
            : "Could not detect your location. Please search for your farm.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const searchLocation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!search.trim()) return;

    setLoading(true);
    setError("");

    try {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");

      url.searchParams.set("name", search.trim());
      url.searchParams.set("count", "1");
      url.searchParams.set("language", "en");
      url.searchParams.set("format", "json");

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Location search failed.");
      }

      const result = await response.json();
      const place = result.results?.[0];

      if (!place) {
        throw new Error("Location not found. Try another city or village.");
      }

      await fetchWeather(
        place.latitude,
        place.longitude,
        [place.name, place.admin1, place.country].filter(Boolean).join(", "),
      );
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error ? err.message : "Unable to search location.",
      );
    }
  };

  const refreshWeather = () => {
    if (weather) {
      fetchWeather(
        weather.location.latitude,
        weather.location.longitude,
        locationName,
      );
    }
  };

  const current = weather?.current;
  const currentInfo = current ? getWeatherInfo(current.weather_code) : null;
  const CurrentIcon = currentInfo?.Icon || CloudSun;

  const next24Hours =
    weather?.hourly.precipitation_probability.slice(0, 24) || [];
  const maxRainChance = next24Hours.length ? Math.max(...next24Hours) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Weather Forecast
            </h1>
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              LIVE WEATHER
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Weather intelligence for your agricultural location.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={detectLocation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 disabled:opacity-50"
          >
            <LocateFixed className="w-4 h-4" />
            Use my location
          </button>

          <button
            onClick={refreshWeather}
            disabled={loading || !weather}
            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-40"
            title="Refresh weather"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Location Search */}
      <form onSubmit={searchLocation} className="flex gap-2">
        <div className="flex-1 flex items-center gap-3 px-4 rounded-xl bg-[#0f1712] border border-white/[0.08] focus-within:border-emerald-500/40">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your farm, village or city..."
            className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-600"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !search.trim()}
          className="px-5 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-12 text-emerald-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Fetching weather information...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !weather && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0f1712] p-12 text-center">
          <CloudSun className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Know your farm's weather</h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
            Detect your current location or search for your farm to see current
            conditions, rainfall probability and a seven-day forecast.
          </p>
        </div>
      )}

      {/* Weather Dashboard */}
      {!loading && weather && current && (
        <>
          {/* Current Weather */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl p-6 bg-gradient-to-br from-[#14251b] to-[#0b120e] border border-emerald-500/15">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-6">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {locationName}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-400">
                    Current temperature
                  </p>
                  <div className="text-6xl font-light tracking-tighter mt-2">
                    {Math.round(current.temperature_2m)}°
                    <span className="text-3xl text-zinc-400">C</span>
                  </div>
                  <p className="text-emerald-300 mt-2 font-medium">
                    {currentInfo?.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Feels like {Math.round(current.apparent_temperature)}°C
                  </p>
                </div>

                <CurrentIcon className="w-28 h-28 text-emerald-300" />
              </div>
            </div>

            {/* Rain */}
            <div className="rounded-2xl p-6 bg-[#0f1712] border border-white/[0.08]">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <CloudRain className="w-4 h-4 text-sky-400" />
                RAIN PROBABILITY
              </div>

              <div className="text-5xl font-light mt-8">
                {Math.round(maxRainChance)}%
              </div>

              <p className="text-xs text-zinc-500 mt-2">
                Highest predicted probability in the next 24 hours
              </p>

              <div className="mt-6 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-400"
                  style={{ width: `${maxRainChance}%` }}
                />
              </div>
            </div>
          </div>

          {/* Weather Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Humidity",
                value: `${current.relative_humidity_2m}%`,
                Icon: Droplets,
                color: "text-sky-400",
              },
              {
                label: "Wind Speed",
                value: `${current.wind_speed_10m} km/h`,
                Icon: Wind,
                color: "text-emerald-400",
              },
              {
                label: "Rainfall Now",
                value: `${current.precipitation} mm`,
                Icon: CloudRain,
                color: "text-blue-400",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="p-5 rounded-2xl bg-[#0f1712] border border-white/[0.08]"
              >
                <div className="flex items-center gap-3">
                  <metric.Icon className={`w-5 h-5 ${metric.color}`} />
                  <span className="text-xs text-zinc-400">{metric.label}</span>
                </div>
                <p className="text-2xl font-semibold mt-4">{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Seven Day Forecast */}
          <div className="rounded-2xl bg-[#0f1712] border border-white/[0.08] p-5">
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold">Seven-Day Forecast</h2>
            </div>

            <div className="space-y-2">
              {weather.daily.time.map((date, index) => {
                const info = getWeatherInfo(weather.daily.weather_code[index]);
                const DayIcon = info.Icon;

                return (
                  <div
                    key={date}
                    className="grid grid-cols-2 sm:grid-cols-5 items-center gap-3 py-3 border-b border-white/[0.05] last:border-0"
                  >
                    <span className="text-sm text-zinc-300">
                      {index === 0
                        ? "Today"
                        : new Date(`${date}T12:00:00`).toLocaleDateString(
                            "en-IN",
                            { weekday: "long" },
                          )}
                    </span>

                    <div className="flex items-center gap-2">
                      <DayIcon className="w-5 h-5 text-emerald-300" />
                      <span className="text-xs text-zinc-400">
                        {info.label}
                      </span>
                    </div>

                    <span className="text-xs text-sky-300">
                      <Droplets className="w-3 h-3 inline mr-1" />
                      {weather.daily.precipitation_probability_max[index]}%
                    </span>

                    <span className="text-xs text-zinc-400">
                      {weather.daily.precipitation_sum[index]} mm rain
                    </span>

                    <div className="text-sm font-medium text-right">
                      <span>
                        {Math.round(weather.daily.temperature_2m_max[index])}°
                      </span>
                      <span className="text-zinc-500 ml-2">
                        {Math.round(weather.daily.temperature_2m_min[index])}°
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between gap-2 text-[10px] text-zinc-500">
            <span>
              <Thermometer className="w-3 h-3 inline mr-1" />
              Temperatures displayed in Celsius
            </span>
            <span>Weather data provided by Open-Meteo</span>
          </div>
        </>
      )}
    </div>
  );
}
