import React from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import AiAgent from '../components/AiAgent';

export default function AiPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', color: '#18181b' }}>
      <Head>
        <title>UniFAIR AI Assistant | Optimize DeFi</title>
      </Head>
      <Navbar />
      
      <main className="min-h-[819px] flex flex-col items-center justify-center px-6 py-20">
        <h1 className="text-5xl text-center mb-4 text-black">
          UniFAIR AI Assistant
        </h1>
        <p className="font-body text-zinc-500 text-lg text-center max-w-md mx-auto mb-12 font-medium">
          Execute highly optimized on-chain operations using natural language. Fast, secure, and intent-driven.
        </p>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <AiAgent />
        </div>
      </main>
    </div>
  );
}
