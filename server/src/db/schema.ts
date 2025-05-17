import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

//#region Tables
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }).default('#000000').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type UserUpdate = Pick<User, 'id' | 'username' | 'email' | 'color'>;

export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type RoomInsert = typeof rooms.$inferInsert;
export type RoomUpdate = Pick<Room, 'id'> &
  Partial<Pick<Room, 'name' | 'description'>>;

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  roomId: uuid('room_id')
    .references(() => rooms.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type MessageInsert = typeof messages.$inferInsert;
export type MessageUpdate = Pick<Message, 'id' | 'content'>;
//#endregion

//#region Relations
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
}));

//#endregion
