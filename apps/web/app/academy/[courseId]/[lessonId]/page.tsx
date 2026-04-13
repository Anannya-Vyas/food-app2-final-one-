'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../../lib/api';

interface LessonContent { text?: string; tips?: string[]; }

interface LessonDetail {
  id: string;
  courseId: string;
  title: string;
  content: LessonContent | string;
  orderIndex: number;
  isFree: boolean;
  completed: boolean;
  completedAt: string | null;
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [badgeAwarded, setBadgeAwarded] = useState(false);

  useEffect(() => {
    api.get(`/api/academy/courses/${courseId}/lessons/${lessonId}`)
      .then(({ data }) => { setLesson(data.data); setCompleted(data.data.completed); })
      .catch(() => setError('Failed to load lesson.'))
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  async function markComplete() {
    setCompleting(true);
    try {
      const { data } = await api.post(`/api/academy/lessons/${lessonId}/complete`);
      setCompleted(true);
      if (data.data?.badgeAwarded) setBadgeAwarded(true);
    } catch { /* ignore */ }
    finally { setCompleting(false); }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !lesson) return (
    <div className="text-center py-20 text-on-surface-variant">{error || 'Lesson not found.'}</div>
  );

  const content: LessonContent = typeof lesson.content === 'string'
    ? { text: lesson.content }
    : (lesson.content as LessonContent);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/academy/${courseId}`} className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label text-xs font-bold uppercase tracking-widest mb-6">
        <span className="material-symbols-outlined text-sm">arrow_back</span>Back to Course
      </Link>

      <div className="mb-6">
        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Lesson {lesson.orderIndex}</span>
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mt-1">{lesson.title}</h1>
        <div className="flex gap-2 mt-2">
          {lesson.isFree && <span className="text-[10px] font-label font-bold uppercase tracking-widest bg-secondary-fixed text-on-secondary-fixed px-2 py-1 rounded-full">Free Lesson</span>}
          {completed && <span className="text-[10px] font-label font-bold uppercase tracking-widest bg-tertiary-fixed text-on-tertiary-fixed px-2 py-1 rounded-full">✓ Completed</span>}
        </div>
      </div>

      {badgeAwarded && (
        <div className="mb-6 p-4 bg-tertiary-fixed rounded-2xl text-center">
          <p className="font-headline font-bold text-on-tertiary-fixed">🏅 Course Complete! Badge earned!</p>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 shadow-sm mb-6">
        {content?.text && <p className="text-on-surface leading-relaxed text-base">{content.text}</p>}
        {content?.tips && content.tips.length > 0 && (
          <div className="mt-6">
            <h3 className="font-headline font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">lightbulb</span>Pro Tips
            </h3>
            <div className="space-y-2">
              {content.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-surface-container rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-on-surface-variant">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {completed ? (
        <div className="flex items-center gap-3 p-4 bg-secondary-fixed rounded-2xl">
          <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div>
            <p className="font-headline font-bold text-on-secondary-fixed">Lesson completed</p>
            {lesson.completedAt && <p className="text-xs text-on-secondary-fixed/70">{new Date(lesson.completedAt).toLocaleDateString()}</p>}
          </div>
        </div>
      ) : (
        <button onClick={markComplete} disabled={completing}
          className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">check</span>
          {completing ? 'Saving...' : 'Mark as Complete'}
        </button>
      )}
    </div>
  );
}
