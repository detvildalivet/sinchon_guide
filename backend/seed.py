"""Seed the exact data the TableMate frontend currently hardcodes.

Mirrors `frontend/src/components/FloatingPlacePins.tsx` (9 places) and
`frontend/src/logic/soloMenuRecommendation.ts` (8 menu candidates) so the app
renders identical content once wired to the API. Run once: `python seed.py`.
"""
from database import Base, SessionLocal, engine
from models import MenuItem, Place

# slug, name, place_type, meta, note, distance_minutes, menu_names, lat, lng
SEED_PLACES = [
    ("r1", "소담한상", "restaurant", "한식 · 6분", "든든한 점심으로 좋은 한상 메뉴", 6,
     ["제육 한상", "된장찌개", "불고기 정식"], 37.5551, 126.9361),
    ("r2", "멘야 테이블", "restaurant", "라멘 · 9분", "혼밥도 편한 바 좌석 중심", 9,
     ["쇼유 라멘", "차슈덮밥", "교자"], 37.5557, 126.9372),
    ("r3", "오늘분식", "restaurant", "분식 · 4분", "가볍게 나눠 먹기 좋은 분식집", 4,
     ["떡볶이", "김밥", "튀김 세트"], 37.5546, 126.9356),
    ("c1", "브루 포인트", "cafe", "커피 · 4분", "조용히 대화하기 좋은 창가 자리", 4,
     ["핸드드립", "바닐라 라떼", "크루아상"], 37.5559, 126.9368),
    ("c2", "라운드 디저트", "cafe", "디저트 · 8분", "케이크와 커피를 같이 고르기 좋음", 8,
     ["딸기 케이크", "아메리카노", "피낭시에"], 37.5563, 126.9352),
    ("c3", "모닝 컵", "cafe", "라떼 · 5분", "짧게 들르기 좋은 가까운 카페", 5,
     ["카페라떼", "소금빵", "콜드브루"], 37.5549, 126.9375),
    ("b1", "노을포차", "bar", "맥주 · 7분", "편하게 이야기하기 좋은 포차 분위기", 7,
     ["생맥주", "닭똥집", "해물파전"], 37.5554, 126.9358),
    ("b2", "바 테이블", "bar", "하이볼 · 11분", "가볍게 한 잔 하기 좋은 하이볼 바", 11,
     ["레몬 하이볼", "감바스", "프렌치프라이"], 37.5566, 126.9370),
    ("b3", "문라이트", "bar", "와인 · 9분", "조용한 와인 한 잔에 잘 맞는 곳", 9,
     ["하우스 와인", "치즈 플래터", "브루스케타"], 37.5560, 126.9363),
]

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
        places_added = 0
        for slug, name, ptype, meta, note, dmin, menu, lat, lng in SEED_PLACES:
            if db.query(Place).filter(Place.slug == slug).first():
                continue
            db.add(Place(
                slug=slug, name=name, place_type=ptype, meta=meta, note=note,
                distance_minutes=dmin, menu_names=menu, latitude=lat, longitude=lng,
                address="Sinchon-dong, Seoul",
            ))
            places_added += 1
        db.commit()

        menus_added = 0
        for (code, menu_name, venue, cat, desc, dist, dmin, tags,
             solo_score, slot) in SEED_MENU_ITEMS:
            if db.query(MenuItem).filter(MenuItem.code == code).first():
                continue
            place = db.query(Place).filter(Place.name == venue).first()
            db.add(MenuItem(
                code=code, menu_name=menu_name, venue_name=venue, category=cat,
                description=desc, distance=dist, distance_minutes=dmin, tags=tags,
                solo_score=solo_score, meal_slot=slot,
                place_id=place.id if place else None,
            ))
            menus_added += 1
        db.commit()

        print(
            f"Seeded {places_added} places and {menus_added} menu items "
            f"(skipped existing)."
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
