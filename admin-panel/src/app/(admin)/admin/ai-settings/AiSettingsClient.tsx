"use client";

import React, { useState } from "react";
import { AiAgent } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { addAiAgent, deleteAiAgent, setActiveAiAgent } from "./actions";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface AiSettingsClientProps {
  initialAgents: AiAgent[];
}

export const AiSettingsClient = ({ initialAgents }: AiSettingsClientProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<{id: string, name: string} | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          variant="primary" 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {showAddForm ? "Huỷ bỏ" : "Thêm Agent mới"}
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Cấu hình Agent mới
          </h2>
          <form 
            action={async (formData) => {
              await addAiAgent(formData);
              setShowAddForm(false);
            }} 
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Tên hiển thị</label>
              <input 
                name="name" 
                required 
                placeholder="Ví dụ: Gemini Pro Main" 
                className="w-full bg-[#1e293b]/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Provider</label>
              <select 
                name="provider" 
                required 
                className="w-full bg-[#1e293b]/50 border border-border rounded-lg px-4 py-2.5 text-sm outline-none"
              >
                <option value="GEMINI">Google Gemini</option>
                <option value="CLAUDE">Anthropic Claude</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Model</label>
              <input 
                name="model" 
                required 
                placeholder="Ví dụ: gemini-2.0-pro-exp-02-05" 
                className="w-full bg-[#1e293b]/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Type</label>
              <input 
                name="type" 
                required 
                placeholder="Ví dụ: Chat, Vision..." 
                className="w-full bg-[#1e293b]/50 border border-border rounded-lg px-4 py-2.5 text-sm outline-none"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">API KEY</label>
              <input 
                name="apiKey" 
                type="password" 
                required 
                placeholder="Nhập API Key của bạn..." 
                className="w-full bg-[#1e293b]/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2 pt-2 flex justify-end">
              <Button type="submit" variant="success" className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8">
                LƯU CẤU HÌNH
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialAgents.length === 0 ? (
          <div className="md:col-span-full py-20 bg-card/40 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="font-medium">Chưa có AI Agent nào được tạo</p>
            <p className="text-xs mt-1 opacity-60">Vui lòng thêm Agent mới để bắt đầu sử dụng</p>
          </div>
        ) : (
          initialAgents.map((agent) => (
            <div 
              key={agent.id} 
              className={`relative bg-card border ${agent.status === 1 ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'} rounded-2xl p-6 transition-all hover:scale-[1.02] duration-300 overflow-hidden group`}
            >
              {agent.status === 1 && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-bl-xl uppercase tracking-wider">
                  Đang hoạt động
                </div>
              )}
              
              <div className="flex items-start gap-4 mb-6">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${agent.provider === 'GEMINI' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {agent.provider === 'GEMINI' ? (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" fill="white" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{agent.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">{agent.provider}</span>
                    <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[120px]">{agent.model}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs py-2 border-y border-border/50">
                  <span className="text-muted-foreground">Model type:</span>
                  <span className="text-foreground font-medium">{agent.type}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">API Key:</span>
                  <span className="text-foreground font-mono">••••••••••••••••</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                {agent.status === 0 ? (
                  <Button 
                    onClick={() => setActiveAiAgent(agent.id)}
                    className="flex-1 text-xs font-bold"
                    variant="outline"
                  >
                    KÍCH HOẠT
                  </Button>
                ) : (
                  <div className="flex-1 h-9 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 rounded-md bg-primary/5">
                    ĐÃ CHỌN
                  </div>
                )}
                <Button 
                  onClick={() => setAgentToDelete({ id: agent.id, name: agent.name })}
                  variant="danger" 
                  size="sm"
                  className="h-9 w-9 p-0 flex items-center justify-center bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={agentToDelete !== null}
        onClose={() => setAgentToDelete(null)}
        onConfirm={() => {
          if (agentToDelete) {
            deleteAiAgent(agentToDelete.id);
            setAgentToDelete(null);
          }
        }}
        title="Xoá Agent"
        message={`Bạn có chắc muốn xoá Agent "${agentToDelete?.name}"? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
};
