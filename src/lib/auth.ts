export type SessionRole =
  | "EMPLOYEE"
  | "TRAINING_MANAGER"
  | "SUPERVISOR"
  | "SAFETY_MANAGER"
  | "ADMIN"
  | "SUPER_ADMIN";

export type SessionUser = {
  id: string;
  databaseId?: string;
  name: string;
  department: string;
  role: SessionRole;
};

export type SessionContext = {
  user: SessionUser;
  permissions: string[];
};
