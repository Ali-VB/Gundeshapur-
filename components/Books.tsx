import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppStateContext } from '../App';
import type { Book, LibraryUser } from '../types';
import { getSheetData, appendRow, updateCell } from '../services/google';
import { SHEET_CONFIG, ICONS } from '../constants';
import Spinner from './common/Spinner';
import Modal from './common/Modal';

const BooksPage: React.FC = () => {
  const { spreadsheetId } = useContext(AppStateContext);
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<LibraryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Loan Form State
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  const fetchBooks = async () => {
    if (!spreadsheetId) return;
    setIsLoading(true);
    setError(null);
    try {
      const booksData = await getSheetData<Book>(spreadsheetId, SHEET_CONFIG.BOOKS.name, SHEET_CONFIG.BOOKS.headers);
      setBooks(booksData);
    } catch (err: any) {
      console.error(err);
      let message = "Failed to load books. Please check your sheet and permissions.";
      if (err?.result?.error?.message) {
        message = `Error from Google: ${err.result.error.message}. Please verify your Spreadsheet ID and permissions.`;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUsers = async () => {
     if (!spreadsheetId || users.length > 0) return;
      try {
        const usersData = await getSheetData<LibraryUser>(spreadsheetId, SHEET_CONFIG.USERS.name, SHEET_CONFIG.USERS.headers);
        setUsers(usersData);
      } catch (err) {
          console.error("Failed to fetch users for loan modal", err);
          setLoanError("Could not load users list.");
      }
  }

  useEffect(() => {
    fetchBooks();
  }, [spreadsheetId]);

  const handleViewClick = (book: Book) => {
    setSelectedBook(book);
    setIsViewModalOpen(true);
  };
  
  const handleLoanClick = (book: Book) => {
    if (book.available_copies < 1) {
        alert("No available copies to loan.");
        return;
    }
    setSelectedBook(book);
    setLoanError(null);
    setSelectedUserId('');
    setIsLoanModalOpen(true);
    fetchUsers();
  };
  
  const handleCloseModals = () => {
      setIsViewModalOpen(false);
      setIsLoanModalOpen(false);
      setSelectedBook(null);
  }

  const handleConfirmLoan = async () => {
    if (!selectedUserId || !selectedBook || !spreadsheetId) {
      setLoanError("Please select a user.");
      return;
    }

    setIsSubmittingLoan(true);
    setLoanError(null);
    
    try {
        const user = users.find(u => u.id === selectedUserId);
        if (!user) throw new Error("Selected user not found.");

        const loanDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(loanDate.getDate() + 14); // 2-week loan period

        const newLoanRow = [
          crypto.randomUUID(),
          selectedBook.id,
          user.id,
          selectedBook.title,
          `${user.first_name} ${user.last_name}`,
          loanDate.toLocaleDateString('en-CA'), // YYYY-MM-DD
          dueDate.toLocaleDateString('en-CA'), // YYYY-MM-DD
          '', // return_date
          'FALSE', // is_returned
          0, // overdue_days
          0, // fine_amount
          loanDate.toISOString(), // created_at
        ];
        
        // 1. Add new loan record
        await appendRow(spreadsheetId, SHEET_CONFIG.LOANS.name, newLoanRow);

        // 2. Decrement available copies
        const newAvailableCopies = selectedBook.available_copies - 1;
        const availableCopiesCell = `${SHEET_CONFIG.BOOKS.name}!J${selectedBook.row}`; // J is available_copies
        await updateCell(spreadsheetId, availableCopiesCell, newAvailableCopies);

        // 3. Success
        handleCloseModals();
        await fetchBooks(); // Refresh book list

    } catch (err: any) {
        console.error("Failed to create loan", err);
        let message = "An error occurred while creating the loan.";
        if (err?.result?.error?.message) {
            message = `Error from Google: ${err.result.error.message}`;
        }
        setLoanError(message);
    } finally {
        setIsSubmittingLoan(false);
    }
  }
  
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
      
      {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
      
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
                    <button onClick={() => handleLoanClick(book)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-4 disabled:text-gray-400 disabled:no-underline" disabled={book.available_copies < 1}>Loan</button>
                    <button onClick={() => handleViewClick(book)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBooks.length === 0 && !isLoading && <p className="p-4 text-center">No books found.</p>}
        </div>
      </div>
      
      {/* View Book Modal */}
      <Modal isOpen={isViewModalOpen} onClose={handleCloseModals} title={selectedBook?.title || 'Book Details'}>
        {selectedBook && (
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="flex gap-4">
                    {selectedBook.cover_url && <img src={selectedBook.cover_url} alt={selectedBook.title} className="w-24 h-36 object-cover rounded" />}
                    <div className="flex-1">
                        <p><strong>Author:</strong> {selectedBook.author}</p>
                        <p><strong>Genre:</strong> {selectedBook.genre}</p>
                        <p><strong>ISBN:</strong> {selectedBook.isbn}</p>
                        <p><strong>Publisher:</strong> {selectedBook.publisher} ({selectedBook.publication_year})</p>
                        <p><strong>Dewey Decimal:</strong> {selectedBook.dewey_decimal}</p>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-1">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto">{selectedBook.description || "No description available."}</p>
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={handleCloseModals} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300">Close</button>
                </div>
            </div>
        )}
      </Modal>

      {/* New Loan Modal */}
      <Modal isOpen={isLoanModalOpen} onClose={handleCloseModals} title={`Loan "${selectedBook?.title}"`}>
         <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">Select a user to loan this book to.</p>
            <div>
              <label htmlFor="user-select" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">User</label>
              <select 
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              >
                  <option value="" disabled>Select a user</option>
                  {users.filter(u => u.is_active).map(user => (
                      <option key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.email})</option>
                  ))}
              </select>
            </div>
            {loanError && <p className="text-red-500 text-sm">{loanError}</p>}
            <div className="flex justify-end items-center pt-4 gap-3">
              <button onClick={handleCloseModals} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
              <button onClick={handleConfirmLoan} disabled={isSubmittingLoan} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                {isSubmittingLoan && <Spinner />}
                Confirm Loan
              </button>
            </div>
         </div>
      </Modal>

    </div>
  );
};

export default BooksPage;