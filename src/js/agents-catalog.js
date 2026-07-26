/** Catalogue agents Valorant (UUID → nom) pour select admin. CDN media.valorant-api.com */
export const AGENT_OPTIONS = [
  { id: '8e253930-4c05-31dd-1b6c-968525494517', name: 'Omen' },
  { id: '41fb69c1-4189-7b37-f117-bcaf1e96f1bf', name: 'Astra' },
  { id: 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc', name: 'Reyna' },
  { id: '320b2a48-4d9b-a075-30f1-1f93a9b638fa', name: 'Sova' },
  { id: '6f2a04ca-43e0-be17-7f36-b3908627744d', name: 'Skye' },
  { id: 'add6443a-41bd-e414-f6ad-e58d267f4e95', name: 'Jett' },
  { id: 'bb2a4828-46eb-8cd1-e765-15848195d751', name: 'Neon' },
  { id: '22697a3d-45bf-8dd7-4fec-84a9e28c69d7', name: 'Chamber' },
  { id: 'dade69b4-4f5a-8528-247b-219e5a1facd6', name: 'Fade' },
  { id: '1e58de9c-4950-5125-93e9-a0aee9f98746', name: 'Killjoy' },
  { id: 'f94c3b30-42be-e959-409b-418109446768', name: 'Raze' },
  { id: '569fdd95-4d10-43ab-ca70-79becc718b46', name: 'Sage' },
  { id: '117ed9e3-49f3-6512-3ccf-0cada7e3823b', name: 'Cypher' },
  { id: '5f8d3a7f-467b-97f3-062c-13acf203c006', name: 'Breach' },
  { id: '707eab51-4836-f488-046a-cda6bf494704', name: 'Viper' },
  { id: 'eb933a95-4611-a879-4ffc-b77d1f33f6a8', name: 'Phoenix' },
  { id: '9f0d8ba9-4140-b941-57d3-a7ad57c6b417', name: 'Brimstone' },
  { id: '1dbf2edd-4729-0984-3115-daec1f5f3e51', name: 'Clove' },
  { id: '0e38b510-41a8-5780-5e8f-568b2a4f2d6c', name: 'Iso' },
  { id: 'e370fa57-4757-3604-3648-499e1f642d3f', name: 'Gekko' },
  { id: 'cc8b4451-41b7-4a4d-b620-4e8af4f9b1c0', name: 'Deadlock' },
  { id: '7f94c453-41bf-5a7f-bddf-d6b05e0c0b9a', name: 'Yoru' },
  { id: '601dbbe7-43ce-be57-2a40-b8211c0b0b7e', name: 'KAY/O' },
  { id: '95b78ed7-4637-86d9-7e41-71ba6c6b5b1e', name: 'Harbor' },
].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

export function agentPortraitUrl(uuid) {
  if (!uuid) return '';
  return `https://media.valorant-api.com/agents/${uuid}/fullportrait.png`;
}

export function agentName(uuid) {
  return AGENT_OPTIONS.find((a) => a.id === uuid)?.name || '';
}
