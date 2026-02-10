
import { useState, useEffect, useCallback } from 'react';
import { SurveyProject, Question, Answer, SurveyResponse, DemographicQuestion } from '../types';

const STORAGE_KEY = 'satisfaction_survey_multi_projects';

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !! URL ของ Web App ที่คุณระบุมา                                                                !!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const WEB_APP_URL: string = 'https://script.google.com/macros/s/AKfycbxCbXQZa2QSwYy-mW0kopG5ZTfljBvdp98_YCUmyiahFXk9D4TLTB71phqfKc8KqNBXWw/exec';


const defaultProjects: SurveyProject[] = [
  {
    id: 'p-sufficiency-economy',
    title: 'ประเมินศูนย์การเรียนรู้เศรษฐกิจพอเพียง',
    description: 'แบบประเมินการดำเนินงานของศูนย์การเรียนรู้ตามหลักปรัชญาของเศรษฐกิจพอเพียงด้านการศึกษา',
    coverImage: "https://images.unsplash.com/photo-1542751371-65937666f698?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    isOpen: true,
    demographicQuestions: [
      { id: 'dq-gender', label: 'เพศ', options: ['ชาย', 'หญิง'], includeOther: false },
      { id: 'dq-age', label: 'อายุ', options: ['น้อยกว่า 20 ปี', '21 - 30 ปี', '31 - 40 ปี', '41 - 50 ปี', '51 - 60 ปี', 'มากกว่า 60 ปี'], includeOther: false },
      { id: 'dq-status', label: 'สถานภาพ', options: ['นักศึกษา', 'ประชาชนทั่วไป', 'ครู', 'ผู้บริหาร'], includeOther: true },
    ],
    questions: [
      { id: 'q-se-1', text: 'ด้านวิทยากร: การถ่ายทอดความรู้ชัดเจน' },
      { id: 'q-se-2', text: 'ด้านวิทยากร: การเชื่อมโยงตามหลัก ๒ ๓ ๔' },
      { id: 'q-se-3', text: 'ด้านวิทยากร: มีเนื้อหาครบถ้วนครอบคลุมทุกกิจกรรม' },
      { id: 'q-se-4', text: 'ด้านวิทยากร: การใช้เวลาถ่ายทอดความรู้ที่เหมาะสม' },
      { id: 'q-se-5', text: 'ด้านวิทยากร: การตอบข้อซักถามได้เข้าใจ ถูกต้อง' },
      { id: 'q-se-6', text: 'ด้านสถานที่: สถานที่สะอาด ร่มรื่น ปลอดภัย และสวยงาม' },
      { id: 'q-se-7', text: 'ด้านสถานที่: ความพร้อมของอุปกรณ์' },
      { id: 'q-se-8', text: 'ด้านความรู้ความเข้าใจ: ความรู้ความเข้าใจเนื้อหาในแหล่งเรียนรู้' },
      { id: 'q-se-9', text: 'ด้านการนำความรู้ไปใช้: สามารถนำความรู้ที่ได้รับไปประยุกต์ใช้ในชีวิตประจำวัน' },
      { id: 'q-se-10', text: 'ด้านการนำความรู้ไปใช้: คาดว่าสามารถนำความรู้ไปเผยแพร่/ถ่ายทอดได้' },
    ],
    responses: [],
    createdAt: Date.now(),
  }
];

