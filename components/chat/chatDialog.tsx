'use client';

import React, { useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Spinner } from '../ui/spinner';
import ReactMarkdown from 'react-markdown';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
type ChatMessage = { type: 'user' | 'ai'; text: string };

// Main Chat Button Component
const ChatDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const suggestedQuestions = [
    "How does RidePlus work?",
    "Is RidePlus available in my city?",
    "How can I book a RidePlus ride?",
    "What are the fares for RidePlus?",
    "How do I contact RidePlus customer support?",
    "What payment options are available on RidePlus?",
    "How can I cancel or modify my RidePlus booking?",
    "Are RidePlus rides safe for solo travelers?",
    "Does RidePlus provide ride history or receipts?"
  ];
  

  const handleSuggestedClick = (suggested: string) => {
    setQuestion(suggested);
    // Close the popup and open the sheet
    setIsOpen(false);
    setIsSheetOpen(true);
    // Automatically send the question
    handleSendWithQuestion(suggested);
  };

  const handleSendWithQuestion = async (q: string) => {
    const trimmedQuestion = q.trim();
    if (!trimmedQuestion || sending) return;
    
    const nextMessages: ChatMessage[] = [...messages, { type: 'user', text: trimmedQuestion }];
    setMessages(nextMessages);
    setSending(true);
    
    try {
      const payload = {
        messages: [
          { role: 'system', content: 'You are Ride Booking Expert u have been integrated as a chatbot for RidePlus platform its a ridesharing platform similar to blablacar assist user o different queries ur response should be in that format so the react-markdown library can handle it accordingly ' },
          ...nextMessages.map((m) =>
            m.type === 'user'
              ? { role: 'user' as const, content: m.text }
              : { role: 'assistant' as const, content: m.text }
          ),
        ],
      };
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch AI response');
      }
      
      const data = (await res.json()) as { text?: string };
      const aiText = data.text?.trim() || 'Sorry, I could not generate a response.';
      setMessages((prev) => [...prev, { type: 'ai', text: aiText }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { type: 'ai', text: 'There was an error fetching the AI response. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    const q = question.trim();
    if (!q || sending) return;
    
    // If sheet is not open, open it
    if (!isSheetOpen) {
      setIsOpen(false);
      setIsSheetOpen(true);
    }
    
    const nextMessages: ChatMessage[] = [...messages, { type: 'user', text: q }];
    setMessages(nextMessages);
    setQuestion('');
    setSending(true);
    
    try {
      const payload = {
        messages: [
          { role: 'system', content: 'You are Kanha AI, an assistant specializing in spiritual tourism in India.' },
          ...nextMessages.map((m) =>
            m.type === 'user'
              ? { role: 'user' as const, content: m.text }
              : { role: 'assistant' as const, content: m.text }
          ),
        ],
      };
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch AI response');
      }
      
      const data = (await res.json()) as { text?: string };
      const aiText = data.text?.trim() || 'Sorry, I could not generate a response.';
      setMessages((prev) => [...prev, { type: 'ai', text: aiText }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { type: 'ai', text: 'There was an error fetching the AI response. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="fixed bottom-14 md:bottom-20 right-4 z-50">
        {/* Chat Button */}
        {!isOpen && !isSheetOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-primary hover:bg-primary/90 w-14 h-14 text-primary-foreground rounded-full p-4 shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-7 h-7" />
          </button>
        )}

        {/* Small Popup with Suggestions */}
        {isOpen && !isSheetOpen && (
          <div className=" rounded-lg shadow-2xl w-96 max-h-[500px] flex flex-col border ">
            {/* Header */}
            <div className="bg-primary p-4 text-primary-foreground rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold">Ask AI</h3>
                </div>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                className="rounded-full  transition-colors"
                variant={"ghost"}
                size={"icon"}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Suggestions Content */}
            <div className="flex-1 rounded-lg space-y-4 bg-background p-4">
              
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedClick(q)}
                      className="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none border text-xs bg-primary/10 border-primary/20 text-primary hover:bg-primary/5  rounded-full px-3 py-1 h-auto disabled:opacity-50"                    >

                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                <div className="flex-1 flex items-center px-2  rounded-3xl border border-muted-foreground relative">
                  <Sparkles className='text-muted-foreground'/>
                  <Input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your question"
                    className=' shadow-none focus-visible:ring-0 bg-transparent'
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!question.trim() || sending}
                  className='rounded-full h-12 w-12'
                  size={"icon"}
                >
                  <Send className="w-6 h-6" />
                </Button>
            </div>
            </div>

             
          </div>
        )}
      </div>

      {/* Full Screen Sheet for Chat */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 z-[999999]  flex flex-col">
         <div className="border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">RidePlus AI</h2>
            </div>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setIsSheetOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1  overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.type === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'border shadow-sm max-w-[90%] p-3 border-none rounded-none bg-primary text-primary-foreground rounded-l-[14px] rounded-tr-[14px] rounded-br-none text-sm  font-medium'
                      : 'border shadow-sm max-w-[90%] p-3 border-none rounded-none bg-muted/70 text-foreground rounded-r-[14px] rounded-tl-[14px] rounded-bl-none leading-relaxed  text-sm font-medium'
                  }`}
                >
                  {msg.type === 'ai' ? (
                    <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-a:text-orange-700 prose-a:underline">
                      <ReactMarkdown >{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <span 
                    >{msg.text}</span>
                  )}
                </div>
                {msg.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Kanha is typing...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input Area in Sheet */}
          <div className=" p-4 bg-muted/60 rounded-t-2xl shadow-2xl">
            <div className="flex items-end gap-2">
            <div className="flex-1 flex items-center px-2  rounded-3xl border border-muted-foreground relative">
            <Sparkles className='text-muted-foreground'/>

                <Input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your question"
                  className=' shadow-none focus-visible:ring-0 bg-transparent h-10'
                  />
              </div>
              <Button
                onClick={handleSend}
                disabled={!question.trim() || sending}
                className='h-10'
              >
                {sending ? <Spinner /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ChatDialog;