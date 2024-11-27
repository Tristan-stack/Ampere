import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type SidePanelProps = {
  isVisible: boolean;
  onClose: () => void;
};

const containerVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: '0%', opacity: 1 },
  exit: { x: '100%', opacity: 0 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const SidePanel: React.FC<SidePanelProps> = ({ isVisible, onClose }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex justify-end"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="bg-sidebar w-1/4 h-[97vh] my-auto p-4 mr-4 rounded-lg shadow-lg"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'tween', duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="mb-4">Close</button>
            {/* Contenu du conteneur */}
            <p>Your content goes here.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SidePanel;