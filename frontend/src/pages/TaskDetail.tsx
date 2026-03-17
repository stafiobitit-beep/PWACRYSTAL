import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Send, Camera, AlertCircle, CheckCircle2, Play, MessageSquare, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';

const TaskDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'PHOTOS' | 'INFO'>('CHAT');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchTask = async () => {
    try {
      const { data } = await client.get(`/tasks/${id}`);
      setTask(data);
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
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task?.messages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      const { data } = await client.post(`/tasks/${id}/messages`, { content: message });
      setTask((prev: any) => ({ ...prev, messages: [...prev.messages, data] }));
      setMessage('');
    } catch (error) {
      toast.error('Bericht niet verzonden');
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

    try {
      // Compression
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      
      // In a real app, we'd upload to S3/Cloudinary and get a URL
      // For MVP, we'll use a data URL as a placeholder or mock value
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result;
        const { data } = await client.post(`/tasks/${id}/photos`, { url: base64data, type: 'GENERAL' });
        setTask((prev: any) => ({ ...prev, photos: [...prev.photos, data] }));
        toast.success('Foto geüpload!');
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast.error('Foto upload mislukt');
    }
  };

  const handleReportIncident = async () => {
    const description = prompt('Beschrijf het probleem:');
    if (!description) return;
    try {
      await client.post(`/tasks/${id}/incidents`, { description });
      toast.error('Incident gemeld');
      fetchTask();
    } catch (error) {
      toast.error('Melding mislukt');
    }
  };

  if (loading) return <div className="p-6 pt-12 text-center text-gray-500 font-medium">Laden...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col max-h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 active:bg-gray-100 rounded-full transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 px-4 truncate">
          <h1 className="font-black text-lg text-gray-900 truncate">{task.title}</h1>
          <p className="text-xs text-gray-500 font-medium truncate">{task.location?.name}</p>
        </div>
        <button onClick={handleReportIncident} className="p-2 text-red-500 active:bg-red-50 rounded-full transition-all">
          <AlertCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 py-2 bg-gray-50/50 shrink-0">
        <button 
          onClick={() => setActiveTab('CHAT')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'CHAT' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400'}`}
        >
          <MessageSquare className="w-4 h-4" /> Chat
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
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`message-bubble ${msg.senderId === user.id ? 'message-sent shadow-sm' : 'message-received shadow-sm'}`}
                >
                  <p className="text-[10px] font-bold opacity-50 mb-1">{msg.sender?.name}</p>
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
              <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
                <img src={photo.url} alt="Task" className="w-full h-full object-cover" />
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
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Status</h3>
              <div className="flex gap-3">
                {task.status === 'PLANNED' && (
                  <button onClick={() => handleStatusUpdate('IN_PROGRESS')} className="flex-1 bg-primary-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-200 active:scale-95 transition-all">
                    <Play className="w-5 h-5" /> Starten
                  </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <button onClick={() => handleStatusUpdate('DONE')} className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 active:scale-95 transition-all">
                    <CheckCircle2 className="w-5 h-5" /> Afronden
                  </button>
                )}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex-1">
                  <p className="text-xs text-gray-400 font-bold mb-1">Huidige Status</p>
                  <p className="font-black text-gray-900">{task.status}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Beschrijving</h3>
              <p className="p-5 bg-gray-50 rounded-2xl text-gray-700 font-medium leading-relaxed">
                {task.description || 'Geen beschrijving beschikbaar.'}
              </p>
            </section>

            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Locatie</h3>
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="font-black text-gray-900 mb-1">{task.location?.name}</p>
                <p className="text-gray-500 font-medium">{task.location?.address}</p>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Input / Controls */}
      <div className="bg-white p-4 border-t border-gray-100 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        {activeTab === 'CHAT' ? (
          <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
            <label className="p-3 bg-gray-100 rounded-2xl text-gray-500 active:bg-gray-200 transition-all shrink-0 cursor-pointer">
              <Camera className="w-6 h-6" />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bericht..." 
              className="flex-1 bg-gray-100 border-none rounded-2xl py-3 px-4 focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all text-sm font-medium"
            />
            <button type="submit" className="p-3 bg-primary-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all shrink-0">
              <Send className="w-6 h-6" />
            </button>
          </form>
        ) : activeTab === 'PHOTOS' ? (
          <label className="flex items-center justify-center gap-2 w-full bg-primary-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary-200 active:scale-95 transition-all cursor-pointer">
            <Camera className="w-6 h-6" /> Foto toevoegen
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </label>
        ) : null}
      </div>
    </div>
  );
};

export default TaskDetail;
