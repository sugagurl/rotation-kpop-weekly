import {build} from 'esbuild';
await build({entryPoints:['site/chart.tsx'],bundle:true,minify:true,jsx:'automatic',outdir:'public/assets',entryNames:'chart',assetNames:'[name]-[hash]',metafile:false});
