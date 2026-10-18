export function latestSaturday(now=new Date()){
 const localDay=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const day=new Date(localDay+'T00:00:00Z');day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+1)%7);return day.toISOString().slice(0,10);
}
export function isCurrent(packet,now=new Date()){
 return packet.weeks?.at(-1)?.edition_date===latestSaturday(now)&&packet.latest_attempt?.status==='complete';
}
