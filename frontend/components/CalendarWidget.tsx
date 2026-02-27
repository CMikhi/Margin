'use client'

import { motion } from 'framer-motion';
import CalendarComponent from '../app/calander/calendar';

interface CalendarWidgetProps {
  id: string;
  onDelete: (id: string) => void;
}

const fadeIn = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export function CalendarWidget({ id, onDelete }: CalendarWidgetProps) {
  return (
    <motion.div 
      variants={fadeIn} 
      initial="hidden" 
      animate="visible" 
      className="h-full w-full overflow-hidden"
    >
      <CalendarComponent />
    </motion.div>
  );
}
