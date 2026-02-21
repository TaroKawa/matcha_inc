import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import Layout from '@/components/Layout';
import { formatMoney } from '@/lib/gameEngine';
import { AREAS } from '@/lib/gameData';
import { Employee, ConversationMessage } from '@/types/game';

type HRTab = 'employees' | 'applicants';
type ModalType = 'none' | 'resume' | 'interview' | 'talk';

export default function HRPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const store = useGameStore();
  const { initialized, employees, applicants, stores } = store;

  const [tab, setTab] = useState<HRTab>('applicants');
  const [modal, setModal] = useState<ModalType>('none');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [motivationBonus, setMotivationBonus] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  if (!hydrated) return null;
  if (!initialized) { router.push('/'); return null; }

  const openStores = stores.filter(s => s.isOpen);

  const handleGenerateApplicants = async () => {
    setIsGenerating(true);
    try {
      const existingNames = [...employees, ...applicants].map(e => e.name);
      const res = await fetch('/api/generate-applicant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingNames }),
      });
      if (res.ok) {
        const profile = await res.json();
        const id = `emp-${Math.random().toString(36).substring(2, 9)}`;
        const newApplicant: Employee = {
          id, ...profile,
          fatigue: 0, assignedStoreId: null, weeksEmployed: 0,
          hiringStatus: 'new', interviewMotivationBonus: 0,
          interviewConversation: [], isSabotaging: false,
          performanceMultiplier: 1.0, talkHistory: [],
        };
        store.updateApplicant(id, {}); // noop to trigger
        useGameStore.setState(s => ({ applicants: [...s.applicants, newApplicant] }));
      }
    } catch (e) { console.error(e); }
    setIsGenerating(false);
  };

  const openResume = async (emp: Employee) => {
    setSelectedEmp(emp);
    setModal('resume');
    if (emp.hiringStatus === 'new') {
      store.updateApplicant(emp.id, { hiringStatus: 'resume_viewed' });
    }
  };

  const startInterview = (emp: Employee) => {
    setSelectedEmp(emp);
    setChatMessages(emp.interviewConversation || []);
    setMotivationBonus(emp.interviewMotivationBonus || 0);
    setModal('interview');
    store.updateApplicant(emp.id, { hiringStatus: 'interviewing' });
  };

  const sendInterviewMessage = async () => {
    if (!chatInput.trim() || !selectedEmp || isLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    const newMessages: ConversationMessage[] = [...chatMessages, { role: 'player', content: msg }];
    setChatMessages(newMessages);
    setIsLoading(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee: selectedEmp, playerMessage: msg, conversationHistory: newMessages }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated: ConversationMessage[] = [...newMessages, { role: 'employee', content: data.response }];
        setChatMessages(updated);
        const newBonus = motivationBonus + (data.motivationDelta || 0);
        setMotivationBonus(newBonus);
        store.updateApplicant(selectedEmp.id, {
          interviewConversation: updated,
          interviewMotivationBonus: newBonus,
          hiringStatus: 'interviewing',
        });
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const finishInterview = () => {
    if (!selectedEmp) return;
    store.updateApplicant(selectedEmp.id, { hiringStatus: 'interviewed', interviewConversation: chatMessages, interviewMotivationBonus: motivationBonus });
    setModal('none');
    setSelectedEmp(null);
    setChatMessages([]);
  };

  const openTalk = (emp: Employee) => {
    setSelectedEmp(emp);
    setChatMessages(emp.talkHistory || []);
    setModal('talk');
  };

  const sendTalkMessage = async () => {
    if (!chatInput.trim() || !selectedEmp || isLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    const newMessages: ConversationMessage[] = [...chatMessages, { role: 'player', content: msg }];
    setChatMessages(newMessages);
    setIsLoading(true);
    try {
      const assignedStore = stores.find(s => s.id === selectedEmp.assignedStoreId);
      const res = await fetch('/api/talk-to-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee: selectedEmp,
          playerMessage: msg,
          context: {
            storeName: assignedStore?.name || '未配属',
            isSabotaging: selectedEmp.isSabotaging,
            motivation: selectedEmp.motivation,
            fatigue: selectedEmp.fatigue,
            weeksEmployed: selectedEmp.weeksEmployed,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated: ConversationMessage[] = [...newMessages, { role: 'employee', content: data.response }];
        setChatMessages(updated);
        const newMotivation = Math.min(100, Math.max(0, selectedEmp.motivation + (data.motivationDelta || 0)));
        store.updateEmployee(selectedEmp.id, {
          talkHistory: updated,
          motivation: newMotivation,
          isSabotaging: newMotivation > 40 ? false : selectedEmp.isSabotaging,
        });
        setSelectedEmp({ ...selectedEmp, motivation: newMotivation, talkHistory: updated });
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-matcha-700">👥 人事管理</h1>
          <p className="text-bark-light text-sm">人が会社を作る。良い採用が、良い会社を作る。</p>
        </div>
        {/* Tab switcher */}
        <div className="flex gap-2">
          <button onClick={() => setTab('applicants')} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${tab === 'applicants' ? 'bg-matcha-600 text-white' : 'bg-cream text-bark-light hover:bg-cream-dark'}`}>
            📝 採用 ({applicants.length})
          </button>
          <button onClick={() => setTab('employees')} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${tab === 'employees' ? 'bg-matcha-600 text-white' : 'bg-cream text-bark-light hover:bg-cream-dark'}`}>
            👥 従業員 ({employees.length})
          </button>
        </div>
        {/* Applicants Tab */}
        {tab === 'applicants' && (
          <div className="game-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-matcha-700">📝 応募者リスト</h2>
              <button onClick={handleGenerateApplicants} disabled={isGenerating} className="btn-outline text-sm flex items-center gap-1">
                {isGenerating ? '⏳ 生成中...' : '🔄 新しい応募者を探す (AI)'}
              </button>
            </div>
            {applicants.length === 0 ? (
              <p className="text-sm text-bark-light text-center py-8">応募者がいません。「新しい応募者を探す」をクリックしてAIが候補者を生成します。</p>
            ) : (
              <div className="space-y-3">
                {applicants.map((app) => (
                  <div key={app.id} className={`rounded-lg p-4 border ${app.hiringStatus === 'interviewed' ? 'border-green-300 bg-green-50' : app.hiringStatus === 'interviewing' ? 'border-yellow-300 bg-yellow-50' : app.hiringStatus === 'resume_viewed' ? 'border-blue-200 bg-blue-50' : 'border-cream-dark bg-white'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-sm">
                          {app.role === 'manager' ? '👔' : '🍵'} {app.name}
                          <span className="text-xs font-normal text-bark-light ml-2">{app.age}歳 / {app.role === 'manager' ? 'マネージャー' : 'バリスタ'}</span>
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${app.hiringStatus === 'new' ? 'bg-gray-200 text-gray-600' : app.hiringStatus === 'resume_viewed' ? 'bg-blue-200 text-blue-700' : app.hiringStatus === 'interviewing' ? 'bg-yellow-200 text-yellow-700' : app.hiringStatus === 'interviewed' ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {app.hiringStatus === 'new' ? '📄 未確認' : app.hiringStatus === 'resume_viewed' ? '📄 履歴書確認済' : app.hiringStatus === 'interviewing' ? '🎤 面接中' : app.hiringStatus === 'interviewed' ? '✅ 面接済' : app.hiringStatus}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-matcha-700">¥{app.hourlyWage}/h</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openResume(app)} className="btn-outline text-xs flex-1">📄 履歴書を見る</button>
                      {(app.hiringStatus === 'resume_viewed' || app.hiringStatus === 'interviewing' || app.hiringStatus === 'interviewed') && (
                        <button onClick={() => startInterview(app)} className="btn-outline text-xs flex-1">🎤 面接する</button>
                      )}
                      {app.hiringStatus === 'interviewed' && (
                        <>
                          <button onClick={() => { store.hireEmployee(app.id); }} className="btn-matcha text-xs flex-1">✅ 採用</button>
                          <button onClick={() => store.removeApplicant(app.id)} className="text-xs text-red-500 border border-red-300 rounded px-2 py-1 hover:bg-red-50">✗</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Employees Tab */}
        {tab === 'employees' && (
          <div className="game-card p-5">
            <h2 className="font-bold text-matcha-700 mb-3">📋 現在の従業員 ({employees.length}人)</h2>
            {employees.length === 0 ? (
              <p className="text-sm text-bark-light text-center py-8">まだ従業員がいません。「採用」タブから採用しましょう。</p>
            ) : (
              <div className="space-y-3">
                {employees.map((emp) => {
                  const assignedStore = stores.find(s => s.id === emp.assignedStoreId);
                  return (
                    <div key={emp.id} className={`rounded-lg p-4 ${emp.isSabotaging ? 'bg-red-50 border border-red-300' : 'bg-cream'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-sm">
                            {emp.isSabotaging ? '😴' : emp.role === 'manager' ? '👔' : '🍵'} {emp.name}
                            <span className="text-xs font-normal text-bark-light ml-2">{emp.age}歳 / {emp.role === 'manager' ? 'マネージャー' : 'バリスタ'}</span>
                          </h3>
                          {emp.isSabotaging && <span className="text-xs text-red-600 font-bold">⚠️ サボり中！声をかけてみましょう</span>}
                        </div>
                        <div className="text-right text-xs">
                          <p>時給: ¥{emp.hourlyWage}</p>
                          <p>勤続: {emp.weeksEmployed}週</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                        <div>
                          <p className="text-bark-light">スキル</p>
                          <div className="progress-bar mt-1"><div className="progress-bar-fill bg-blue-500" style={{ width: `${emp.skill}%` }} /></div>
                          <p className="font-bold text-center">{emp.skill}</p>
                        </div>
                        <div>
                          <p className="text-bark-light">スピード</p>
                          <div className="progress-bar mt-1"><div className="progress-bar-fill bg-green-500" style={{ width: `${emp.speed}%` }} /></div>
                          <p className="font-bold text-center">{emp.speed}</p>
                        </div>
                        <div>
                          <p className="text-bark-light">やる気</p>
                          <div className="progress-bar mt-1"><div className={`progress-bar-fill ${emp.motivation >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${emp.motivation}%` }} /></div>
                          <p className="font-bold text-center">{emp.motivation}</p>
                        </div>
                        <div>
                          <p className="text-bark-light">疲労</p>
                          <div className="progress-bar mt-1"><div className="progress-bar-fill bg-red-500" style={{ width: `${emp.fatigue}%` }} /></div>
                          <p className="font-bold text-center">{emp.fatigue}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select value={emp.assignedStoreId || ''} onChange={(e) => store.assignEmployee(emp.id, e.target.value || null)} className="text-sm px-2 py-1.5 rounded border border-cream-dark bg-white flex-1">
                          <option value="">未配属</option>
                          {openStores.map(s => { const a = AREAS.find(ar => ar.id === s.areaId); return <option key={s.id} value={s.id}>{s.name} ({a?.name})</option>; })}
                        </select>
                        <button onClick={() => openTalk(emp)} className="text-xs bg-matcha-100 text-matcha-700 border border-matcha-300 rounded px-3 py-1.5 hover:bg-matcha-200 font-bold">💬 声かけ</button>
                        <button onClick={() => store.fireEmployee(emp.id)} className="text-xs text-red-500 border border-red-300 rounded px-2 py-1.5 hover:bg-red-50">解雇</button>
                      </div>
                      {!emp.assignedStoreId && <p className="text-xs text-yellow-600 mt-1">⚠️ 店舗に配属してください</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Resume Modal */}
      {modal === 'resume' && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setModal('none'); setSelectedEmp(null); }}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-matcha-700 text-white p-4 rounded-t-2xl flex justify-between items-center">
              <h3 className="font-bold">📄 履歴書 — {selectedEmp.name}</h3>
              <button onClick={() => { setModal('none'); setSelectedEmp(null); }} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-matcha-100 rounded-full flex items-center justify-center text-3xl">{selectedEmp.role === 'manager' ? '👔' : '🍵'}</div>
                <div>
                  <h4 className="text-lg font-bold">{selectedEmp.name}</h4>
                  <p className="text-sm text-bark-light">{selectedEmp.age}歳 / {selectedEmp.role === 'manager' ? 'マネージャー志望' : 'バリスタ志望'}</p>
                  <p className="text-sm text-matcha-600 font-bold">希望時給: ¥{selectedEmp.hourlyWage}</p>
                </div>
              </div>
              <div className="bg-cream rounded-lg p-4">
                <h5 className="font-bold text-sm text-matcha-700 mb-1">📋 経歴</h5>
                <p className="text-sm">{selectedEmp.background}</p>
              </div>
              <div className="bg-cream rounded-lg p-4">
                <h5 className="font-bold text-sm text-matcha-700 mb-1">📝 自己PR・履歴書</h5>
                {isLoadingResume ? (
                  <div className="flex items-center gap-2 text-sm text-bark-light py-2">
                    <span className="animate-spin">⏳</span> AIが履歴書を生成中...
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{selectedEmp.resume || '（履歴書情報なし）'}</p>
                )}
              </div>
              <div className="bg-cream rounded-lg p-4">
                <h5 className="font-bold text-sm text-matcha-700 mb-1">💭 第一印象</h5>
                <p className="text-sm">{selectedEmp.personality}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setModal('none'); startInterview(selectedEmp); }} className="btn-matcha flex-1 text-sm">🎤 面接に進む</button>
                <button onClick={() => { setModal('none'); setSelectedEmp(null); }} className="btn-outline flex-1 text-sm">閉じる</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {modal === 'interview' && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <div className="bg-matcha-700 text-white p-4 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="font-bold">🎤 面接 — {selectedEmp.name}</h3>
                <p className="text-xs text-matcha-200">やり取りが採用後のやる気に影響します</p>
              </div>
              <button onClick={finishInterview} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[50vh]">
              {chatMessages.length === 0 && (
                <div className="text-center text-bark-light text-sm py-8">
                  <p>面接を始めましょう。</p>
                  <p className="text-xs mt-1">質問や声かけを入力してください。</p>
                  <div className="mt-3 space-y-1 text-xs text-left bg-cream rounded-lg p-3">
                    <p className="font-bold text-matcha-700">💡 ヒント:</p>
                    <p>・「志望動機は？」「なぜうちを選んだ？」</p>
                    <p>・「あなたの強みは？」「苦手なことは？」</p>
                    <p>・態度によって相手の反応が変わります</p>
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'player' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'player' ? 'bg-matcha-600 text-white rounded-br-md' : 'bg-cream text-bark rounded-bl-md'}`}>
                    <p className="text-[10px] font-bold mb-0.5 opacity-70">{msg.role === 'player' ? '👤 あなた' : `🍵 ${selectedEmp.name}`}</p>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-cream rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-bark-light">💭 考え中...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-cream p-3">
              {chatMessages.length >= 6 && (
                <div className="mb-2 text-center">
                  <button onClick={finishInterview} className="btn-matcha text-sm px-6">✅ 面接を終了する</button>
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendInterviewMessage(); }} placeholder="質問を入力..." className="flex-1 px-3 py-2 rounded-lg border border-cream-dark text-sm" disabled={isLoading} />
                <button onClick={sendInterviewMessage} disabled={isLoading || !chatInput.trim()} className="btn-matcha text-sm px-4">送信</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Talk Modal */}
      {modal === 'talk' && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <div className={`${selectedEmp.isSabotaging ? 'bg-red-600' : 'bg-matcha-700'} text-white p-4 rounded-t-2xl flex justify-between items-center`}>
              <div>
                <h3 className="font-bold">💬 声かけ — {selectedEmp.name}</h3>
                <p className="text-xs opacity-80">
                  {selectedEmp.isSabotaging ? '⚠️ サボり中' : `やる気: ${selectedEmp.motivation}/100`}
                  {' | '}疲労: {selectedEmp.fatigue}/100
                </p>
              </div>
              <button onClick={() => { setModal('none'); setSelectedEmp(null); setChatMessages([]); }} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[50vh]">
              {chatMessages.length === 0 && (
                <div className="text-center text-bark-light text-sm py-8">
                  <p>{selectedEmp.isSabotaging ? `${selectedEmp.name}がサボっています...` : `${selectedEmp.name}に声をかけましょう。`}</p>
                  <div className="mt-3 space-y-1 text-xs text-left bg-cream rounded-lg p-3">
                    <p className="font-bold text-matcha-700">💡 ヒント:</p>
                    <p>・「最近調子どう？」「頑張ってるね」</p>
                    <p>・「サボるな！」「ちゃんとやれ！」</p>
                    <p>・相手の性格に合わせた声かけが重要です</p>
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'player' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'player' ? 'bg-matcha-600 text-white rounded-br-md' : 'bg-cream text-bark rounded-bl-md'}`}>
                    <p className="text-[10px] font-bold mb-0.5 opacity-70">{msg.role === 'player' ? '👤 社長' : `🍵 ${selectedEmp.name}`}</p>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-cream rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-bark-light">💭 ...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-cream p-3">
              <div className="flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendTalkMessage(); }} placeholder="声かけを入力..." className="flex-1 px-3 py-2 rounded-lg border border-cream-dark text-sm" disabled={isLoading} />
                <button onClick={sendTalkMessage} disabled={isLoading || !chatInput.trim()} className="btn-matcha text-sm px-4">送信</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
