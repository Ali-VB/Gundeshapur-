
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppStateContext } from '../App';
import type { Book } from '../types';
import { getSheetData } from '../services/google';
import { SHEET_CONFIG, ICONS } from '../constants';
import Spinner from './common/Spinner';

const BooksPage: React.FC = () => {
  const { spreadsheetId } = useContext(AppStateContext);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      if (!spreadsheetId) return;
      setIsLoading(true);
      setError(null);
      try {
        const booksData = await getSheetData<Book>(spreadsheetId, SHEET_CONFIG.BOOKS.name, SHEET_CONFIG.BOOKS.headers);
        setBooks(booksData);
      } catch (err) {
        console.error(err);
        setError("Failed to load books. Please check your sheet and permissions.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, [spreadsheetId]);
  
  const filteredBooks = useMemo(() => {
    if (!searchTerm) return books;
    const lowercasedFilter = searchTerm.toLowerCase();
    return books.filter(book => 
      book.title?.toLowerCase().includes(lowercasedFilter) ||
      book.author?.toLowerCase().includes(lowercasedFilter) ||
      book.isbn?.toLowerCase().includes(lowercasedFilter)
    );
  }, [books, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Books</h1>
        <div className="relative">
          <input 
            type="text"
            placeholder="Search books..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {ICONS.SEARCH}
          </div>
        </div>
      </div>
      
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Title</th>
                <th scope="col" className="px-6 py-3">Author</th>
                <th scope="col" className="px-6 py-3">Genre</th>
                <th scope="col" className="px-6 py-3">ISBN</th>
                <th scope="col" className="px-6 py-3 text-center">Copies</th>
                <th scope="col" className="px-6 py-3 text-center">Available</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr key={book.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {book.title}
                  </th>
                  <td className="px-6 py-4">{book.author}</td>
                  <td className="px-6 py-4">{book.genre}</td>
                  <td className="px-6 py-4">{book.isbn}</td>
                  <td className="px-6 py-4 text-center">{book.total_copies}</td>
                  <td className="px-6 py-4 text-center">{book.available_copies}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-4">Loan</button>
                    <button className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBooks.length === 0 && <p className="p-4 text-center">No books found.</p>}
        </div>
      </div>
    </div>
  );
};

export default BooksPage;
