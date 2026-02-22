import React, { useState } from 'react';
import { generateGarmentDescription, interpretGarment, executeDesign } from '../services/aiService';
import { ScanFace, FileText, Image as ImageIcon, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function LabConsole() {
  const [input, setInput] = useState('');
  const [describerOutput, setDescriberOutput] = useState('');
  const [interpreterOutput, setInterpreterOutput] = useState('');
  const [executionImage, setExecutionImage] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'describer' | 'interpreter' | 'execution' | 'complete' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const runPipeline = async () => {
    if (!input.trim()) return;
    
    setStatus('describer');
    setErrorMsg('');
    setDescriberOutput('');
    setInterpreterOutput('');
    setExecutionImage('');

    try {
      // Step 1: Garment Describer (formerly Brain)
      const description = await generateGarmentDescription(input);
      setDescriberOutput(description);
      
      // Step 2: Interpreter
      setStatus('interpreter');
      const specs = await interpretGarment(description);
      setInterpreterOutput(specs);

      // Step 3: Execution
      setStatus('execution');
      const imageUrl = await executeDesign(specs);
      setExecutionImage(imageUrl);
      
      setStatus('complete');
    } catch (err) {
      console.error(err);
      setErrorMsg('Pipeline failed. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans p-4 md:p-8">
      <header className="mb-8 border-b border-[#141414] pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">Model Fit Lab</h1>
          <p className="text-sm font-mono opacity-60 mt-1">Garment Structure Stabilizer v2.0</p>
        </div>
        <div className="text-xs font-mono uppercase tracking-widest opacity-50 hidden md:block">
          System Status: {status === 'idle' ? 'Ready' : status === 'error' ? 'Error' : 'Processing...'}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: GARMENT DESCRIBER */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-2">
            <ScanFace className="w-5 h-5" />
            <h2 className="font-serif italic font-bold text-lg">01. 의상설명자</h2>
          </div>
          
          <div className="bg-white p-4 rounded-sm shadow-sm border border-[#141414]/10">
            <label className="block text-xs font-mono uppercase mb-2 opacity-50">Input Prompt</label>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the physical structure of the main garment only. No styling."
              className="w-full bg-[#f5f5f5] border border-transparent focus:border-[#141414] p-3 text-sm min-h-[100px] outline-none transition-all font-mono resize-none"
            />
            <button 
              onClick={runPipeline}
              disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              className="mt-4 w-full bg-[#141414] text-[#E4E3E0] py-3 px-4 text-xs font-mono uppercase tracking-widest hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? (
                <>Initialize Sequence <ArrowRight className="w-3 h-3" /></>
              ) : (
                <><Loader2 className="w-3 h-3 animate-spin" /> Processing</>
              )}
            </button>
          </div>

          {describerOutput && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-sm shadow-sm border-l-4 border-[#141414]"
            >
              <div className="text-xs font-mono uppercase mb-2 opacity-50 flex justify-between">
                <span>Stabilized Structure</span>
                {status === 'describer' && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
              <p className="text-sm leading-relaxed font-serif">{describerOutput}</p>
            </motion.div>
          )}
        </div>

        {/* COLUMN 2: INTERPRETER */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-2 opacity-80">
            <FileText className="w-5 h-5" />
            <h2 className="font-serif italic font-bold text-lg">02. Interpreter</h2>
          </div>

          <div className={`bg-white p-4 rounded-sm shadow-sm border border-[#141414]/10 min-h-[200px] transition-opacity ${status === 'idle' || status === 'describer' ? 'opacity-50' : 'opacity-100'}`}>
             <div className="text-xs font-mono uppercase mb-2 opacity-50 flex justify-between">
                <span>Structured Specs</span>
                {status === 'interpreter' && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
              
              {interpreterOutput ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-xs whitespace-pre-wrap leading-tight text-[#333]"
                >
                  {interpreterOutput}
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-mono opacity-30 italic">
                  Waiting for Describer output...
                </div>
              )}
          </div>
          
          <div className="bg-[#141414]/5 p-3 rounded-sm text-[10px] font-mono text-[#141414]/60">
            <strong className="block mb-1 uppercase">Active Filters:</strong>
            <ul className="list-disc pl-4 space-y-1">
              <li>Main Garment Only</li>
              <li>No Accessory Expansion</li>
              <li>No Styling Variation</li>
              <li>Structural Stability Check</li>
            </ul>
          </div>
        </div>

        {/* COLUMN 3: EXECUTION */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#141414]/20 pb-2 opacity-80">
            <ImageIcon className="w-5 h-5" />
            <h2 className="font-serif italic font-bold text-lg">03. Execution</h2>
          </div>

          <div className={`bg-white p-2 rounded-sm shadow-sm border border-[#141414]/10 aspect-[3/4] flex items-center justify-center overflow-hidden relative transition-opacity ${status === 'execution' || status === 'complete' ? 'opacity-100' : 'opacity-50'}`}>
            {executionImage ? (
              <motion.img 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={executionImage} 
                alt="Generated Fashion Design" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                {status === 'execution' ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                    <span className="text-xs font-mono uppercase opacity-50">Rendering...</span>
                  </div>
                ) : (
                  <span className="text-xs font-mono uppercase opacity-30 italic">Waiting for Specs...</span>
                )}
              </div>
            )}
            
            {/* Overlay Data */}
            {executionImage && (
              <div className="absolute bottom-0 left-0 right-0 bg-[#141414]/90 text-white p-2 text-[10px] font-mono flex justify-between items-center backdrop-blur-sm">
                 <span>IMG_GEN_V2.5</span>
                 <span className="opacity-50">1024x1024</span>
              </div>
            )}
          </div>

          {errorMsg && (
             <div className="bg-red-50 text-red-600 p-3 text-xs font-mono border border-red-200 rounded-sm">
               Error: {errorMsg}
             </div>
          )}
        </div>

      </main>
    </div>
  );
}
