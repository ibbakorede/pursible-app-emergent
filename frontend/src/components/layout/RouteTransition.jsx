import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const routeVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

const TRANSITION_CONFIG = { duration: 0.3 };

export default function RouteTransition({ children }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      variants={routeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={TRANSITION_CONFIG}
    >
      {children}
    </motion.div>
  );
}