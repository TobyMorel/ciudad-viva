/** Describe which city screen the player is browsing without exposing raw UI state. */
export function cursorView({popup='',supply=false,traffic=false,menu=false,overMap=true,hidden=false}={}){
 if(hidden)return 'En otra pestaña';
 if(supply)return 'Pedidos de materiales';
 if(menu)return 'Menú de partida';
 if(popup)return String(popup).trim().slice(0,60);
 if(traffic)return 'Tráfico';
 return overMap?'':'Fuera del mapa 3D';
}

export function cursorStatusText(view){
 if(typeof view!=='string'||!view)return '';
 return ['En otra pestaña','Fuera del mapa 3D'].includes(view)?view:`Viendo Pantalla ${view}`;
}
