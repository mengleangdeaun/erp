import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IconArrowLeft, IconMessageHeart, IconChevronRight, IconSend, IconThumbUp, IconThumbDown } from '@tabler/icons-react';
import PageHeader from '../../../components/ui/PageHeader';
import MobileLayout from '../../../components/Layouts/MobileLayout';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';

const FeedbackCreate = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'positive',
        message: '',
        recommendation: '',
    });

    useEffect(() => {
        dispatch(setPageTitle(t('feedback', 'Feedback')));
    }, [dispatch, t]);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.message.trim()) {
            toast.error('Please enter your feedback message');
            return;
        }

        setLoading(true);
        try {
            await fetch('/sanctum/csrf-cookie');
            const response = await fetch('/api/employee-app/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || 'Feedback submitted successfully!');
                navigate('/employee/profile');
            } else {
                toast.error(data.message || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#060818]">
            <PageHeader
                title="Company Feedback"
                icon={<IconMessageHeart className="w-4 h-4" />}
            />

            <div className="flex-1 overflow-y-auto pb-20">
                <div className="p-4 space-y-6">
                    <div className="bg-gradient-to-br from-primary/10 to-transparent p-5 rounded-2xl border border-primary/10 flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-xl">
                            <IconMessageHeart className="text-primary w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Voice Matters</h2>
                            <p className="text-sm text-gray-500">Your feedback is completely anonymous.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">
                            How would you categorize your feedback? <span className="text-red-500">*</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'positive' })}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.type === 'positive'
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                                        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-400'
                                    }`}
                            >
                                <IconThumbUp size={28} className={formData.type === 'positive' ? 'scale-110 mb-1' : ''} />
                                <span className="text-xs font-bold uppercase">Positive</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'negative' })}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.type === 'negative'
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'
                                        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-400'
                                    }`}
                            >
                                <IconThumbDown size={28} className={formData.type === 'negative' ? 'scale-110 mb-1' : ''} />
                                <span className="text-xs font-bold uppercase">Negative</span>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">
                                Feedback Message <span className="text-red-500">*</span>
                            </label>
                            <Textarea
                                className="w-full h-32 px-4 py-3 rounded-xl border transition-all resize-none"
                                placeholder="Tell us what's on your mind..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">
                                Recommendation
                            </label>
                            <Textarea
                                className="w-full h-32 px-4 py-3 rounded-xl border transition-all resize-none"
                                placeholder="Any suggestions for improvement?"
                                value={formData.recommendation}
                                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                            />
                        </div>

                        <p className="text-xs text-center text-gray-400 py-2">
                            By submitting, you agree to provide honest and constructive feedback.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {loading ? 'Submitting...' : (
                                <>
                                    <span>Submit Feedback</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FeedbackCreate;
