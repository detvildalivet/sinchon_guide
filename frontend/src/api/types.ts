// Shapes returned by the FastAPI backend.

// Note: the /users/me response (UserSelf) is NOT aliased to camelCase — it
// returns snake_case fields. Only id/email/nickname are used by the app.
export type ApiUser = {
  id: number;
  email: string;
  real_name: string;
  birth_date: string;
  nickname: string;
  created_at: string;
};
