// backend/user.ts

import { Role } from './permissions';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export function createUser(username: string, role: Role): User {
  // Implementation for creating a user
  const id = Math.floor(Math.random() * 1000); // Placeholder
  const newUser: User = { id, username, role };
  users.push(newUser);
  return newUser;
}

export function getUser(id: number): User | undefined {
  // Implementation for getting a user by ID
  return users.find(user => user.id === id);
}

export function updateUser(id: number, updates: Partial<User>): User | undefined {
  // Implementation for updating a user
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex === -1) {
    return undefined;
  }
  users[userIndex] = { ...users[userIndex], ...updates };
  return users[userIndex];
}

export function deleteUser(id: number): boolean {
  // Implementation for deleting a user
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex === -1) {
    return false;
  }
  users.splice(userIndex, 1);
  return true;
}

let users: User[] = [];
users.push({ id: 1, username: 'admin', role: Role.Manager });
