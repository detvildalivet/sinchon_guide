"""Seed a few well-known Sinchon places. Run once: `python seed.py`."""
from database import Base, SessionLocal, engine
from models import Place

SEED_PLACES = [
    {"name": "Cocaine Coffee", "latitude": 37.5550, "longitude": 126.9365,
     "address": "Sinchon-dong, Seoul", "place_type": "cafe"},
    {"name": "Really Good Pasta", "latitude": 37.5552, "longitude": 126.9370,
     "address": "Sinchon-dong, Seoul", "place_type": "restaurant"},
    {"name": "Sinchon Beer House", "latitude": 37.5560, "longitude": 126.9360,
     "address": "Sinchon-dong, Seoul", "place_type": "bar"},
    {"name": "Yonsei Cafe", "latitude": 37.5658, "longitude": 126.9386,
     "address": "Yonsei-ro, Seoul", "place_type": "cafe"},
    {"name": "Hongdae Galbi", "latitude": 37.5545, "longitude": 126.9355,
     "address": "Sinchon-ro, Seoul", "place_type": "restaurant"},
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        added = 0
        for data in SEED_PLACES:
            exists = db.query(Place).filter(Place.name == data["name"]).first()
            if exists:
                continue
            db.add(Place(**data))
            added += 1
        db.commit()
        print(f"Seeded {added} new places (skipped {len(SEED_PLACES) - added} duplicates).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
