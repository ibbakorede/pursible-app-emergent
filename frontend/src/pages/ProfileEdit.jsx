import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Shield, Calendar, Globe, MapPin, AlertCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentine", 
  "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", 
  "Bangladeshi", "Barbadian", "Belarusian", "Belgian", "Belizean", "Beninese", 
  "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", 
  "Bulgarian", "Burkinabe", "Burmese", "Burundian", "Cambodian", "Cameroonian", 
  "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", 
  "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", 
  "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican", "Dutch", "Ecuadorian", 
  "Egyptian", "Emirati", "English", "Equatorial Guinean", "Eritrean", "Estonian", 
  "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese", "Gambian", 
  "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinean", 
  "Guyanese", "Haitian", "Honduran", "Hungarian", "Icelandic", "Indian", 
  "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", 
  "Jamaican", "Japanese", "Jordanian", "Kazakh", "Kenyan", "Kuwaiti", "Kyrgyz", 
  "Laotian", "Latvian", "Lebanese", "Liberian", "Libyan", "Lithuanian", 
  "Luxembourgish", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivian", 
  "Malian", "Maltese", "Mauritanian", "Mauritian", "Mexican", "Moldovan", 
  "Monacan", "Mongolian", "Montenegrin", "Moroccan", "Mozambican", "Namibian", 
  "Nepalese", "New Zealand", "Nicaraguan", "Nigerian", "Nigerien", "North Korean", 
  "Norwegian", "Omani", "Pakistani", "Panamanian", "Papua New Guinean", 
  "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", 
  "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan", "Saudi", 
  "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", 
  "Singaporean", "Slovak", "Slovenian", "Somali", "South African", "South Korean", 
  "Spanish", "Sri Lankan", "Sudanese", "Surinamese", "Swazi", "Swedish", "Swiss", 
  "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", 
  "Trinidadian", "Tunisian", "Turkish", "Turkmen", "Ugandan", "Ukrainian", 
  "Uruguayan", "Uzbek", "Venezuelan", "Vietnamese", "Welsh", "Yemeni", "Zambian", 
  "Zimbabwean"
];

