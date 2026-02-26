'use client';

import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export function WelcomeWidget() {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Let's start making a page!
        </h2>
        <ol className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <li className="flex gap-3">
            <span className="font-semibold flex-shrink-0">1.</span>
            <span>
              Click{' '}
              <kbd
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-default)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  display: 'inline-block',
                  marginLeft: '2px',
                  marginRight: '2px',
                }}
              >
                ⌘K
              </kbd>{' '}
              for Mac and{' '}
              <kbd
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-default)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  display: 'inline-block',
                  marginLeft: '2px',
                  marginRight: '2px',
                }}
              >
                CTRL+K
              </kbd>{' '}
              for Windows to pull up different widgets.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold flex-shrink-0">2.</span>
            <span>Select "Add Text Widget"</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold flex-shrink-0">3.</span>
            <span>Select the widget</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold flex-shrink-0">4.</span>
            <span>Click "/" to access the text tool bar or highlight a piece of text</span>
          </li>
        </ol>
      </div>
    </motion.div>
  );
}
