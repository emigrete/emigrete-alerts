import { toast } from 'sonner';
import { FILE_CONFIG } from '../constants/config';

export const validateFile = (file) => {
  if (!file) return { valid: false, error: 'No file selected' };
  
  if (file.size > FILE_CONFIG.MAX_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `Muy pesado (${sizeMB} MB). Máximo 5MB.`
    };
  }

  return { valid: true };
};

export const validateUpload = (file, selectedReward) => {
  if (!file || !selectedReward) {
    toast.warning('Falta elegir recompensa y video.');
    return false;
  }
  return true;
};

export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  toast.success('Link copiado');
};
