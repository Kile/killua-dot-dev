import React from 'react';
import { Sparkles, Zap, ClipboardList, ImageIcon, MessageCircle, Gamepad2 } from 'lucide-react';

export interface BotCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
}

export const botCategories: BotCategory[] = [
  { id: 'hxh', title: '...is Hunter x Hunter themed with tons of references', icon: <Sparkles className="w-6 h-6" /> },
  { id: 'activity', title: '...brings activity up in my server', icon: <Zap className="w-6 h-6" /> },
  { id: 'organize', title: '...organizes my server and tasks right on Discord', icon: <ClipboardList className="w-6 h-6" /> },
  { id: 'shitpost', title: '...perfects my shitposting', icon: <ImageIcon className="w-6 h-6" /> },
  { id: 'expression', title: '...helps in conversations with references and expression', icon: <MessageCircle className="w-6 h-6" /> },
  { id: 'games', title: '...has single and multiplayer games to play with friends', icon: <Gamepad2 className="w-6 h-6" /> }
];


