import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { adminSettings } from "@shared/schema";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  isAdmin(email: string | null | undefined): Promise<boolean>;
  getAdminPermissions(email: string | null | undefined): Promise<any>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async isAdmin(email: string | null | undefined): Promise<boolean> {
    if (!email) return false;
    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.adminUserId, email));
    return !!setting;
  }

  async getAdminPermissions(email: string | null | undefined): Promise<any> {
    if (!email) return null;
    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.adminUserId, email));
    return setting || null;
  }
}

export const authStorage = new AuthStorage();
