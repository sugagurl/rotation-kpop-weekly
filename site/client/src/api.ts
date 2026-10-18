import {isCurrent} from '../../status.mjs';
export const api={async getRotationWeekArchive(_args:unknown){
 const response=await fetch('/api/archive',{cache:'no-store'});
 if(!response.ok)throw Error('Archive unavailable');
 const packet=await response.json();
 return {weeks:packet.weeks,refresh_status:isCurrent(packet)?'current':'pending'};
}};
