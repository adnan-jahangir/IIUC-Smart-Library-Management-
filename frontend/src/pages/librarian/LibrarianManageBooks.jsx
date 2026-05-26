import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

const LibrarianManageBooks = () => {
  const { user } = useAuthStore();
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [form, setForm] = useState({
    customId: '',
    title: '',
    author: '',
    department: 'CSE',
    isbn: '',
    category: '',
    totalCopies: 1,
    availableCopies: 1,
    image: ''
  });

  const authHeaders = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (dept) params.set('dept', dept);
      const res = await axios.get(`http://localhost:5000/api/books?${params.toString()}`);
      setBooks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch books');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 350);
    return () => clearTimeout(timer);
  }, [search, dept]);

  const stats = useMemo(() => {
    const totalTitles = books.length;
    const lowStock = books.filter((b) => Number(b.availableCopies || 0) <= 2).length;
    const outOfStock = books.filter((b) => Number(b.availableCopies || 0) <= 0).length;
    return { totalTitles, lowStock, outOfStock };
  }, [books]);

  const openCreateModal = () => {
    setEditingBook(null);
    setForm({
      customId: '',
      title: '',
      author: '',
      department: 'CSE',
      isbn: '',
      category: '',
      totalCopies: 1,
      availableCopies: 1,
      image: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setForm({
      customId: book.customId || '',
      title: book.title || '',
      author: book.author || '',
      department: book.department || 'CSE',
      isbn: book.isbn || '',
      category: book.category || '',
      totalCopies: Number(book.totalCopies || 0),
      availableCopies: Number(book.availableCopies || 0),
      image: book.image || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.token) {
      toast.error('Please login as librarian to manage books');
      return;
    }

    if (!form.customId || !form.title || !form.author || !form.department || !form.isbn) {
      toast.error('Please fill required fields');
      return;
    }

    if (Number(form.availableCopies) > Number(form.totalCopies)) {
      toast.error('Available copies cannot exceed total copies');
      return;
    }

    setIsSaving(true);
    const payload = {
      ...form,
      totalCopies: Number(form.totalCopies),
      availableCopies: Number(form.availableCopies)
    };

    try {
      if (editingBook?._id) {
        await axios.put(`http://localhost:5000/api/books/${editingBook._id}`, payload, { headers: authHeaders });
        toast.success('Book updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/books', payload, { headers: authHeaders });
        toast.success('Book created successfully');
      }
      setModalOpen(false);
      await fetchBooks();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save book');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (book) => {
    if (!user?.token) {
      toast.error('Please login as librarian to manage books');
      return;
    }

    const ok = window.confirm(`Delete "${book.title}" (${book.customId})?`);
    if (!ok) return;

    setDeletingId(book._id);
    try {
      await axios.delete(`http://localhost:5000/api/books/${book._id}`, { headers: authHeaders });
      toast.success('Book deleted successfully');
      await fetchBooks();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete book');
    } finally {
      setDeletingId(null);
    }
  };

  const departments = ['CSE', 'EEE', 'ETE', 'CCE', 'CIVIL', 'BBA', 'LAW', 'Pharmacy', 'ELL'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Inventory</h2>
          <p className="text-slate-500 mt-1">Track catalog availability and manage the collection.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm"
        >
          Add New Book
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Titles</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalTitles}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.lowStock}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Out of Stock</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.outOfStock}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, author, ISBN, custom ID"
            className="md:col-span-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading books...</div>
        ) : books.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No books found for the current filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Book</th>
                  <th className="text-left px-4 py-3 font-semibold">Department</th>
                  <th className="text-left px-4 py-3 font-semibold">ISBN</th>
                  <th className="text-left px-4 py-3 font-semibold">Availability</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{b.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{b.customId} | {b.author || 'Unknown Author'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{b.department || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{b.isbn || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        Number(b.availableCopies || 0) <= 0
                          ? 'bg-rose-100 text-rose-700'
                          : Number(b.availableCopies || 0) <= 2
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {b.availableCopies || 0} / {b.totalCopies || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(b)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(b)}
                          disabled={deletingId === b._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          {deletingId === b._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <form onSubmit={handleSave} className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">{editingBook ? 'Edit Book' : 'Add New Book'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-800">Close</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Custom ID *</label>
                <input value={form.customId} onChange={(e) => setForm((p) => ({ ...p, customId: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Department *</label>
                <select value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Author *</label>
                <input value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">ISBN *</label>
                <input value={form.isbn} onChange={(e) => setForm((p) => ({ ...p, isbn: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Category</label>
                <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Cover Image URL</label>
                <input value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Total Copies</label>
                <input type="number" min="0" value={form.totalCopies} onChange={(e) => setForm((p) => ({ ...p, totalCopies: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Available Copies</label>
                <input type="number" min="0" value={form.availableCopies} onChange={(e) => setForm((p) => ({ ...p, availableCopies: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={isSaving} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold disabled:opacity-60">
                {isSaving ? 'Saving...' : editingBook ? 'Update Book' : 'Create Book'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default LibrarianManageBooks;
