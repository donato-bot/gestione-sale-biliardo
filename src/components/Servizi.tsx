// Esempio logica per recuperare i sospesi
const [debiti, setDebiti] = useState<any[]>([]);

async function fetchDebiti() {
  const { data } = await supabase
    .from('debiti_clienti')
    .select('*')
    .eq('stato', 'aperto')
    .eq('sala_id', currentSalaId);
  if (data) setDebiti(data);
}