import { toast } from 'sonner';
import { FILE_CONFIG } from '../constants/config';

/**
 * Valida un archivo con límite de tamaño dinámico
 * @param {File} file - Archivo a validar
 * @param {number} maxSizeBytes - Tamaño máximo en bytes (opcional, por defecto 5MB)
 */
export const validateFile = (file, maxSizeBytes = FILE_CONFIG.MAX_SIZE) => {
  if (!file) return { valid: false, error: 'No file selected' };
  
  if (file.size > maxSizeBytes) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    const maxMB = (maxSizeBytes / 1024 / 1024).toFixed(0);
    return {
      valid: false,
      error: `Muy pesado (${sizeMB} MB). Máximo ${maxMB}MB según tu plan.`
    };
  }

  return { valid: true };
};

export const validateUpload = (file, selectedReward) => {
  if (!file || !selectedReward) {
    toast.warning('Falta seleccionar canje y archivo.');
    return false;
  }
  return true;
};

export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  toast.success('Link copiado');
};
