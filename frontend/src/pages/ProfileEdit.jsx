import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ProfileFormFields from './profile-edit/ProfileFormFields';
import ProfileReadOnlyFields from './profile-edit/ProfileReadOnlyFields';

const validateNameCharacters = (v) => /^[a-zA-Z\s\-']+$/.test(v);
const validatePhoneCharacters = (v) => /^[0-9+\s]+$/.test(v);

export default function ProfileEdit() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ full_name: '', date_of_birth: '', nationality: '', address: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setForm({
        full_name: u?.full_name || '',
        date_of_birth: u?.date_of_birth || '',
        nationality: u?.nationality || '',
        address: u?.address || '',
        phone: u?.phone || '',
      });
    });
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.full_name.trim()) newErrors.full_name = 'Full legal name is required';
    else if (form.full_name.trim().length < 2) newErrors.full_name = 'Name must be at least 2 characters';
    else if (!validateNameCharacters(form.full_name)) newErrors.full_name = 'Name can only contain letters, spaces, and hyphens';

    if (!form.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    else {
      const age = new Date().getFullYear() - new Date(form.date_of_birth).getFullYear();
      if (age < 18) newErrors.date_of_birth = 'You must be at least 18 years old';
    }
    if (!form.nationality) newErrors.nationality = 'Nationality is required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    else if (form.address.trim().length < 10) newErrors.address = 'Please enter a complete address';
    if (form.phone && !validatePhoneCharacters(form.phone)) newErrors.phone = 'Phone number can only contain numbers';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value === '' || validateNameCharacters(value)) {
      setForm({ ...form, full_name: value });
    } else {
      toast.error('Name can only contain letters, spaces, and hyphens', { id: 'name-validation', duration: 2000 });
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (value === '' || validatePhoneCharacters(value)) {
      setForm({ ...form, phone: value });
    } else {
      toast.error('Phone number can only contain numbers', { id: 'phone-validation', duration: 2000 });
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleNationalityChange = (value) => {
    setForm({ ...form, nationality: value });
    setTouched((prev) => ({ ...prev, nationality: true }));
    setErrors((prev) => ({ ...prev, nationality: undefined }));
  };

  const handleSave = async () => {
    setTouched({ full_name: true, date_of_birth: true, nationality: true, address: true });
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

  const initials = user?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const isFormValid = form.full_name.trim() && form.date_of_birth && form.nationality && form.address.trim();
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
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-xl">
            <span className="text-3xl font-bold text-white">{initials}</span>
          </div>
        </div>

        {/* Required Fields Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Required Information</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 bg-muted/30 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile Details</p>
          </div>
          <div className="p-5 space-y-5">
            <ProfileFormFields
              form={form}
              errors={errors}
              touched={touched}
              maxDateStr={maxDateStr}
              onNameChange={handleNameChange}
              onPhoneChange={handlePhoneChange}
              onFieldChange={(field, value) => setForm({ ...form, [field]: value })}
              onBlur={handleBlur}
              onNationalityChange={handleNationalityChange}
            />
            <ProfileReadOnlyFields
              user={user}
              form={form}
              errors={errors}
              touched={touched}
              onAddressChange={(e) => setForm({ ...form, address: e.target.value })}
              onBlur={handleBlur}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving || !isFormValid} className="w-full rounded-xl h-12 text-base font-semibold">
          {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
        </Button>

        {!isFormValid && (
          <p className="text-xs text-center text-muted-foreground">Please complete all required fields to save your profile</p>
        )}
      </div>
    </div>
  );
}
