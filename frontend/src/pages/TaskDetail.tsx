import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Send, Camera, AlertCircle, CheckCircle2, Play, MessageSquare, Image as ImageIcon, Clock, StopCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';

const TaskDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'PHOTOS' | 'INFO'>('CHAT');
  const [timerInSeconds, setTimerInSeconds] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reporting, setReporting] = useState(false);

  const fetchTask = async () => {
    try {
      const { data } = await client.get(`/tasks/${id}`);
      setTask(data);
      if (data.timerStartedAt) {
        const start = new Date(data.timerStartedAt).getTime();
        setTimerInSeconds(Math.floor((Date.now() - start) / 1000));
      }
    } catch (error) {
      toast.error('Fout bij laden van taak');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  useEffect(() => {
    let interval: any;
    if (task?.timerStartedAt) {
      interval = setInterval(() => {
        setTimerInSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setTimerInSeconds(0);
    }
    return () => clearInterval(interval);
  }, [task?.timerStartedAt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task?.messages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      const { data } = await client.post(`/tasks/${id}/messages`, { 
        content: message,
        odooTaskId: task.odooTaskId 
      });
      setTask((prev: any) => ({ ...prev, messages: [...prev.messages, data] }));
      setMessage('');
    } catch (error) {
      toast.error('Bericht niet verzonden');
    }
  };

  const handleStartTimer = async () => {
    try {
      const { data } = await client.post(`/tasks/${id}/timer/start`);
      setTask(data);
      toast.success('Timer gestart!');
    } catch (error) {
      toast.error('Kon timer niet starten');
    }
  };

  const handleStopTimer = async () => {
    try {
      const { data } = await client.post(`/tasks/${id}/timer/stop`);
      setTask(data.task);
      toast.success(`Afgewerkt! Tijd opgeslagen: ${data.timesheet.duration} min`);
    } catch (error) {
      toast.error('Kon timer niet stoppen');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await client.patch(`/tasks/${id}/status`, { status: newStatus });
      setTask((prev: any) => ({ ...prev, status: newStatus }));
      toast.success(`Status bijgewerkt naar ${newStatus}`);
    } catch (error) {
      toast.error('Status kon niet worden bijgewerkt');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Foto voorbereiden...');
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = async () => {
        const base64data = reader.result;
        try {
          const { data } = await client.post(`/tasks/${id}/photos`, {
            url: base64data,
            type: 'USER_UPLOAD',
            odooTaskId: task.odooTaskId,
            fileName: file.name
          });
          setTask((prev: any) => ({ ...prev, photos: [...(prev.photos || []), data] }));
          toast.success('Foto succesvol geüpload!', { id: toastId });
          setActiveTab('PHOTOS');
        } catch (err) {
          toast.error('Upload naar server mislukt', { id: toastId });
        }
      };
    } catch (error) {
      toast.error('Fout bij comprimeren foto', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReportIncident = async () => {
    if (!incidentDescription.trim()) return;
    setReporting(true);
    try {
      const { data } = await client.post(`/tasks/${id}/incidents`, {
        description: incidentDescription,
        odooTaskId: task.odooTaskId
      });
      setTask((prev: any) => ({ ...prev, incidents: [...(prev.incidents || []), data], status: 'ISSUE' }));
      toast.success('Incident gemeld');
      setShowIncidentForm(false);
      setIncidentDescription('');
    } catch (error) {
      toast.error('Melden incident mislukt');
    } finally {
      setReporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v < 10 ? '0' + v : v).filter((v, i) => v !== '00' || i > 0).join(':');
  };

  if (loading) return <div className="p-6 pt-12 text-center text-gray-500 font-medium">Laden...</div>;
  if (!task) return <div className="p-12 text-center">Taak niet gevonden. <button onClick={() => navigate('/')} className="text-primary-600 font-bold">Terug</button></div>;

  const isCleaner = user.role === 'CLEANER';
  const isCustomer = user.role === 'CUSTOMER';

  return (
    <div className="min-h-screen bg-white flex flex-col max-h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm relative z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 active:bg-gray-100 rounded-full transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 px-4 truncate">
          <h1 className="font-black text-lg text-gray-900 truncate">{task.title}</h1>
          <p className="text-xs text-gray-500 font-medium truncate">{task.location?.name || 'Zonder locatie'}</p>
        </div>
        {!isCustomer && (
          <button onClick={() => setShowIncidentForm(true)} className="p-2 text-red-500 active:bg-red-50 rounded-full transition-all">
            <AlertCircle className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Timer Bar (Cleaner only) */}
      {isCleaner && (
        <div className={`p-4 flex items-center justify-between transition-all duration-500 shadow-inner ${task.timerStartedAt ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${task.timerStartedAt ? 'animate-pulse' : ''}`} />
            <span className="font-black text-xl tracking-tighter font-mono">
              {task.timerStartedAt ? formatTime(timerInSeconds) : '00:00:00'}
            </span>
          </div>
          {task.timerStartedAt ? (
            <button onClick={handleStopTimer} className="bg-white text-primary-600 px-6 py-2 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">
              STOP
            </button>
          ) : (
            <button onClick={handleStartTimer} className="bg-primary-600 text-white px-6 py-2 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all border border-white/20">
              START
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex px-4 py-2 bg-gray-50/50 shrink-0">
        <button 
          onClick={() => setActiveTab('CHAT')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'CHAT' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400'}`}
        >
          <MessageSquare className="w-4 h-4" /> {isCustomer ? 'Contact' : 'Chat'}
        </button>
        <button 
          onClick={() => setActiveTab('PHOTOS')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'PHOTOS' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400'}`}
        >
          <ImageIcon className="w-4 h-4" /> Foto's
        </button>
        <button 
          onClick={() => setActiveTab('INFO')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'INFO' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400'}`}
        >
          <AlertCircle className="w-4 h-4" /> Info
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#efe7de] relative no-scrollbar">
        {activeTab === 'CHAT' && (
          <div className="p-4 flex flex-col min-h-full">
            <AnimatePresence initial={false}>
              {task.messages?.map((msg: any) => (
                <motion.div 
                   key={msg.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className={`message-bubble ${msg.senderId === user.id ? 'message-sent shadow-sm' : 'message-received shadow-sm'}`}
                >
                  <p className="text-[10px] font-bold opacity-50 mb-1">{msg.sender?.name || (msg.senderId === user.id ? 'Ik' : 'Systeem')}</p>
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                  <p className="text-[10px] text-right mt-1 opacity-40">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        )}

        {activeTab === 'PHOTOS' && (
          <div className="p-6 grid grid-cols-2 gap-4 bg-white min-h-full">
            {task.photos?.map((photo: any) => (
              <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm relative group">
                <img src={photo.url} alt="Task" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/40 p-2 text-[10px] text-white font-bold backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {photo.type}
                </div>
              </div>
            ))}
            {task.photos?.length === 0 && (
              <div className="col-span-2 text-center py-12 text-gray-400 font-medium">Nog geen foto's</div>
            )}
          </div>
        )}

        {activeTab === 'INFO' && (
          <div className="p-6 bg-white min-h-full space-y-8">
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Huidige Status</h3>
              <div className="p-5 bg-gray-50 rounded-[24px] border border-gray-100 flex items-center justify-between shadow-inner">
                <span className="font-black text-gray-900 text-lg uppercase tracking-wider">{task.status}</span>
                {task.status === 'DONE' && <CheckCircle2 className="text-green-500 w-8 h-8" />}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Beschrijving</h3>
              <p className="p-5 bg-gray-50 rounded-[24px] text-gray-700 font-medium leading-relaxed border border-gray-100">
                {task.description || 'Geen specifieke instructies.'}
              </p>
            </section>

            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Locatie</h3>
              <div className="p-5 bg-primary-50 rounded-[24px] border border-primary-100">
                <p className="font-black text-primary-900 mb-1">{task.location?.name}</p>
                <p className="text-primary-600/70 font-medium text-sm">{task.location?.address}</p>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Input / Controls */}
      <div className="bg-white p-4 border-t border-gray-100 shrink-0 shadow-lg">
        {activeTab === 'CHAT' ? (
          <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
              className="p-3 bg-gray-100 rounded-2xl text-gray-500 active:bg-gray-200 transition-all shrink-0 disabled:opacity-50"
            >
              <Camera className={`w-6 h-6 ${uploading ? 'animate-pulse' : ''}`} />
            </button>
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isCustomer ? "Stuur een bericht naar support..." : "Typ een update..."} 
              className="flex-1 bg-gray-100 border-none rounded-2xl py-4 px-4 focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all text-sm font-bold"
            />
            <button type="submit" className="p-4 bg-primary-600 text-white rounded-2xl shadow-xl active:scale-90 transition-all shrink-0">
              <Send className="w-6 h-6" />
            </button>
          </form>
        ) : activeTab === 'PHOTOS' ? (
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="flex items-center justify-center gap-2 w-full bg-primary-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-primary-100 active:scale-95 transition-all disabled:opacity-50"
          >
            <Camera className={`w-6 h-6 ${uploading ? 'animate-pulse' : ''}`} /> {uploading ? 'UPLOADING...' : 'FOTO TOEVOEGEN'}
          </button>
        ) : isCleaner && task.status !== 'DONE' ? (
          <button onClick={() => handleStatusUpdate('DONE')} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-green-100 active:scale-95 transition-all">
            TASK AFRONDEN
          </button>
        ) : null}
      </div>

      {/* Incident Form Modal */}
      <AnimatePresence>
        {showIncidentForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIncidentForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <AlertCircle className="text-red-500" /> Incident Melden
                </h2>
                <button onClick={() => setShowIncidentForm(false)} className="text-gray-400 font-bold">SLUIT</button>
              </div>
              <p className="text-sm text-gray-500 mb-4 font-medium">Wat is er aan de hand? Beschrijf het probleem zo duidelijk mogelijk.</p>
              <textarea 
                rows={4}
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:border-red-500 transition-all outline-none mb-6"
                placeholder="Bijv: Sleutel afgebroken, vlek niet weg te krijgen..."
              />
              <button 
                onClick={handleReportIncident}
                disabled={reporting || !incidentDescription.trim()}
                className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black shadow-xl shadow-red-100 active:scale-95 transition-all disabled:opacity-50"
              >
                {reporting ? 'MELDING VERSTUREN...' : 'MELDING VERSTUREN'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default TaskDetail;
