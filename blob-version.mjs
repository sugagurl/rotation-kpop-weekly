// Private delivery GETs can expose a weak ETag after response compression. Writes
// require the strong object version from metadata. Tie the body to that version
// before using it for a conditional write; reject a race instead of losing data.
export function privateJsonReader({get,head,available=true}){
 return async (path,{versioned=false}={})=>{
  if(!available)return null;
  const result=await get(path,{access:'private',useCache:false});
  if(!result||result.statusCode!==200)return null;
  const value=JSON.parse(await new Response(result.stream).text());
  if(!versioned)return {value,etag:result.blob.etag};
  const metadata=await head(path),bodyTag=result.blob.etag?.replace(/^W\//,'');
  if(!bodyTag||!metadata.etag||bodyTag!==metadata.etag)throw Error('Precondition failed');
  return {value,etag:metadata.etag};
 };
}
