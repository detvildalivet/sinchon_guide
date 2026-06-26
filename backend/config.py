"""Runtime configuration loaded from environment / .env.

The server-side Google Maps key powers Places + Geocoding calls (see
services/google_places.py). Keep it in backend/.env (gitignored); never commit it.
"""
import os

from dotenv import load_dotenv

load_dotenv()

GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")

# Default search radius (metres) for nearby place lookups.
PLACES_DEFAULT_RADIUS_M: int = int(os.getenv("PLACES_DEFAULT_RADIUS_M", "900"))

# In-process cache TTL (seconds) for nearby/details responses, to limit billed calls.
PLACES_CACHE_TTL_S: int = int(os.getenv("PLACES_CACHE_TTL_S", "120"))
