#!/usr/bin/env node
// Node 20+ script to run quick smoke checks against Supabase Edge functions
// Usage: node ./scripts/smoke-runner.js --ref=<project-ref> [--base=https://<ref>.functions.supabase.co]

const args = Object.fromEntries(process.argv.slice(2).map(s=>s.split('=').map(x=>x.trim())))
const ref = (args['--ref'] || args['ref'] || process.env.SUPABASE_REF)
if(!ref){ console.error('Missing --ref or SUPABASE_REF'); process.exit(2) }
const base = args['--base'] || `https://${ref}.functions.supabase.co`
const TIMEOUT = 10_000

async function fetchWithTimeout(url, opts){
  const controller = new AbortController()
  const id = setTimeout(()=>controller.abort(), TIMEOUT)
  try{
    return await fetch(url, {...opts, signal: controller.signal})
  }finally{ clearTimeout(id) }
}

async function run(){
  console.log('Base:', base)
  try{
    let r = await fetchWithTimeout(base + '/health')
    console.log('health', r.status, await r.text())
  }catch(e){ console.error('health error', String(e)) }

  try{
    let r = await fetchWithTimeout(base + '/validate_quote', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({hours:2, hourly:400, vehicle:0, armed:false})})
    console.log('validate_quote', r.status, await r.text())
  }catch(e){ console.error('validate_quote error', String(e)) }

  process.exit(0)
}

run()
