import { logger } from '@/lib/logger';
import { Component } from 'react';
import { toast } from 'sonner';

/**
 * Error boundary to catch and display optimistic update failures
 * Ensures rollback errors are visible to users
 */
export default class OptimisticUpdateErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Show toast for optimistic update failures
    if (error.message?.includes('Optimistic')) {
      toast.error('Operation failed. Changes have been reverted.');
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    logger.error('Optimistic update error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Toast handles user feedback
    }
    return this.props.children;
  }
}