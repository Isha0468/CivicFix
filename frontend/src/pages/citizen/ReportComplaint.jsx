import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Image as ImageIcon, Sparkles, AlertTriangle, ArrowLeft, Loader2, X, AlertCircle, Search } from 'lucide-react';
import api from '../../services/api';
import ComplaintMap from '../../components/ComplaintMap';
import toast from 'react-hot-toast';
import axios from 'axios';

const ReportComplaint = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // AI & Duplicate states
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);
  const [duplicates, setDuplicates] = useState([]);

  // Location autocomplete search states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      severity: 'Medium',
      address: ''
    }
  });

  const titleVal = watch('title');
  const descriptionVal = watch('description');
  const categoryVal = watch('category');

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          setCategories(response.data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Trigger automated duplicate checking when coordinates and category are set
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!selectedLocation || !categoryVal) return;
      setDuplicateCheckLoading(true);
      try {
        const params = {
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude,
          radius: 150, // 150 meters
          category: categoryVal
        };
        const response = await api.get('/complaints', { params });
        if (response.data.success) {
          // Exclude resolved/closed/rejected complaints from active duplicates
          const activeDuplicates = response.data.complaints.filter(c => 
            !['Resolved', 'Closed', 'Rejected'].includes(c.status)
          );
          setDuplicates(activeDuplicates);
        }
      } catch (err) {
        console.error('Duplicate checking error:', err);
      } finally {
        setDuplicateCheckLoading(false);
      }
    };

    const delayDebounce = setTimeout(checkDuplicates, 800);
    return () => clearTimeout(delayDebounce);
  }, [selectedLocation, categoryVal]);

  // AI Predictor helper (runs client side for instantaneous UX, fallback queries server)
  const handleAiAssist = async () => {
    if (!titleVal && !descriptionVal) {
      toast.error('Please enter a title or description first.');
      return;
    }

    setAiAnalyzing(true);
    // Simulate smart thinking lag
    await new Promise(resolve => setTimeout(resolve, 800));

    const combinedText = `${titleVal} ${descriptionVal}`.toLowerCase();
    
    // Keyword categorization
    let predictedCatId = '';
    let predictedSeverity = 'Medium';

    // Simple keyword severity estimation
    if (combinedText.match(/sinkhole|fire|collapsed|wire|exposed|electric|gas leak|danger/)) {
      predictedSeverity = 'High';
    } else if (combinedText.match(/pothole|lamp|garbage|leak|stray|signal|branch|trash/)) {
      predictedSeverity = 'Medium';
    } else {
      predictedSeverity = 'Low';
    }

    // Match keywords to category names
    const match = categories.find(cat => {
      const name = cat.name.toLowerCase();
      if (name.includes('road') && combinedText.match(/pothole|road|asphalt/)) return true;
      if (name.includes('light') && combinedText.match(/light|lamp|bulb|dark/)) return true;
      if (name.includes('garbage') && combinedText.match(/garbage|trash|bin|waste/)) return true;
      if (name.includes('water') && combinedText.match(/water|leak|pipe/)) return true;
      if (name.includes('animal') && combinedText.match(/stray|dog|monkey|cat/)) return true;
      if (name.includes('signal') && combinedText.match(/signal|traffic|light/)) return true;
      if (name.includes('dumping') && combinedText.match(/dumping|debris|fly/)) return true;
      if (name.includes('tree') && combinedText.match(/tree|branch|limb/)) return true;
      if (name.includes('drain') && combinedText.match(/drain|sewer|clog/)) return true;
      return false;
    });

    if (match) {
      predictedCatId = match._id;
      setValue('category', match._id);
      toast.success(`AI suggested: "${match.name}" category!`);
    } else {
      // Find "Other" category
      const otherCat = categories.find(c => c.slug === 'other');
      if (otherCat) setValue('category', otherCat._id);
    }

    setValue('severity', predictedSeverity);

    // Fetch AI Suggestions from Mock endpoint for auto completion text templates
    if (match) {
      try {
        const response = await api.get(`/ai/suggestions?category=${match.slug}`);
        if (response.data.success) {
          setAiSuggestions(response.data.suggestions);
        }
      } catch (err) {
        console.error('Failed suggestions endpoint:', err);
      }
    }

    setAiAnalyzing(false);
    toast.success(`AI severity check complete: "${predictedSeverity}" priority.`);
  };

  const applySuggestion = (field) => {
    if (!aiSuggestions) return;
    if (field === 'title' && aiSuggestions.title) {
      setValue('title', aiSuggestions.title);
    }
    if (field === 'description' && aiSuggestions.description) {
      setValue('description', aiSuggestions.description);
    }
  };

  const handleLocationSelect = (loc) => {
    setSelectedLocation(loc);
    setValue('address', loc.address);
  };

  // Nominatim geocoding auto-complete side-effect
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      setNoResults(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      setNoResults(false);
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
          { headers: { 'User-Agent': 'CivicFixApp/1.0' } }
        );
        if (response.data && response.data.length > 0) {
          setSuggestions(response.data);
        } else {
          setSuggestions([]);
          setNoResults(true);
        }
      } catch (err) {
        console.error('Nominatim search error:', err);
        setSearchError('Failed to load location suggestions.');
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectSuggestion = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const loc = {
      latitude: lat,
      longitude: lon,
      address: place.display_name
    };
    setSelectedLocation(loc);
    setValue('address', place.display_name);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Check max count: 5
    if (images.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images.');
      return;
    }

    const validFiles = files.filter(file => {
      const isLt5M = file.size < 5 * 1024 * 1024;
      if (!isLt5M) toast.error(`"${file.name}" exceeds 5MB size limit.`);
      return isLt5M;
    });

    setImages(prev => [...prev, ...validFiles]);

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (!selectedLocation) {
      toast.error('Please drop a pin on the map to specify the location.');
      return;
    }

    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('severity', data.severity);
    formData.append('address', data.address);
    formData.append('latitude', selectedLocation.latitude);
    formData.append('longitude', selectedLocation.longitude);
    
    images.forEach(img => {
      formData.append('images', img);
    });

    try {
      const response = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Complaint submitted successfully!');
        navigate('/citizen/dashboard');
      }
    } catch (error) {
      console.error('Submission failed:', error);
      const msg = error.response?.data?.message || 'Failed to submit complaint. Please check inputs.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      <div>
        <Link 
          to="/citizen/dashboard" 
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 mb-4"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>
        <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
          Report a Civic Issue
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Provide accurate details and photos to help Municipal Officers resolve this issue quickly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Input Form Panel */}
        <div className="card-premium p-6 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Title / Short Summary
              </label>
              <input
                type="text"
                {...register('title', { required: 'Title is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
                className="mt-1.5 block w-full px-3.5 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring"
                placeholder="Briefly state the issue (e.g. Broken streetlight on Park street)"
              />
              {errors.title && <span className="text-xs text-danger-500 mt-1 block">{errors.title.message}</span>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Detailed Description
              </label>
              <textarea
                rows={4}
                {...register('description', { required: 'Description is required' })}
                className="mt-1.5 block w-full px-3.5 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring"
                placeholder="Provide details of the problem, landmark warnings, or safety concerns..."
              />
              {errors.description && <span className="text-xs text-danger-500 mt-1 block">{errors.description.message}</span>}
            </div>

            {/* AI triggers */}
            <div className="flex justify-between items-center bg-brand-50/40 dark:bg-brand-900/10 p-3.5 rounded-xl border border-brand-100/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-brand-500 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-700 dark:text-slate-300">AI Assistant Available</p>
                  <p className="text-[10px] text-slate-400">Suggests category, templates, & estimates severity.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={aiAnalyzing}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-brand-500 hover:bg-brand-655 hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {aiAnalyzing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                  </>
                ) : (
                  <>Analyze</>
                )}
              </button>
            </div>

            {aiSuggestions && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-darkbg-750 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <p className="font-semibold text-slate-750 dark:text-slate-300">AI Template Auto-Fills:</p>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => applySuggestion('title')}
                    className="flex-1 px-3 py-1.5 rounded bg-white dark:bg-darkbg-800 text-[10px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 font-medium"
                  >
                    Apply Title Suggestion
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applySuggestion('description')}
                    className="flex-1 px-3 py-1.5 rounded bg-white dark:bg-darkbg-800 text-[10px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 font-medium"
                  >
                    Apply Description Suggestion
                  </button>
                </div>
              </div>
            )}

            {/* Category & Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Category
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="mt-1.5 block w-full px-3 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring font-semibold"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {errors.category && <span className="text-xs text-danger-500 mt-1 block">{errors.category.message}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Severity
                </label>
                <select
                  {...register('severity')}
                  className="mt-1.5 block w-full px-3 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring font-semibold"
                >
                  <option value="Low">Low (Minor warning)</option>
                  <option value="Medium">Medium (Standard repair)</option>
                  <option value="High">High (Immediate hazard)</option>
                </select>
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Address Location Details
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  readOnly
                  {...register('address', { required: 'Please select coordinates on the map' })}
                  className="block w-full pl-9 pr-3 py-3 border rounded-xl text-sm bg-slate-100 dark:bg-darkbg-750/30 text-slate-600 dark:text-slate-400 dark:border-slate-850 border-slate-200 focus:outline-none cursor-not-allowed"
                  placeholder="Drop a pin on the map to auto-fill address"
                />
              </div>
              {errors.address && <span className="text-xs text-danger-500 mt-1 block">{errors.address.message}</span>}
            </div>

            {/* Image Uploads */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Upload Progress Photos (Max 5)
              </label>
              <div className="mt-1.5 flex flex-wrap gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative h-16 w-16 rounded-xl overflow-hidden shadow border border-slate-200 dark:border-slate-750 shrink-0">
                    <img src={preview} alt="upload preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-950"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {imagePreviews.length < 5 && (
                  <label className="h-16 w-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-500 rounded-xl cursor-pointer text-slate-400 hover:text-brand-500 transition-colors">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-[8px] font-bold mt-1 uppercase">Add</span>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submission button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50"
              >
                {submitting ? 'Uploading Complaint...' : 'File Official Report'}
              </button>
            </div>

          </form>
        </div>

        {/* Right: Map Selector and Duplicate Warning column */}
        <div className="space-y-6 flex flex-col h-full min-h-[500px]">
          
          {/* Location Search Input */}
          <div className="space-y-2 relative">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Search Location (Address, Landmark, Street)
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location to center map... (e.g. Central Park, NY)"
                className="w-full pl-9 pr-10 py-3 border rounded-xl text-xs bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring font-semibold"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              {searching && (
                <div className="absolute right-3.5 top-3.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-darkbg-800 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                {suggestions.map((place) => (
                  <button
                    key={place.place_id}
                    type="button"
                    onClick={() => handleSelectSuggestion(place)}
                    className="w-full text-left px-4 py-3 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-darkbg-700 transition-colors flex flex-col gap-0.5"
                  >
                    <span className="font-semibold truncate">{place.display_name.split(',')[0]}</span>
                    <span className="text-[10px] text-slate-405 text-slate-400 truncate">{place.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            {noResults && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-darkbg-800 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 text-center text-[10px] text-slate-400 font-medium">
                No locations found. Try checking spelling or search globally.
              </div>
            )}

            {searchError && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-darkbg-800 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 text-center text-xs text-danger-500 font-semibold">
                {searchError}
              </div>
            )}
          </div>

          <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 min-h-[300px]">
            <ComplaintMap 
              mode="select" 
              selectedLocation={selectedLocation} 
              onLocationSelect={handleLocationSelect}
            />
          </div>

          {/* Duplicate warnings panel */}
          {duplicateCheckLoading && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-850 flex items-center justify-center gap-2 text-xs text-slate-500 bg-white dark:bg-darkbg-800">
              <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
              Scanning for duplicate reports in this area...
            </div>
          )}

          {duplicates.length > 0 && (
            <div className="p-4 rounded-2xl bg-warning-500/10 border border-warning-500/20 text-slate-700 dark:text-slate-300 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-warning-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800 dark:text-white">Duplicate Detection Warning</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    We found **{duplicates.length}** active complaint(s) filed in this exact category within 150m.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-2 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Existing Reports:</p>
                <div className="max-h-24 overflow-y-auto space-y-1.5">
                  {duplicates.map(dup => (
                    <div key={dup._id} className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-darkbg-800 border border-slate-100 dark:border-slate-750 text-[10px]">
                      <span className="font-semibold text-slate-705 truncate w-2/3">{dup.title}</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/complaints/${dup._id}`)}
                        className="font-bold text-brand-500 hover:text-brand-655"
                      >
                        View & Upvote Instead
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ReportComplaint;
