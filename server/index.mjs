import { server, providerKind } from './app.mjs';

const PORT = Number(process.env.PORT || 8787);
server.listen(PORT, () => {
  console.log(JSON.stringify({ event: 'server_listening', port: PORT, provider: providerKind }));
});
