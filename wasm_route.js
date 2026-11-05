const MAX_NODES=65_536,NODE_BYTES=44;
let cachedEngine=null,cachedLoad=null;
let loadWarningShown=false;

export async function loadWasmRoadRouter({bytes=null}={}){
  if(!bytes&&cachedEngine)return cachedEngine;
  if(!bytes&&cachedLoad)return cachedLoad;
  const load=async()=>{
    try{
      const source=bytes||await fetch(new URL('./wasm/route-engine.wasm',import.meta.url),{cache:'force-cache'}).then(response=>{
        if(!response.ok)throw Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      });
      const {instance}=await WebAssembly.instantiate(source,{}),exports=instance.exports;
      if(!exports.memory||!exports.cv_route_solve||exports.cv_route_node_size()!==NODE_BYTES)throw Error('ABI del motor de rutas incompatible');
      const engine={kind:'Rust/WebAssembly',maxNodes:Math.min(MAX_NODES,exports.cv_route_capacity()),solve(nodes){
        if(!Array.isArray(nodes)||nodes.length===0||nodes.length>this.maxNodes)return null;
        const input=exports.cv_route_nodes_ptr(),result=exports.cv_route_result_ptr(),view=new DataView(exports.memory.buffer);
        for(let i=0;i<nodes.length;i++){
          const node=nodes[i],offset=input+i*NODE_BYTES,neighbors=node.neighbors||[],weights=node.weights||[];
          view.setInt32(offset,node.x|0,true);view.setInt32(offset+4,node.y|0,true);
          for(let edge=0;edge<4;edge++){
            view.setInt32(offset+8+edge*4,Number.isInteger(neighbors[edge])?neighbors[edge]:-1,true);
            view.setFloat32(offset+24+edge*4,Number.isFinite(weights[edge])?weights[edge]:0,true);
          }
          view.setUint32(offset+40,(node.start?1:0)|(node.goal?2:0),true);
        }
        const length=exports.cv_route_solve(nodes.length);
        if(length===0)return [];
        if(length<0)return null;
        const output=new Int32Array(exports.memory.buffer,result,length);
        return Array.from(output);
      }};
      if(!bytes)cachedEngine=engine;
      return engine;
    }catch(error){
      if(!loadWarningShown){loadWarningShown=true;console.warn('Motor Rust/WASM de rutas no disponible; se usará el buscador JavaScript.',error)}
      return null;
    }
  };
  if(bytes)return load();
  cachedLoad=load();cachedEngine=await cachedLoad;return cachedEngine;
}

export function solveRouteGraphJavaScript(nodes){
  if(!nodes?.length)return null;
  const distance=Array(nodes.length).fill(Infinity),previous=Array(nodes.length).fill(-1),closed=new Uint8Array(nodes.length),queue=[];
  const less=(a,b)=>distance[a]<distance[b]-1e-9||Math.abs(distance[a]-distance[b])<=1e-9&&(nodes[a].x<nodes[b].x||nodes[a].x===nodes[b].x&&nodes[a].y<nodes[b].y);
  const push=value=>{let i=queue.length;queue.push(value);while(i){const p=(i-1)>>1;if(!less(value,queue[p]))break;queue[i]=queue[p];i=p}queue[i]=value};
  const pop=()=>{const first=queue[0],last=queue.pop();if(queue.length){let i=0;while(true){let c=i*2+1;if(c>=queue.length)break;if(c+1<queue.length&&less(queue[c+1],queue[c]))c++;if(!less(queue[c],last))break;queue[i]=queue[c];i=c}queue[i]=last}return first};
  nodes.forEach((node,index)=>{if(node.start){distance[index]=0;push(index)}});
  while(queue.length){const current=pop();if(closed[current])continue;closed[current]=1;if(nodes[current].goal){const path=[];for(let i=current;i>=0;i=previous[i])path.push(i);return path.reverse()}
    for(let edge=0;edge<4;edge++){const next=nodes[current].neighbors?.[edge],weight=nodes[current].weights?.[edge];if(!Number.isInteger(next)||next<0||next>=nodes.length||!Number.isFinite(weight)||weight<0)continue;const candidate=distance[current]+weight;if(candidate+1e-9<distance[next]){distance[next]=candidate;previous[next]=current;push(next)}}
  }
  return null;
}
