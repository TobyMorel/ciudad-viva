import {spawn} from 'node:child_process';

export async function startUiTestServer(port){
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/`;
 for(let attempt=0;attempt<80;attempt++){
  if(server.exitCode!==null)throw new Error(`Servidor UI terminó antes de iniciar (código ${server.exitCode})`);
  try{const response=await fetch(url,{signal:AbortSignal.timeout(500)});if(response.ok)return server;}catch{}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 server.kill('SIGTERM');throw new Error(`Servidor UI no respondió en ${url} luego de 8 segundos`);
}