const useSurveyData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<SurveyProject[]>(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      const parsedItem = item ? JSON.parse(item) : null;
      if(parsedItem && Array.isArray(parsedItem) && parsedItem.length > 0 && parsedItem[0].id) {
        // Migration for old data structure
        const migratedData = parsedItem.map(p => ({
          ...p,
          demographicQuestions: p.demographicQuestions || [],
        }));
        return migratedData;
      }
      return defaultProjects;
    } catch (error) {
      return defaultProjects;
    }
  });

  // Fetch data from Google Sheet on mount
  useEffect(() => {
    const fetchData = async () => {
      if (WEB_APP_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' || WEB_APP_URL === '') {
        setIsLoading(false);
        return;
      }

      try {
        // Added credentials: 'omit' to prevent CORS errors during redirection
        // Added timestamp (t) to bust browser cache and ensure we get latest data
        const fetchUrl = `${WEB_APP_URL}?action=get_projects&t=${new Date().getTime()}`;
        const response = await fetch(fetchUrl, {
            redirect: 'follow',
            credentials: 'omit'
        });
        
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          console.log("Fetched projects from Google Sheet:", result.data);
          // Merge fetched data with local state structure if needed, or just replace
          setProjects(result.data);
          
          // Update local storage to match cloud
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
        }
      } catch (error) {
        console.error("Error fetching data from Google Sheet:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error("Storage limit exceeded:", error);
    }
  }, [projects]);

  const addProject = useCallback(async (title: string, description: string) => {
    const newProject: SurveyProject = {
      id: `p${Date.now()}`,
      title,
      description,
      isOpen: true,
      questions: [{ id: `q${Date.now()}`, text: 'คำถามเริ่มต้น' }],
      demographicQuestions: [],
      responses: [],
      createdAt: Date.now(),
    };

    // 1. Update Local State (Optimistic Update)
    setProjects(prev => [newProject, ...prev]);

    // 2. Send to Google Sheet (Async)
    if (WEB_APP_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' && WEB_APP_URL !== '') {
      try {
        const payload = {
          action: 'create_project',
          id: newProject.id,
          title: newProject.title,
          description: newProject.description,
          questions: JSON.stringify(newProject.questions),
          demographicQuestions: JSON.stringify(newProject.demographicQuestions),
        };

        const response = await fetch(WEB_APP_URL, {
          method: 'POST',
          redirect: 'follow',
          credentials: 'omit',
          // Changed to text/plain to avoid preflight CORS request which GAS doesn't handle well
          headers: { 'Content-Type': 'text/plain' }, 
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error("Failed to save project to Google Sheet (HTTP Error)");
        } else {
            const result = await response.json();
            if (result.status !== 'success') {
                console.error("Failed to save project to Google Sheet (Script Error):", result.message);
            }
        }
      } catch (error) {
        console.error("Error sending project to Google Sheet:", error);
        alert('สร้างโปรเจกต์ในเครื่องสำเร็จ แต่ไม่สามารถบันทึกลง Google Sheet ได้ (ตรวจสอบการเชื่อมต่อ)');
      }
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<SurveyProject>) => {
    // 1. Update Local State
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    // 2. Sync to Google Sheet
    if (WEB_APP_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' && WEB_APP_URL !== '') {
      try {
        const payload: any = {
          action: 'update_project',
          id: id,
          ...updates
        };
        
        // Convert arrays to JSON string for storage
        if (updates.questions) payload.questions = JSON.stringify(updates.questions);
        if (updates.demographicQuestions) payload.demographicQuestions = JSON.stringify(updates.demographicQuestions);

        const response = await fetch(WEB_APP_URL, {
          method: 'POST',
          redirect: 'follow',
          credentials: 'omit',
          // Changed to text/plain to avoid preflight CORS request which GAS doesn't handle well
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
           throw new Error(`Failed to connect to Google Sheet (Status ${response.status})`);
        }

        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message || 'Update failed on server');
        }

      } catch (error) {
        console.error("Failed to sync update to Google Sheet.", error);
        throw error; // Re-throw to handle in UI
      }
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    // 1. Update Local State
    setProjects(prev => prev.filter(p => p.id !== id));

    // 2. Sync to Google Sheet
    if (WEB_APP_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' && WEB_APP_URL !== '') {
      try {
        const payload = {
            action: 'delete_project',
            id: id
        };

        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            redirect: 'follow',
            credentials: 'omit',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
           throw new Error(`Failed to delete on server (Status ${response.status})`);
        }
      } catch (error) {
         console.error("Failed to delete project from Google Sheet.", error);
         alert('ลบจากหน้าเว็บแล้ว แต่ไม่สามารถลบจาก Google Sheet ได้ (ตรวจสอบการเชื่อมต่อ)');
      }
    }
  }, []);

  const submitResponse = useCallback(async (projectId: string, answers: Answer[], demographics: Record<string, string>, comment?: string) => {
    // Check if URL is placeholder only
    if (WEB_APP_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' || WEB_APP_URL === '') {
        const errorMessage = '⚠️ ไม่สามารถส่งข้อมูลได้: คุณยังไม่ได้ระบุ URL ของ Web App ที่ถูกต้อง\n\n1. ไปที่ไฟล์ hooks/useSurveyData.ts\n2. แก้ไขตัวแปร WEB_APP_URL ให้เป็น URL ที่ได้จากการ Deploy Google Apps Script ของคุณ';
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error("Project not found for submission:", projectId);
      throw new Error('Project not found');
    }

    const questionMap = new Map<string, string>(project.questions.map(q => [q.id, q.text] as [string, string]));
    const demographicMap = new Map<string, string>(project.demographicQuestions.map(q => [q.id, q.label] as [string, string]));

    const payload: Record<string, any> = {
      action: 'submit_response', // Explicitly state action
      projectId: project.id, // IMPORTANT: Used to determine sheet name
      timestamp: new Date().toISOString(),
      projectTitle: project.title,
      comment: comment || '',
    };
    
    for (const [key, value] of Object.entries(demographics)) {
      payload[demographicMap.get(key) || key] = value;
    }

    for (const answer of answers) {
      payload[questionMap.get(answer.questionId) || answer.questionId] = answer.level;
    }

    try {
      const response = await fetch(WEB_APP_URL, {
        method: 'POST',
        redirect: 'follow', // Follow Google's redirects
        credentials: 'omit', // Avoid sending cookies to cross-origin GAS
        // Changed to text/plain to avoid preflight CORS request which GAS doesn't handle well
        headers: {
          'Content-Type': 'text/plain', 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`การส่งข้อมูลล้มเหลว (HTTP ${response.status}): ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
          console.error('Google Sheet submission failed with script error:', result.message);
          throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลง Google Sheet');
      }

    } catch (error) {
      console.error('Error submitting to Google Sheet:', error);
      throw error;
    }

    // Update local state
    const newResponse: SurveyResponse = {
      id: `res${Date.now()}`,
      timestamp: Date.now(),
      answers,
      demographics,
      comment,
    };
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, responses: [...p.responses, newResponse] } : p
    ));
  }, [projects]);

  return {
    loading: isLoading,
    projects,
    addProject,
    updateProject,
    deleteProject,
    submitResponse,
  };
};

export default useSurveyData;
