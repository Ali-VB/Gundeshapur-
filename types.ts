
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
}

export interface Book {
  row: number;
  id: string;
  title: string;
  author: string;
  isbn: string;
  dewey_decimal: string;
  publisher: string;
  publication_year: string;
  genre: string;
  total_copies: number;
  available_copies: number;
  cover_url: string;
  description: string;
  created_at: string;
}

export interface LibraryUser {
  row: number;
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  registration_date: string;
  is_active: boolean;
}

export interface Loan {
  row: number;
  id: string;
  book_id: string;
  user_id: string;
  book_title: string;
  user_name: string;
  loan_date: string;
  due_date: string;
  return_date: string;
  is_returned: boolean;
  overdue_days: number;
  fine_amount: number;
  created_at: string;
}

export type SheetData<T> = T[];

export enum Page {
  Dashboard = 'Dashboard',
  Books = 'Books',
  Users = 'Users',
  Loans = 'Loans',
  Admin = 'Admin',
}