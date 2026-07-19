'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const DEFAULT_UPLOAD_LIMIT = 5;
const DEFAULT_AI_LIMIT = 3;
const MAX_DURATION_SEC = 600; // 10 minutes

export function useUsageLimit() {
  const [user, setUser] = useState<User | null>(null);
  const [uploadCount, setUploadCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [maxUploads, setMaxUploads] = useState(DEFAULT_UPLOAD_LIMIT);
  const [maxAi, setMaxAi] = useState(DEFAULT_AI_LIMIT);
  const [isInitializing, setIsInitializing] = useState(true);

  // Load auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load limits
  useEffect(() => {
    let isMounted = true;
    
    async function loadCounts() {
      setIsInitializing(true);
      if (user) {
        // Load from supabase
        try {
          const { data, error } = await supabase
            .from('usage_limits')
            .select('upload_count, ai_generate_count, reset_at, max_upload_count, max_ai_generate_count')
            .eq('user_id', user.id)
            .single();
          
          if (!isMounted) return;

          if (data) {
            setMaxUploads(data.max_upload_count ?? DEFAULT_UPLOAD_LIMIT);
            setMaxAi(data.max_ai_generate_count ?? DEFAULT_AI_LIMIT);
            
            // check if reset_at has passed
            if (new Date(data.reset_at) < new Date()) {
               await supabase.from('usage_limits').update({ 
                 upload_count: 0, 
                 ai_generate_count: 0, 
                 reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
               }).eq('user_id', user.id);
               setUploadCount(0);
               setAiCount(0);
            } else {
               setUploadCount(data.upload_count);
               setAiCount(data.ai_generate_count);
            }
          } else if (error && error.code === 'PGRST116') {
             // Not found, create
             await supabase.from('usage_limits').insert({
               user_id: user.id,
               upload_count: 0,
               ai_generate_count: 0,
               max_upload_count: DEFAULT_UPLOAD_LIMIT,
               max_ai_generate_count: DEFAULT_AI_LIMIT,
             });
             setUploadCount(0);
             setAiCount(0);
             setMaxUploads(DEFAULT_UPLOAD_LIMIT);
             setMaxAi(DEFAULT_AI_LIMIT);
          }
        } catch (err) {
          console.error("Supabase limit fetch error:", err);
        }
      } else {
        // Load from sessionStorage
        const sessionUploads = sessionStorage.getItem('vant_upload_count');
        const sessionAi = sessionStorage.getItem('vant_ai_count');
        if (isMounted) {
          setUploadCount(sessionUploads ? parseInt(sessionUploads, 10) : 0);
          setAiCount(sessionAi ? parseInt(sessionAi, 10) : 0);
        }
      }
      if (isMounted) setIsInitializing(false);
    }
    
    loadCounts();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  const incrementUpload = async () => {
    const newCount = uploadCount + 1;
    setUploadCount(newCount);
    if (user) {
      await supabase.from('usage_limits').update({ upload_count: newCount }).eq('user_id', user.id);
    } else {
      sessionStorage.setItem('vant_upload_count', newCount.toString());
    }
  };

  const incrementAi = async () => {
    const newCount = aiCount + 1;
    setAiCount(newCount);
    if (user) {
      await supabase.from('usage_limits').update({ ai_generate_count: newCount }).eq('user_id', user.id);
    } else {
      sessionStorage.setItem('vant_ai_count', newCount.toString());
    }
  };
  
  const checkDuration = async (file: File): Promise<boolean> => {
     return new Promise((resolve) => {
        const audio = document.createElement('audio');
        const url = URL.createObjectURL(file);
        audio.src = url;
        audio.addEventListener('loadedmetadata', () => {
           URL.revokeObjectURL(url);
           resolve(audio.duration <= MAX_DURATION_SEC);
        });
        audio.addEventListener('error', () => {
           URL.revokeObjectURL(url);
           resolve(false); 
        });
     });
  };

  return {
    isInitializing,
    user,
    uploadCount,
    aiCount,
    canUpload: uploadCount < maxUploads,
    canGenerateAi: aiCount < maxAi,
    incrementUpload,
    incrementAi,
    checkDuration,
    maxUploads,
    maxAi,
    maxDurationSec: MAX_DURATION_SEC
  };
}
