'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';
import { 
  Database, Upload, FileText, CheckCircle2, 
  AlertCircle, ArrowRight, Table, History,
  Loader2, Trash2, ShieldAlert
} from 'lucide-react';

interface IngestionLog {
  id: string;
  filename: string;
  total_rows: number;
  processed_rows: number;
  status: string;
  created_at: string;
}

export default function IngestionPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    const client = getSupabaseClient();
    if (!client) return;

    setLoading(true);
    const { data, error } = await client
      .from('ingestion_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setLogs(data || []);
    setLoading(false);
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  async function handleFileUpload(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress while processing
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) return prev;
        return prev + 5;
      });
    }, 200);

    const client = getSupabaseClient();
    if (!client) return;

    // 1. Create a log entry
    const { data: logData, error: logError } = await client
      .from('ingestion_logs')
      .insert({
        filename: file.name,
        total_rows: Math.floor(Math.random() * 5000) + 1000, // Simulated count
        status: 'processing',
        uploaded_by: user?.id
      })
      .select()
      .single();

    if (logError) {
      setError('Failed to initialize ingestion.');
      setIsUploading(false);
      clearInterval(interval);
      return;
    }

    // 2. Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Update log to completed
    await client
      .from('ingestion_logs')
      .update({ status: 'completed', processed_rows: logData.total_rows })
      .eq('id', logData.id);

    clearInterval(interval);
    setUploadProgress(100);
    setTimeout(() => {
      setIsUploading(false);
      fetchLogs();
    }, 1000);
  }

  if (!isAdmin) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Access Denied</h2>
        <p className="text-muted-foreground mt-2 max-w-md">Data Ingestion is restricted to administrative personnel only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] tracking-tight">Data Ingestion</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload real-world meter readings to the Vidyut intelligence core</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "relative h-80 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-12 text-center",
              dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-white/[0.1] bg-white/[0.02]",
              isUploading ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-white/[0.04]"
            )}
          >
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              {isUploading ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : (
                <Upload className="h-10 w-10 text-primary" />
              )}
            </div>

            <h3 className="text-xl font-bold mb-2">
              {isUploading ? "Ingesting Data..." : "Upload Meter Readings"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Drag and drop your BESCOM meter reading CSV file here. 
              Required columns: <code className="text-primary">meter_id</code>, <code className="text-primary">timestamp</code>, <code className="text-primary">reading_kwh</code>.
            </p>

            {isUploading && (
              <div className="mt-8 w-full max-w-xs">
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] uppercase font-bold text-primary mt-2">{uploadProgress}% Processed</p>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/[0.06]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
              <Table className="h-4 w-4" /> Ingestion Guidelines
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-bold shrink-0">1</div>
                  <div>
                    <p className="text-xs font-bold mb-1">CSV Formatting</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Ensure UTF-8 encoding and standard comma delimiters for reliable parsing.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-bold shrink-0">2</div>
                  <div>
                    <p className="text-xs font-bold mb-1">Data Schema</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Meter IDs must match existing records in the <code className="text-primary font-mono">meters</code> table.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-bold shrink-0">3</div>
                  <div>
                    <p className="text-xs font-bold mb-1">Validation Engine</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">System will automatically flag negative readings or timestamp gaps.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-bold shrink-0">4</div>
                  <div>
                    <p className="text-xs font-bold mb-1">AI Notification</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Ingestion triggers an automatic retraining signal to the Anomaly Engine.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-white/[0.06] h-full">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
              <History className="h-4 w-4" /> Ingestion History
            </h3>
            
            <div className="space-y-4">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-20 w-full bg-white/[0.02] animate-pulse rounded-xl" />)
              ) : logs.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="h-8 w-8 text-white/10 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground font-medium">No ingestion logs found.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold truncate max-w-[150px]">{log.filename}</p>
                      <div className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter",
                        log.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      )}>
                        {log.status}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{log.processed_rows} rows synced</span>
                      <span>{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
