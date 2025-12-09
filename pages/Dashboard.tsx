import React, { useEffect, useState } from 'react';
import { getGuests, approveRequest, rejectRequest, resetData } from '../services/storage';
import { Guest, RequestStatus } from '../types';
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import QRCode from 'react-qr-code';
import { 
  Check, X, Search, RefreshCw, Trash2, Download, 
  User, Mail, Instagram, AlertTriangle 
} from 'lucide-react';

// --- Componenti di Supporto ---

// 1. Badge per lo stato
const Badge = ({ status, isUsed }: { status: RequestStatus, isUsed: boolean }) => {
  if (isUsed) return <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs border border-green-500/30 font-medium">ENTRATO</span>;
  
  switch(status) {
    case RequestStatus.APPROVED:
      return <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs border border-red-500/30 font-medium">APPROVATO</span>;
    case RequestStatus.REJECTED:
      return <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 text-xs border border-gray-500/30 font-medium">RIFIUTATO</span>;
    case RequestStatus.PENDING:
    default:
      return <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs border border-yellow-500/30 font-medium">IN ATTESA</span>;
  }
};

// 2. Card del singolo ospite
interface GuestCardProps {
  guest: Guest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const GuestCard: React.FC<GuestCardProps> = ({ guest, onApprove, onReject }) => {
  const isApproved = guest.status === RequestStatus.APPROVED;
  const isPending = guest.status === RequestStatus.PENDING;

  return (
    <GlassPanel className={`p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${guest.isUsed ? 'opacity-50' : ''}`}>
      {/* Dati Ospite */}
      <div className="flex flex-col w-full md:w-auto">
        <h3 className="text-xl font-bold">{guest.firstName} {guest.lastName}</h3>
        <div className="text-sm text-gray-400 mt-1 space-y-1">
          <p className="flex items-center gap-2"><Mail className="w-3 h-3" />{guest.email}</p>
          <p className="flex items-center gap-2"><Instagram className="w-3 h-3" />@{guest.instagram}</p>
        </div>
        <div className="mt-3">
             <Badge status={guest.status} isUsed={guest.isUsed} />
        </div>
      </div>

      {/* Azioni */}
      <div className="w-full md:w-64 flex flex-col items-center gap-3">
        {isPending && (
          <div className="flex gap-2 w-full animate-in fade-in zoom-in duration-300">
            <Button 
              onClick={() => onReject(guest.id)} 
              variant="secondary" 
              className="w-full text-xs"
            >
              <X className="w-4 h-4 mr-1" /> Rifiuta
            </Button>
            <Button 
              onClick={() => onApprove(guest.id)} 
              variant="primary" 
              className="w-full text-xs"
            >
              <Check className="w-4 h-4 mr-1" /> Approva
            </Button>
          </div>
        )}
        
        {isApproved && (
           <div className="w-full flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
             <div className="bg-white p-2 rounded-lg">
                <QRCode 
                  value={guest.qrCode || ''} 
                  size={100} 
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
             </div>
             <p className="text-xs text-green-400 flex items-center gap-1">
               <Check className="w-3 h-3" /> QR Inviato
             </p>
             {guest.isUsed && (
                <p className="text-xs text-gray-400 mt-2">
                    Entrato alle: {new Date(guest.usedAt!).toLocaleTimeString()}
                </p>
             )}
           </div>
        )}

        {guest.status === RequestStatus.REJECTED && (
             <p className="text-xs text-red-400 flex items-center gap-1 mt-2">
               <X className="w-3 h-3" /> Richiesta Rifiutata
             </p>
        )}
      </div>
    </GlassPanel>
  );
};


// --- Componente Principale Dashboard ---

const Dashboard: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filter, setFilter] = useState<'ALL' | RequestStatus>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // Caricamento dati da Supabase (ora è asincrono)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getGuests();
        // Supabase ordina già per 'createdAt' discendente (come impostato in storage.ts)
        setGuests(data); 
      } catch (error) {
        console.error("Errore caricamento dati", error);
        alert("Errore caricamento dati dal server. Controlla la console.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  const handleRefresh = () => setRefreshKey(p => p + 1);

  // Funzione di approvazione aggiornata
  const handleApprove = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler approvare e INVIARE L'EMAIL a questo ospite?")) {
        return;
    }
    
    // Blocca la UI temporaneamente sulla card in questione
    setGuests(prev => prev.map(g => g.id === id ? { ...g, status: RequestStatus.PENDING } : g));

    try {
        await approveRequest(id);
        alert("Ospite approvato ed email inviata con successo!");
        handleRefresh();
    } catch (e) {
        console.error(e);
        alert("Errore durante l'approvazione o l'invio dell'email. Riprova.");
        // Ritorna al vecchio stato in caso di errore
        handleRefresh(); 
    }
  };

  const handleReject = async (id: string) => {
    await rejectRequest(id);
    handleRefresh();
  };
  
  // Funzione di reset aggiornata (ora asincrona)
  const handleReset = async () => {
      if(window.confirm('ATTENZIONE: Verranno CANCELLATI TUTTI i dati presenti nel database (Supabase). Sei sicuro?')) {
          await resetData();
          handleRefresh();
      }
  }

  const filteredGuests = guests.filter(g => 
    filter === 'ALL' ? true : g.status === filter
  );

  const approvedCount = guests.filter(g => g.status === RequestStatus.APPROVED).length;
  const pendingCount = guests.filter(g => g.status === RequestStatus.PENDING).length;
  const usedCount = guests.filter(g => g.isUsed).length;

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(guests, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ospiti_russoloco_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }


  return (
    <div className="min-h-screen w-full bg-black p-4 md:p-8 pt-16 pb-32">
      <h1 className="text-3xl font-extrabold text-red-500 mb-6">Pannello Admin</h1>
      
      {/* Statistiche */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <GlassPanel className="p-4 text-center">
          <p className="text-3xl font-bold text-white">{guests.length}</p>
          <p className="text-sm text-gray-400 mt-1">Totale Richieste</p>
        </GlassPanel>
        <GlassPanel className="p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{approvedCount}</p>
          <p className="text-sm text-gray-400 mt-1">Approvati</p>
        </GlassPanel>
        <GlassPanel className="p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">{pendingCount}</p>
          <p className="text-sm text-gray-400 mt-1">In Attesa</p>
        </GlassPanel>
        <GlassPanel className="p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{usedCount}</p>
          <p className="text-sm text-gray-400 mt-1">Entrati</p>
        </GlassPanel>
      </div>
      
      {/* Controlli e Filtri */}
      <GlassPanel className="p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Button 
            variant={filter === 'ALL' ? 'primary' : 'secondary'}
            onClick={() => setFilter('ALL')}
            className="whitespace-nowrap"
          >
            Tutti
          </Button>
          <Button 
            variant={filter === RequestStatus.PENDING ? 'primary' : 'secondary'}
            onClick={() => setFilter(RequestStatus.PENDING)}
            className="whitespace-nowrap"
          >
            In Attesa
          </Button>
          <Button 
            variant={filter === RequestStatus.APPROVED ? 'primary' : 'secondary'}
            onClick={() => setFilter(RequestStatus.APPROVED)}
            className="whitespace-nowrap"
          >
            Approvati
          </Button>
          <Button 
            variant={filter === RequestStatus.REJECTED ? 'primary' : 'secondary'}
            onClick={() => setFilter(RequestStatus.REJECTED)}
            className="whitespace-nowrap"
          >
            Rifiutati
          </Button>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={exportData} variant="secondary" className="w-full md:w-auto">
                <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button onClick={handleRefresh} variant="secondary" className="w-full md:w-auto">
                <RefreshCw className="w-4 h-4 mr-1" />
            </Button>
             <Button onClick={handleReset} variant="secondary" className="bg-red-900/40 hover:bg-red-800/40 border-red-500/30 w-full md:w-auto">
                <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
        </div>
      </GlassPanel>

      {/* Stato di Caricamento */}
      {loading && (
        <div className="text-center p-12 text-gray-400">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin text-red-500" />
          <p className="mt-4">Caricamento dati dal database...</p>
        </div>
      )}

      {/* Lista Ospiti */}
      {!loading && (
        <div className="space-y-4">
          {filteredGuests.map(guest => (
            <GuestCard 
              key={guest.id} 
              guest={guest} 
              onApprove={handleApprove} 
              onReject={handleReject} 
            />
          ))}

          {filteredGuests.length === 0 && (
            <div className="text-center p-12 text-gray-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-yellow-500" />
              Nessun ospite trovato per questo filtro.
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Dashboard;
