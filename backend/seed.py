"""Seed the curated solo-menu recommendation data.

Place details now come live from Google Places, so places are no longer seeded
(the `Place` table only holds thin reference rows created on demand). This seed
just populates the 8 solo-menu candidates that back `/recommendations/solo`,
mirroring `frontend/src/logic/soloMenuRecommendation.ts`. Run once: `python seed.py`.
"""
from database import Base, SessionLocal, engine
from models import MenuItem

# code, menu_name, venue_name, category, description, distance, distance_minutes,
# tags, solo_score, meal_slot
SEED_MENU_ITEMS = [
    ("sm1", "제육 한상", "소담한상", "restaurant",
     "혼자 먹기 좋은 한상 구성이라 부담 없이 든든해요.", "도보 6분", 6,
     ["한식", "든든함", "혼밥"], 82, "lunch"),
    ("sm2", "쇼유 라멘", "멘야 테이블", "restaurant",
     "바 좌석 위주라 빠르게 혼자 먹기 좋아요.", "도보 9분", 9,
     ["라멘", "빠른 식사", "혼밥"], 88, "dinner"),
    ("sm3", "떡볶이 세트", "오늘분식", "restaurant",
     "가볍게 한 끼 때우기 좋은 분식 메뉴예요.", "도보 4분", 4,
     ["분식", "가벼움", "혼밥"], 74, "snack"),
    ("sm4", "핸드드립", "브루 포인트", "cafe",
     "조용한 창가 자리에서 천천히 즐기기 좋아요.", "도보 4분", 4,
     ["커피", "조용함", "작업"], 79, "snack"),
    ("sm5", "딸기 케이크 세트", "라운드 디저트", "cafe",
     "디저트 한 판으로 기분 전환하기 좋아요.", "도보 8분", 8,
     ["디저트", "휴식", "혼밥"], 76, "snack"),
    ("sm6", "카페라떼 + 소금빵", "모닝 컵", "cafe",
     "짧게 들러 혼자 채우기 좋은 조합이에요.", "도보 5분", 5,
     ["라떼", "간단", "혼밥"], 81, "breakfast"),
    ("sm7", "생맥주 + 해물파전", "노을포차", "bar",
     "혼자 앉아 가볍게 한 잔하기 좋은 안주예요.", "도보 7분", 7,
     ["맥주", "안주", "가벼움"], 70, "dinner"),
    ("sm8", "레몬 하이볼", "바 테이블", "bar",
     "바 좌석에서 조용히 마시기 좋은 메뉴예요.", "도보 11분", 11,
     ["하이볼", "조용함", "혼밥"], 77, "late"),
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        menus_added = 0
        for (code, menu_name, venue, cat, desc, dist, dmin, tags,
             solo_score, slot) in SEED_MENU_ITEMS:
            if db.query(MenuItem).filter(MenuItem.code == code).first():
                continue
            db.add(MenuItem(
                code=code, menu_name=menu_name, venue_name=venue, category=cat,
                description=desc, distance=dist, distance_minutes=dmin, tags=tags,
                solo_score=solo_score, meal_slot=slot,
                place_id=None,  # places are Google-backed, not seeded
            ))
            menus_added += 1
        db.commit()

        print(f"Seeded {menus_added} menu items (skipped existing).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
