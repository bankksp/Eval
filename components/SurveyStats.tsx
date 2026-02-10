
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { utils, writeFile } from 'xlsx';
import { GoogleGenAI } from "@google/genai";
import { Question, SurveyResponse, DemographicQuestion } from '../types';
import { FaceFrownIcon, FaceIcon, FaceMehIcon, FaceSmileIcon, FaceGrinIcon, UsersIcon, StarIcon, DownloadIcon, AlertTriangleIcon, SparklesIcon, MessageSquareIcon, TableIcon } from './icons';

interface SurveyStatsProps {
  surveyTitle: string;
  questions: Question[];
  demographicQuestions: DemographicQuestion[];
  responses: SurveyResponse[];
}

const SATISFACTION_LEVELS = [
  { level: 1, label: 'น้อยที่สุด', color: '#f43f5e', Icon: FaceFrownIcon },
  { level: 2, label: 'น้อย', color: '#f59e0b', Icon: FaceMehIcon },
  { level: 3, label: 'ปานกลาง', color: '#eab308', Icon: FaceIcon },
  { level: 4, label: 'มาก', color: '#84cc16', Icon: FaceSmileIcon },
  { level: 5, label: 'มากที่สุด', color: '#10b981', Icon: FaceGrinIcon },
];

const PIE_COLORS = ['#4f46e5', '#7c3aed', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444', '#84cc16'];

const getInterpretation = (mean: number) => {
  if (mean >= 4.50) return { text: 'มากที่สุด', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' };
  if (mean >= 3.50) return { text: 'มาก', color: 'text-lime-600', bgColor: 'bg-lime-50', borderColor: 'border-lime-200' };
  if (mean >= 2.50) return { text: 'ปานกลาง', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' };
  if (mean >= 1.50) return { text: 'น้อย', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
  return { text: 'น้อยที่สุด', color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' };
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 rounded-2xl shadow-2xl text-sm min-w-[200px]">
        <p className="font-black text-slate-800 mb-3 border-b pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-slate-600 font-bold">{entry.name}</span>
              </div>
              <span className="font-black text-slate-900">{entry.value} คน</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const SurveyStats: React.FC<SurveyStatsProps> = ({ surveyTitle, questions, demographicQuestions, responses }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const { totalSubmissions, overallAverage, overallSD, overallDistribution, questionStats, barChartData, allComments, demographicStats } = useMemo(() => {
    const totalSubmissions = responses.length;
    const comments = responses.map(r => r.comment).filter(Boolean) as string[];

    if (totalSubmissions === 0 || questions.length === 0) {
      return { totalSubmissions: 0, overallAverage: 0, overallSD: 0, overallDistribution: [], questionStats: [], barChartData: [], allComments: [], demographicStats: [] };
    }

    let allScores: number[] = [];
    const overallCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const qStats = questions.map(q => {
      const answersForQ = responses.map(r => r.answers.find(a => a.questionId === q.id)).filter(Boolean).map(a => a!.level);
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      
      answersForQ.forEach(level => {
        counts[level as keyof typeof counts]++;
        overallCounts[level as keyof typeof overallCounts]++;
        allScores.push(level);
      });

      const n = answersForQ.length;
      const sum = answersForQ.reduce((a, b) => a + b, 0);
      const mean = n > 0 ? sum / n : 0;
      
      let sd = 0;
      if (n > 1) {
        const squareDiffs = answersForQ.map(value => Math.pow(value - mean, 2));
        sd = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / (n - 1));
      }

      return { id: q.id, text: q.text, counts, average: mean, sd, totalAnswers: n, interpretation: getInterpretation(mean) };
    });

    const nTotal = allScores.length;
    const meanTotal = nTotal > 0 ? allScores.reduce((a, b) => a + b, 0) / nTotal : 0;
    
    let sdTotal = 0;
    if (nTotal > 1) {
      const squareDiffs = allScores.map(value => Math.pow(value - meanTotal, 2));
      sdTotal = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / (nTotal - 1));
    }

    const overallDist = SATISFACTION_LEVELS.map(s => ({ name: s.label, value: overallCounts[s.level as keyof typeof overallCounts], color: s.color }));
    
    const barData = qStats.map(q => ({ name: q.text, ...q.counts }));

    const demoStats = (demographicQuestions || []).map(dq => {
      const counts: Record<string, number> = {};
      responses.forEach(r => {
        const answer = r.demographics?.[dq.id];
        if (answer) {
          counts[answer] = (counts[answer] || 0) + 1;
        }
      });
      return {
        id: dq.id,
        label: dq.label,
        data: Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
      };
    });

    return { totalSubmissions, overallAverage: meanTotal, overallSD: sdTotal, overallDistribution: overallDist, questionStats: qStats, barChartData: barData, allComments: comments, demographicStats: demoStats };
  }, [questions, demographicQuestions, responses]);

  const generateAiInsight = async () => {
    if (isLoadingAi) return;
    setIsLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const statsText = questionStats.map(q => `- ${q.text}: Mean=${q.average.toFixed(2)}, SD=${q.sd.toFixed(2)}`).join('\n');
      const commentsText = allComments.slice(0, 15).join('\n');
      
      const prompt = `ในฐานะผู้เชี่ยวชาญด้านการวิเคราะห์ข้อมูลสถิติและการวิจัย กรุณาสรุปผลจากแบบสำรวจความพึงพอใจเรื่อง "${surveyTitle}" 
      ข้อมูลสถิติรายข้อ (Mean, S.D.):
      ${statsText}
      
      ค่าเฉลี่ยรวม: ${overallAverage.toFixed(2)}
      จำนวนผู้ตอบ: ${totalSubmissions}
      
      ข้อเสนอแนะจากผู้ใช้บางส่วน:
      ${commentsText || 'ไม่มีข้อเสนอแนะ'}
      
      กรุณาสรุปเป็นข้อๆ แบ่งเป็น:
      1. สรุปภาพรวมระดับความพึงพอใจ
      2. จุดแข็ง (ข้อที่มีคะแนนสูง)
      3. จุดที่ควรพัฒนา (ข้อที่มีคะแนนน้อยที่สุด)
      4. ข้อเสนอแนะแนวทางการปรับปรุง
      ใช้ภาษาไทยที่เป็นทางการ สุภาพ และเข้าใจง่าย`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiInsight(response.text || "ไม่สามารถสรุปผลได้ในขณะนี้");
    } catch (error) {
      console.error("AI Generation error:", error);
      setAiInsight("ไม่สามารถเชื่อมต่อ AI ได้ กรุณาตรวจสอบ API Key หรือลองใหม่อีกครั้ง");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleExport = () => {
    const workbook = utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      { 'รายการ': "ชื่อแบบประเมิน", 'รายละเอียด': surveyTitle },
      { 'รายการ': "จำนวนผู้ตอบทั้งหมด", 'รายละเอียด': `${totalSubmissions} คน` },
      { 'รายการ': "ค่าเฉลี่ยรวม (x̄)", 'รายละเอียด': overallAverage.toFixed(2) },
      { 'รายการ': "ส่วนเบี่ยงเบนมาตรฐาน (S.D.)", 'รายละเอียด': overallSD.toFixed(2) },
      { 'รายการ': "ระดับความพึงพอใจภาพรวม", 'รายละเอียด': getInterpretation(overallAverage).text },
      { 'รายการ': "วันที่ออกรายงาน", 'รายละเอียด': new Date().toLocaleDateString('th-TH') }
    ];
    utils.book_append_sheet(workbook, utils.json_to_sheet(summaryData), "สรุปผู้บริหาร");

    // 2. Statistics Sheet (Table view)
    const statsData = questionStats.map((q, index) => ({
      'ข้อที่': index + 1,
      'รายการประเมิน': q.text,
      'ค่าเฉลี่ย (x̄)': Number(q.average.toFixed(2)),
      'S.D.': Number(q.sd.toFixed(2)),
      'ระดับความพึงพอใจ': q.interpretation.text,
      'มากที่สุด (5)': q.counts[5],
      'มาก (4)': q.counts[4],
      'ปานกลาง (3)': q.counts[3],
      'น้อย (2)': q.counts[2],
      'น้อยที่สุด (1)': q.counts[1],
    }));
    utils.book_append_sheet(workbook, utils.json_to_sheet(statsData), "สถิติรายข้อ");

    // 3. Raw Data Sheet
    const rawHeaderMap: Record<string, string> = {};
    questions.forEach((q, i) => rawHeaderMap[q.id] = `ข้อ ${i + 1}: ${q.text}`);
    demographicQuestions.forEach(d => rawHeaderMap[d.id] = d.label);

    const rawData = responses.map((r, i) => {
      const row: Record<string, any> = {
        'ลำดับ': i + 1,
        'วัน-เวลา': new Date(r.timestamp).toLocaleString('th-TH')
      };
      
      // Add demographics
      demographicQuestions.forEach(d => {
        row[d.label] = r.demographics?.[d.id] || '-';
      });

      // Add answers
      questions.forEach(q => {
         const ans = r.answers.find(a => a.questionId === q.id);
         row[`ข้อ ${questions.indexOf(q)+1}`] = ans ? ans.level : '';
      });
      
      row['ข้อเสนอแนะ'] = r.comment || '';
      return row;
    });

    if (rawData.length > 0) {
       utils.book_append_sheet(workbook, utils.json_to_sheet(rawData), "ข้อมูลดิบ");
    }
    
    // 4. Comments Sheet
    if (allComments.length > 0) {
      utils.book_append_sheet(workbook, utils.json_to_sheet(allComments.map((c, i) => ({ 'ลำดับ': i+1, 'ข้อเสนอแนะ': c }))), "ข้อเสนอแนะ");
    }
    
    writeFile(workbook, `Report_${surveyTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (totalSubmissions === 0) {
    return (
      <div className="bg-white p-20 rounded-[32px] shadow-sm border border-slate-100 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mx-auto w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <AlertTriangleIcon className="w-12 h-12 text-slate-300" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">ยังไม่มีข้อมูล</h2>
        <p className="text-slate-500 max-w-sm mx-auto text-lg leading-relaxed font-medium">สถิติจะปรากฏขึ้นโดยอัตโนมัติเมื่อมีผู้เริ่มตอบแบบสอบถาม</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Header Section */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <UsersIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">แดชบอร์ดสรุปผล</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">อัปเดตล่าสุด ณ วันนี้</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={generateAiInsight} 
            disabled={isLoadingAi}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoadingAi ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SparklesIcon className="w-5 h-5"/>
            )}
            AI ช่วยวิเคราะห์
          </button>
          <button onClick={handleExport} className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 group">
            <DownloadIcon className="w-5 h-5 group-hover:translate-y-1 transition-transform"/>
            Excel Report
          </button>
        </div>
      </div>

      {aiInsight && (
        <div className="bg-gradient-to-br from-indigo-50/50 to-white p-8 rounded-[40px] shadow-2xl shadow-indigo-100/20 border-2 border-indigo-100 animate-in fade-in zoom-in duration-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
          <div className="flex items-center gap-3 mb-6 relative">
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">สรุปบทวิเคราะห์ AI</h3>
          </div>
          <div className="prose prose-indigo max-w-none relative">
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-bold text-lg">
              {aiInsight}
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'ผู้ประเมิน', val: totalSubmissions, unit: 'คน', icon: UsersIcon, bg: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'ค่าเฉลี่ยรวม (x̄)', val: overallAverage.toFixed(2), unit: '', icon: StarIcon, bg: 'bg-indigo-50', text: 'text-indigo-600' },
          { label: 'ความผันแปร (S.D.)', val: overallSD.toFixed(2), unit: '', icon: FaceMehIcon, bg: 'bg-purple-50', text: 'text-purple-600' },
          { label: 'คุณภาพรวม', val: getInterpretation(overallAverage).text, unit: '', icon: FaceGrinIcon, bg: getInterpretation(overallAverage).bgColor, text: getInterpretation(overallAverage).color }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-7 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-xl hover:shadow-slate-100 transition-all group">
            <div className={`w-14 h-14 ${card.bg} ${card.text} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <card.icon className="w-7 h-7"/>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <p className={`text-4xl font-black ${card.text} tracking-tighter`}>
                {card.val} <span className="text-sm font-bold opacity-40 ml-1">{card.unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Statistical Table Section (New) */}
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
         <div className="flex items-center gap-3 mb-8">
            <div className="w-2.5 h-8 bg-rose-500 rounded-full shadow-lg shadow-rose-100"></div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">ตารางสรุปผลการวิเคราะห์ข้อมูล (รายข้อ)</h3>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full min-w-[800px] border-collapse">
                 <thead>
                     <tr className="bg-slate-50 border-b-2 border-slate-100">
                         <th className="py-4 px-4 text-left font-black text-slate-600 w-16 rounded-tl-2xl">ข้อที่</th>
                         <th className="py-4 px-4 text-left font-black text-slate-600">รายการประเมิน</th>
                         <th className="py-4 px-4 text-center font-black text-slate-600 w-24">x̄</th>
                         <th className="py-4 px-4 text-center font-black text-slate-600 w-24">S.D.</th>
                         <th className="py-4 px-4 text-center font-black text-slate-600 w-32 rounded-tr-2xl">แปลผล</th>
                     </tr>
                 </thead>
                 <tbody>
                     {questionStats.map((q, index) => (
                         <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                             <td className="py-4 px-4 text-center font-bold text-slate-500">{index + 1}</td>
                             <td className="py-4 px-4 font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{q.text}</td>
                             <td className="py-4 px-4 text-center font-black text-slate-900 bg-slate-50/30">{q.average.toFixed(2)}</td>
                             <td className="py-4 px-4 text-center font-medium text-slate-500">{q.sd.toFixed(2)}</td>
                             <td className="py-4 px-4 text-center">
                                 <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${q.interpretation.bgColor} ${q.interpretation.color} border ${q.interpretation.borderColor}`}>
                                     {q.interpretation.text}
                                 </span>
                             </td>
                         </tr>
                     ))}
                 </tbody>
                 <tfoot>
                     <tr className="bg-slate-50 border-t-2 border-slate-200">
                         <td colSpan={2} className="py-4 px-6 text-right font-black text-slate-700 rounded-bl-2xl">รวมเฉลี่ย</td>
                         <td className="py-4 px-4 text-center font-black text-2xl text-indigo-600">{overallAverage.toFixed(2)}</td>
                         <td className="py-4 px-4 text-center font-bold text-slate-500">{overallSD.toFixed(2)}</td>
                         <td className="py-4 px-4 text-center rounded-br-2xl">
                              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${getInterpretation(overallAverage).bgColor} ${getInterpretation(overallAverage).color} border ${getInterpretation(overallAverage).borderColor}`}>
                                  {getInterpretation(overallAverage).text}
                              </span>
                         </td>
                     </tr>
                 </tfoot>
             </table>
         </div>
      </div>
      
      {/* Demographics Section */}
      {demographicStats.length > 0 && (
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-10">
                  <div className="w-2.5 h-8 bg-violet-500 rounded-full shadow-lg shadow-violet-100"></div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">ข้อมูลเชิงประชากรของผู้ตอบ</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {demographicStats.map((stat, index) => (
                      <div key={stat.id} className="text-center">
                          <h4 className="font-black text-slate-700 text-lg mb-4">{stat.label}</h4>
                          <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie data={stat.data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                          {stat.data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                                      </Pie>
                                      <Tooltip />
                                  </PieChart>
                              </ResponsiveContainer>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-2.5 h-8 bg-indigo-500 rounded-full shadow-lg shadow-indigo-100"></div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">กราฟแสดงคะแนนรายหัวข้อประเมิน</h3>
          </div>
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 800 }} angle={-25} textAnchor="end" interval={0} height={120} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '40px', fontWeight: 800, fontSize: '12px', color: '#64748b' }} />
                {SATISFACTION_LEVELS.map((s, idx) => (
                  <Bar key={s.level} dataKey={s.level.toString()} stackId="a" fill={s.color} name={s.label} radius={idx === 4 ? [6, 6, 0, 0] : 0} barSize={40} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-2xl font-black text-slate-900 text-center mb-10 tracking-tight">สัดส่วนคำตอบรวม</h3>
          <div className="flex-grow flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={overallDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={85} outerRadius={120} paddingAngle={10} stroke="none">
                  {overallDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-slate-900">{overallAverage.toFixed(2)}</span>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">คะแนนเฉลี่ย</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 mt-10">
            {SATISFACTION_LEVELS.map(s => (
              <div key={s.level} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full shadow-lg" style={{ backgroundColor: s.color }}></div>
                  <span className="text-slate-600 font-black text-xs uppercase tracking-tight">{s.label}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-slate-900 font-black text-sm">{((overallDistribution.find(d => d.name === s.label)?.value || 0) / (totalSubmissions * questions.length || 1) * 100).toFixed(0)}%</span>
                    <span className="text-[10px] text-slate-400 font-bold">({overallDistribution.find(d => d.name === s.label)?.value || 0})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Feed */}
      {allComments.length > 0 && (
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-10">
            <div className="w-2.5 h-8 bg-sky-500 rounded-full shadow-lg shadow-sky-100"></div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">ความคิดเห็นล่าสุด ({allComments.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allComments.slice().reverse().map((comment, idx) => (
              <div key={idx} className="p-8 bg-slate-50 rounded-[32px] border border-slate-200/40 relative group hover:bg-white hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-6 right-8 text-slate-100 group-hover:text-indigo-50 transition-colors">
                  <MessageSquareIcon className="w-12 h-12" />
                </div>
                <p className="text-slate-700 font-bold leading-relaxed relative z-10 italic">"{comment}"</p>
                <div className="mt-6 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Customer Feedback</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyStats;
