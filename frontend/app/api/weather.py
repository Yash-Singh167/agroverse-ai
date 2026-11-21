
from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter(
    prefix="/api/weather",
    tags=["Weather"]
)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


@router.get("/forecast")
async def get_weather_forecast(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
):
    """
    Get current weather, rain probability and 7-day forecast.
    Uses Open-Meteo. No API key required.
    """

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "rain",
            "showers",
            "weather_code",
            "wind_speed_10m",
        ],
        "hourly": [
            "precipitation_probability",
            "precipitation",
            "rain",
        ],
        "daily": [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
            "precipitation_sum",
            "rain_sum",
            "sunrise",
            "sunset",
        ],
        "timezone": "auto",
        "forecast_days": 7,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                OPEN_METEO_URL,
                params=params
            )
            response.raise_for_status()
            data = response.json()

        return {
            "location": {
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "timezone": data["timezone"],
            },
            "current": data.get("current", {}),
            "hourly": data.get("hourly", {}),
            "daily": data.get("daily", {}),
            "units": {
                "current": data.get("current_units", {}),
                "hourly": data.get("hourly_units", {}),
                "daily": data.get("daily_units", {}),
            },
        }

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Weather provider timed out. Please try again."
        )

    except httpx.HTTPStatusError:
        raise HTTPException(
            status_code=502,
            detail="Weather provider returned an error."
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to weather provider."
        )
