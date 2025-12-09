import { Guest, RequestStatus, ScanResult } from '../types';

/**
 * Helper per effettuare chiamate API standardizzate verso Cloudflare Functions.
 * Gestisce automaticamente la conversione in JSON e gli errori di rete.
 */
const apiCall = async <T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    // La chiamata va a /api/nome_endpoint (che corrisponde a functions/api/nome_endpoint.ts)
    const response = await fetch(`/api/${endpoint}`, config);

    if (!response.ok) {
      // Tenta di leggere il messaggio di errore dal backend, se presente
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Errore API: ${response.status} ${response.statusText}`);
    }

    // Se la risposta è vuota (es. 204 No Content), ritorna null
    if (response.status === 204) return null as T;

    return await response.json();
  } catch (error) {
    console.error(`Errore nella chiamata a ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Ottiene la lista di tutti gli ospiti dal database MySQL.
 */
export const getGuests = async (): Promise<Guest[]> => {
  // Chiama functions/api/guests.ts
  return await apiCall<Guest[]>('guests');
};

/**
 * Crea una nuova richiesta di partecipazione.
 * Salva i dati nel DB con stato 'PENDING'.
 */
export const createRequest = async (guestData: Omit<Guest, 'id' | 'status' | 'isUsed' | 'createdAt'>): Promise<void> => {
  // Chiama functions/api/register.ts
  await apiCall('register', 'POST', guestData);
};

/**
 * Approva un ospite.
 * Il backend aggiornerà lo stato nel DB e invierà l'email con il QR Code.
 */
export const approveRequest = async (id: string): Promise<Guest | null> => {
  // Chiama functions/api/approve.ts
  const response = await apiCall<{ success: boolean, guest: Guest }>('approve', 'POST', { id });
  return response.guest;
};

/**
 * Rifiuta un ospite.
 * Aggiorna solo lo stato nel DB.
 */
export const rejectRequest = async (id: string): Promise<void> => {
  // Chiama functions/api/reject.ts
  await apiCall('reject', 'POST', { id });
};

/**
 * Scansiona un QR Code (all'ingresso).
 * Verifica validità, approvazione e se è già stato usato.
 */
export const scanQRCode = async (qrContent: string): Promise<ScanResult> => {
  try {
    // Chiama functions/api/scan.ts
    // Invia l'ID contenuto nel QR code al backend per la verifica
    const result = await apiCall<ScanResult>('scan', 'POST', { qrContent });
    return result;
  } catch (error) {
    // Gestione errori di rete o server offline durante la scansione
    return {
      valid: false,
      message: 'ERRORE DI RETE',
      type: 'error'
    };
  }
};

/**
 * Reset completo del database (SOLO PER ADMIN/DEV).
 * Cancella tutti gli ospiti.
 */
export const resetData = async (): Promise<void> => {
  // Chiama functions/api/reset.ts
  await apiCall('reset', 'POST');
};
