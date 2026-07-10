import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FolderLock, Plus, Edit2, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import SkeletonLoader from '../../components/SkeletonLoader';
import ConfirmDialog from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Dialog triggers
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const triggerEdit = (cat) => {
    setEditingCategory(cat);
    setValue('name', cat.name);
    setValue('description', cat.description);
    setShowFormPanel(true);
  };

  const triggerCancel = () => {
    setEditingCategory(null);
    reset({ name: '', description: '' });
    setShowFormPanel(false);
  };

  const onSubmit = async (data) => {
    setBtnLoading(true);
    try {
      if (editingCategory) {
        // Edit category
        const response = await api.put(`/categories/${editingCategory._id}`, {
          name: data.name,
          description: data.description
        });
        if (response.data.success) {
          toast.success('Category updated successfully!');
          fetchCategories();
          triggerCancel();
        }
      } else {
        // Create new category
        const response = await api.post('/categories', {
          name: data.name,
          description: data.description
        });
        if (response.data.success) {
          toast.success('Category created successfully!');
          fetchCategories();
          triggerCancel();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    } finally {
      setBtnLoading(false);
    }
  };

  const triggerDeletePrompt = (cat) => {
    setCategoryToDelete(cat);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeleteConfirmOpen(false);

    try {
      const response = await api.delete(`/categories/${categoryToDelete._id}`);
      if (response.data.success) {
        setCategories(prev => prev.filter(c => c._id !== categoryToDelete._id));
        toast.success('Category removed successfully.');
      }
    } catch (err) {
      toast.error('Failed to delete category.');
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header and Toggle panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Manage Complaint Categories
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define, update, or remove classification categories for civic reporting.
          </p>
        </div>

        {!showFormPanel && (
          <button
            onClick={() => setShowFormPanel(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/10 transition-all"
          >
            <Plus className="h-4.5 w-4.5" /> Add New Category
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Add/Edit category Form */}
        {showFormPanel && (
          <div className="card-premium p-6 h-fit space-y-4 lg:col-span-1 border-t-4 border-t-brand-500 animate-in slide-in-from-left duration-250">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-base text-slate-800 dark:text-white flex items-center gap-1.5">
                <FolderLock className="h-5 w-5 text-brand-500" />
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button 
                onClick={triggerCancel}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-darkbg-700 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Category Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Category name is required' })}
                  className="mt-1.5 block w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 dark:bg-darkbg-700 text-slate-805 dark:text-white dark:border-slate-800 border-slate-200 focus-ring"
                  placeholder="e.g. Broken Pavement"
                />
                {errors.name && <span className="text-xs text-danger-550 mt-1 block">{errors.name.message}</span>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={3}
                  {...register('description')}
                  className="mt-1.5 block w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 dark:bg-darkbg-700 text-slate-805 dark:text-white dark:border-slate-800 border-slate-200 focus-ring"
                  placeholder="Summarize the types of issues linked to this category..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={triggerCancel}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-darkbg-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={btnLoading}
                  className="flex-1 py-2.5 rounded-xl font-semibold bg-brand-500 hover:bg-brand-600 text-white text-xs shadow transition-all flex items-center justify-center gap-1.5"
                >
                  {btnLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Right: Grid of categories */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-${showFormPanel ? '2' : '3'}`}>
          {loading ? (
            <SkeletonLoader count={4} />
          ) : categories.length === 0 ? (
            <div className="card-premium p-10 text-center text-xs text-slate-450 lg:col-span-3">
              No categories defined. Click 'Add New Category' to define the first one.
            </div>
          ) : (
            categories.map(cat => (
              <div 
                key={cat._id}
                className="card-premium p-5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-base text-slate-805 text-slate-800 dark:text-white">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-darkbg-700 px-2 py-0.5 rounded">
                      {cat.slug}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => triggerEdit(cat)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-darkbg-700 text-slate-500 hover:text-brand-500 transition-colors flex items-center gap-1 font-semibold"
                    title="Edit category info"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => triggerDeletePrompt(cat)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-danger-50 dark:hover:bg-danger-900/10 text-slate-500 hover:text-danger-550 hover:text-danger-500 transition-colors flex items-center gap-1 font-semibold"
                    title="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Dialog: Delete Category Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Category?"
        message={`Are you sure you want to permanently remove category: "${categoryToDelete?.name}"? Complaints assigned to this category will not be deleted, but category links may appear blank.`}
        confirmText="Yes, Delete Category"
        onConfirm={handleDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />

    </div>
  );
};

export default ManageCategories;