export default function ProfileEdit() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => { 
      setUser(u); 
      setForm({
        full_name: u?.full_name || '',
        date_of_birth: u?.date_of_birth || '',
        nationality: u?.nationality || '',
        address: u?.address || '',
        phone: u?.phone || ''
      });
    });
  }, []);

  // Validate name - only letters, spaces, and hyphens allowed
  const validateNameCharacters = (value) => {
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    return nameRegex.test(value);
  };

  // Validate phone - only numbers allowed
  const validatePhoneCharacters = (value) => {
    const phoneRegex = /^[0-9+\s]+$/;
    return phoneRegex.test(value);
  };

  // Handle name input with validation
  const handleNameChange = (e) => {
    const value = e.target.value;
    
    // Allow empty value (for clearing)
    if (value === '') {
      setForm({ ...form, full_name: value });
      return;
    }
    
    // Check if the new character is valid
    if (!validateNameCharacters(value)) {
      toast.error('Name can only contain letters, spaces, and hyphens', {
        id: 'name-validation',
        duration: 2000
      });
      return;
    }
    
    setForm({ ...form, full_name: value });
  };

  // Handle phone input with validation
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    
    // Allow empty value (for clearing)
    if (value === '') {
      setForm({ ...form, phone: value });
      return;
    }
    
    // Check if the new character is valid
    if (!validatePhoneCharacters(value)) {
      toast.error('Phone number can only contain numbers', {
        id: 'phone-validation',
        duration: 2000
      });
      return;
    }
    
    setForm({ ...form, phone: value });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.full_name.trim()) {
      newErrors.full_name = 'Full legal name is required';
    } else if (form.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    } else if (!validateNameCharacters(form.full_name)) {
      newErrors.full_name = 'Name can only contain letters, spaces, and hyphens';
    }
    
    if (!form.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const dob = new Date(form.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18) {
        newErrors.date_of_birth = 'You must be at least 18 years old';
      }
    }
    
    if (!form.nationality) {
      newErrors.nationality = 'Nationality is required';
    }
    
    if (!form.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (form.address.trim().length < 10) {
      newErrors.address = 'Please enter a complete address';
    }

    // Phone is optional but if provided, must be valid
    if (form.phone && !validatePhoneCharacters(form.phone)) {
      newErrors.phone = 'Phone number can only contain numbers';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleSave = async () => {
    // Mark all fields as touched
    setTouched({
      full_name: true,
      date_of_birth: true,
      nationality: true,
      address: true
    });

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await base44.auth.updateMe(form);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error('Failed to save profile: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  
  const isFormValid = form.full_name.trim() && form.date_of_birth && form.nationality && form.address.trim();

  // Calculate max date (must be 18+ years old)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Personal Information</h1>
            <p className="text-xs text-muted-foreground">Update your profile details</p>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex justify-center py-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-xl">
              <span className="text-3xl font-bold text-white">{initials}</span>
            </div>
          </div>
        </div>

        {/* Required Fields Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Required Information</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory and must be completed before you can proceed.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 bg-muted/30 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile Details</p>
          </div>
          <div className="p-5 space-y-5">
            {/* Full Legal Name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> 
                Full Legal Name 
                <span className="text-red-500 font-bold">*</span>
              </label>
              <Input
                value={form.full_name}
                onChange={handleNameChange}
                onBlur={() => handleBlur('full_name')}
                placeholder="Enter your full legal name (letters and hyphens only)"
                className={`rounded-xl ${touched.full_name && errors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <p className="text-xs text-muted-foreground mt-1">Only letters, spaces, and hyphens allowed</p>
              {touched.full_name && errors.full_name && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.full_name}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> 
                Date of Birth 
                <span className="text-red-500 font-bold">*</span>
              </label>
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                onBlur={() => handleBlur('date_of_birth')}
                max={maxDateStr}
                className={`rounded-xl ${touched.date_of_birth && errors.date_of_birth ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {touched.date_of_birth && errors.date_of_birth && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.date_of_birth}
                </p>
              )}
            </div>

            {/* Nationality */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> 
                Nationality 
                <span className="text-red-500 font-bold">*</span>
              </label>
              <Select 
                value={form.nationality} 
                onValueChange={(value) => {
                  setForm({ ...form, nationality: value });
                  setTouched(prev => ({ ...prev, nationality: true }));
                  // Clear nationality error immediately when selected
                  setErrors(prev => ({ ...prev, nationality: undefined }));
                }}
              >
                <SelectTrigger className={`rounded-xl ${touched.nationality && errors.nationality ? 'border-red-500 focus:ring-red-500' : ''}`}>
                  <SelectValue placeholder="Select your nationality" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {NATIONALITIES.map(nationality => (
                    <SelectItem key={nationality} value={nationality}>
                      {nationality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched.nationality && errors.nationality && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.nationality}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 
                Address 
                <span className="text-red-500 font-bold">*</span>
              </label>
              <textarea
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                onBlur={() => handleBlur('address')}
                placeholder="Enter your full residential address"
                rows={3}
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring ${touched.address && errors.address ? 'border-red-500 focus:ring-red-500' : 'border-input'}`}
              />
              {touched.address && errors.address && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.address}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> 
                Phone Number
              </label>
              <Input
                value={form.phone}
                onChange={handlePhoneChange}
                onBlur={() => handleBlur('phone')}
                placeholder="Enter your phone number (numbers only)"
                className={`rounded-xl ${touched.phone && errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <p className="text-xs text-muted-foreground mt-1">Only numbers allowed</p>
              {touched.phone && errors.phone && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.phone}
                </p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <Input value={user?.email || ''} disabled className="rounded-xl opacity-60 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            {/* Account Role (read-only) */}
            {user?.role && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Account Role
                </label>
                <Input value={user?.role || ''} disabled className="rounded-xl opacity-60 cursor-not-allowed capitalize" />
              </div>
            )}
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving || !isFormValid} 
          className="w-full rounded-xl h-12 text-base font-semibold"
        >
          {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
        </Button>

        {!isFormValid && (
          <p className="text-xs text-center text-muted-foreground">
            Please complete all required fields to save your profile
          </p>
        )}
      </div>
    </div>
  );
}
