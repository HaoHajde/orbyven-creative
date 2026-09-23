/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner and VM need CommonJS mocks. */
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const root=process.cwd();
function compile(path){const result=ts.transpileModule(fs.readFileSync(root+"/"+path,"utf8"),{fileName:path,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});assert.equal((result.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);return result.outputText;}
const draftModule={exports:{}};
vm.runInNewContext(compile("lib/ai/site-editor.ts"),{module:draftModule,exports:draftModule.exports});
const {DEFAULT_SITE,SITE_PRESETS,readableText,readSiteDraft,applySitePatch}=draftModule.exports;
const org="11111111-1111-4111-8111-111111111111";
function route(opts={}){
  const calls=[];const exports={};const routeModule={exports};
  const env={ORBYVEN_AI_EDITOR_ENABLED:"true",ORBYVEN_AI_PROVIDER:"openai",OPENAI_API_KEY:"test-placeholder",ORBYVEN_AI_ALLOWED_ORGANIZATION_IDS:org,...opts.env};
  vm.runInNewContext(compile("app/api/ai/site-editor/route.ts"),{
    exports,module:routeModule,process:{env},Number,JSON,Array,Request,Error,
    require(name){
      if(name==="next/server")return{NextResponse:{json:(v,init={})=>({status:init.status||200,json:async()=>v})}};
      if(name==="@/lib/billing/supabase-server")return{authenticateBillingActor:async(...args)=>{calls.push(["auth",...args]);if(opts.deny)throw Error("ORG_ACCESS_REQUIRED");return{organizationId:org,userId:"33333333-3333-4333-8333-333333333333",role:"owner"};}};
      if(name==="@/lib/ai/site-editor")return{readSiteDraft};
      if(name==="@/lib/ai/provider-selection")return{
        editorAiProvider:()=>["openai","cloudflare"].includes(env.ORBYVEN_AI_PROVIDER)?env.ORBYVEN_AI_PROVIDER:"local",
        cloudflareAiReady:()=>Boolean(env.CLOUDFLARE_AI_API_TOKEN)
      };
      if(name==="@/lib/ai/cloudflare-server")return{suggestCloudflareEdit:async(...args)=>{
        calls.push(["cloudflare",...args]);
        if(opts.failCloudflare)throw Error(opts.failCloudflare);
        return{draft:applySitePatch(args[0],{headline:"Titlu liber"}),message:"Qwen",usage:{inputTokens:40,outputTokens:15}};
      }};
      if(name==="@/lib/ai/openai-server")return{suggestSiteEdit:async(...args)=>{calls.push(["ai",...args]);if(opts.failAi)throw Error(opts.failAi===true?"AI_UNAVAILABLE":opts.failAi);return{draft:applySitePatch(args[0],{headline:"Titlu nou"}),message:"Gata.",usage:{inputTokens:100,outputTokens:20}};}};
      if(name==="@/lib/ai/quota-server")return{
        claimAiEditorQuota:async(...args)=>{calls.push(["claim",...args]);if(opts.quotaError)throw Error(opts.quotaError);return{requestId:"22222222-2222-4222-8222-222222222222",remainingToday:6};},
        finishAiEditorQuota:async(...args)=>{calls.push(["finish",...args]);}
      };
      throw Error(name);
    }
  });
  return{calls,post:(body)=>routeModule.exports.POST(new Request("https://example.invalid/api/ai/site-editor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}))};
}
const good={organizationId:org,prompt:"Schimbă titlul",draft:DEFAULT_SITE};
test("contract: rejects unknown colors",()=>{assert.equal(readSiteDraft(DEFAULT_SITE).brand,DEFAULT_SITE.brand);assert.equal(readSiteDraft({...DEFAULT_SITE,accent:"red"}),null);});
test("contract: invalid text and color never enter preview",()=>{const x=applySitePatch(DEFAULT_SITE,{headline:"x".repeat(500),background:"url(javascript:bad)",cta:"Salut"});assert.equal(x.headline,DEFAULT_SITE.headline);assert.equal(x.background,DEFAULT_SITE.background);assert.equal(x.cta,"Salut");});
test("default-disabled endpoint calls neither auth nor AI",async()=>{const a=route({env:{ORBYVEN_AI_EDITOR_ENABLED:"false"}});assert.equal((await a.post(good)).status,503);assert.equal(a.calls.length,0);});
test("invalid organization rejected before external call",async()=>{const a=route();assert.equal((await a.post({...good,organizationId:""})).status,400);assert.equal(a.calls.length,0);});
test("different/unauthorized tenant never invokes AI",async()=>{const a=route({deny:true});assert.equal((await a.post(good)).status,403);assert.equal(a.calls.filter(x=>x[0]==="ai").length,0);});
test("authorized owner/admin reaches model with scoped org",async()=>{const a=route();const res=await a.post(good);assert.equal(res.status,200);assert.equal((await res.json()).draft.headline,"Titlu nou");assert.equal(a.calls[0][2],org);assert.equal(a.calls[0][3],true);assert.equal(a.calls.filter(x=>x[0]==="ai").length,1);});
test("client and server editor files parse as TypeScript",()=>{for(const p of ["lib/ai/openai-server.ts","lib/ai/use-site-editor.ts","components/ai/SiteEditorChat.tsx","components/ai/SiteEditorPreview.tsx","app/workspace/site-editor/page.tsx","app/api/ai/site-editor/status/route.ts","lib/ai/provider-selection.ts","lib/ai/cloudflare-server.ts"])assert.ok(compile(p).length>0);});

test("production deployment remains disabled even if AI flag is true",async()=>{const a=route({env:{VERCEL_ENV:"production"}});assert.equal((await a.post(good)).status,503);assert.equal(a.calls.length,0);});
test("missing quota migration fails closed before spending tokens",async()=>{const a=route({quotaError:"AI_QUOTA_UNAVAILABLE"});assert.equal((await a.post(good)).status,503);assert.equal(a.calls.filter(x=>x[0]==="ai").length,0);});
test("8/day quota blocks model calls with 429",async()=>{const a=route({quotaError:"AI_QUOTA_DAY"});assert.equal((await a.post(good)).status,429);assert.equal(a.calls.filter(x=>x[0]==="ai").length,0);});
test("minute cap blocks model calls with 429",async()=>{const a=route({quotaError:"AI_QUOTA_MINUTE"});assert.equal((await a.post(good)).status,429);assert.equal(a.calls.filter(x=>x[0]==="ai").length,0);});
test("disabled or suspended tenant blocks before model call",async()=>{const a=route({quotaError:"AI_ACCESS_REVOKED"});assert.equal((await a.post(good)).status,403);assert.equal(a.calls.filter(x=>x[0]==="ai").length,0);});
test("successful request records provider token usage once",async()=>{const a=route();const res=await a.post(good);assert.equal((await res.json()).remainingToday,6);const finishes=a.calls.filter(x=>x[0]==="finish");assert.equal(finishes.length,1);assert.equal(finishes[0][2],true);assert.equal(finishes[0][3].inputTokens,100);});
test("failed model call consumes a reservation and is finalized failed",async()=>{const a=route({failAi:true});assert.equal((await a.post(good)).status,502);assert.equal(a.calls.filter(x=>x[0]==="finish")[0][2],false);});

test("unlisted pilot organization never reaches quota or model",async()=>{const a=route({env:{ORBYVEN_AI_ALLOWED_ORGANIZATION_IDS:""}});assert.equal((await a.post(good)).status,403);assert.equal(a.calls.filter(x=>x[0]==="claim"||x[0]==="ai").length,0);});

test("four site presets are valid drafts",()=>{
  assert.equal(Object.keys(SITE_PRESETS).length,4);
  for(const item of Object.values(SITE_PRESETS))assert.equal(readSiteDraft(item)?.brand,item.brand);
});
test("older Alpha browser drafts are migrated without discarding custom copy",()=>{
  const previous={...DEFAULT_SITE,headline:"Text personalizat"};
  delete previous.layout;delete previous.preset;
  const draft=readSiteDraft(previous);
  assert.equal(draft?.headline,"Text personalizat");
  assert.equal(draft?.layout,"split");
  assert.equal(draft?.preset,"studio");
});
test("AI can adjust layout but cannot switch business category",()=>{
  const result=applySitePatch(DEFAULT_SITE,{layout:"centered",preset:"detailing"});
  assert.equal(result.layout,"centered");
  assert.equal(result.preset,"studio");
});
test("AI color changes preserve readable foreground contrast",()=>{
  const result=applySitePatch(DEFAULT_SITE,{background:"#08090b"});
  assert.equal(result.textColor,readableText("#08090b"));
});
test("invalid manual draft cannot be sent to model",async()=>{
  const a=route();
  assert.equal((await a.post({...good,draft:{...DEFAULT_SITE,headline:""}})).status,400);
  assert.equal(a.calls.filter(x=>x[0]==="ai").length,0);
});

const localModule={exports:{}};
vm.runInNewContext(compile("lib/ai/local-preview-commands.ts"),{
  module:localModule,exports:localModule.exports,
  require(name){
    if(name==="@/lib/ai/site-editor")return{applySitePatch};
    throw Error(name);
  }
});
const {applyLocalPreviewCommand}=localModule.exports;
test("disabled AI supports transparent local black and gold style request",()=>{
  const result=applyLocalPreviewCommand(DEFAULT_SITE,"Fă site-ul negru cu accente aurii și layout editorial");
  assert.equal(result.draft.background,"#101113");
  assert.equal(result.draft.accent,"#d4af37");
  assert.equal(result.draft.layout,"editorial");
  assert.match(result.message,/fără AI/);
});
test("local command does not invent text for unsupported copywriting",()=>{
  assert.equal(applyLocalPreviewCommand(DEFAULT_SITE,"Scrie un text premium nou"),null);
});
test("local explicit title preserves user-supplied wording",()=>{
  assert.equal(applyLocalPreviewCommand(DEFAULT_SITE,"Titlu: Acasă la tine, mai confortabil").draft.headline,"Acasă la tine, mai confortabil");
});
test("disabled AI flag tolerates harmless surrounding whitespace",async()=>{
  const a=route({env:{ORBYVEN_AI_EDITOR_ENABLED:" true "}});
  assert.equal((await a.post(good)).status,200);
});

const providerModule={exports:{}};
vm.runInNewContext(compile("lib/ai/provider-errors.ts"),{
  module:providerModule,exports:providerModule.exports
});
const {classifyOpenAiError}=providerModule.exports;
test("provider 429 credit exhaustion is not mislabeled a temporary rate limit",async()=>{
  assert.equal(await classifyOpenAiError({
    status:429,json:async()=>({error:{type:"insufficient_quota",code:"credit_balance_exhausted"}})
  }),"OPENAI_CREDITS");
});
test("provider 429 project spend limit receives a billing diagnosis",async()=>{
  assert.equal(await classifyOpenAiError({
    status:429,json:async()=>({error:{code:"project_spend_limit_exceeded"}})
  }),"OPENAI_BILLING_LIMIT");
});
test("provider transient 429 remains a rate limit",async()=>{
  assert.equal(await classifyOpenAiError({
    status:429,json:async()=>({error:{code:"rate_limit_exceeded"}})
  }),"OPENAI_TEMP_LIMIT");
});
test("provider 401 is diagnosed as invalid API credential",async()=>{
  assert.equal(await classifyOpenAiError({
    status:401,json:async()=>({error:{code:"invalid_api_key"}})
  }),"OPENAI_BAD_KEY");
});
test("provider 429 with non JSON body stays safe and generic",async()=>{
  assert.equal(await classifyOpenAiError({
    status:429,json:async()=>{throw Error("upstream body hidden")}
  }),"OPENAI_TEMP_LIMIT");
});
test("billing issue is actionable and tagged without leaking raw provider payload",async()=>{
  const a=route({failAi:"OPENAI_CREDITS"});
  const res=await a.post(good);
  assert.equal(res.status,503);
  const body=await res.json();
  assert.equal(body.code,"OPENAI_CREDITS");
  assert.match(body.error,/Billing/);
  assert.equal(a.calls.filter(x=>x[0]==="finish")[0][2],false);
});
test("temporary upstream rate limit is distinct from billing issues",async()=>{
  const a=route({failAi:"OPENAI_TEMP_LIMIT"});
  const res=await a.post(good);
  assert.equal(res.status,429);
  assert.equal((await res.json()).code,"OPENAI_TEMP_LIMIT");
});


test("old saved drafts default to normal heading size",()=>{
  const old={...DEFAULT_SITE};delete old.headlineSize;
  assert.equal(readSiteDraft(old)?.headlineSize,"normal");
});
test("deterministic design supports large headings and keeps diacritics in explicit copy",()=>{
  const local=applyLocalPreviewCommand(DEFAULT_SITE,"Titlu: Acasă la tine, mai confortabil");
  assert.equal(local.draft.headline,"Acasă la tine, mai confortabil");
  assert.equal(applyLocalPreviewCommand(DEFAULT_SITE,"vreau scris mare").draft.headlineSize,"large");
});
test("free engine handles named accent and layout commands with no invented claims",()=>{
  const r=applyLocalPreviewCommand(DEFAULT_SITE,"Vreau o tematică gold/black cu scris mare și layout editorial");
  assert.equal(r.draft.background,"#101113");
  assert.equal(r.draft.accent,"#d4af37");
  assert.equal(r.draft.layout,"editorial");
  assert.equal(r.draft.headlineSize,"large");
  assert.equal(r.draft.headline,DEFAULT_SITE.headline);
});
test("free engine abstains on creative-only prompt and explicit negation",()=>{
  assert.equal(applyLocalPreviewCommand(DEFAULT_SITE,"Rescrie titlul mai premium"),null);
  assert.equal(applyLocalPreviewCommand(DEFAULT_SITE,"Nu vreau negru"),null);
});
test("partially supported requests explicitly disclose ungenerated creative copy",()=>{
  const result=applyLocalPreviewCommand(DEFAULT_SITE,"negru cu auriu și titlu mai premium");
  assert.match(result.message,/nu a fost generat/i);
  assert.equal(result.draft.headline,DEFAULT_SITE.headline);
});
test("default local provider does not contact OpenAI nor claim quota",async()=>{
  const r=route({env:{ORBYVEN_AI_PROVIDER:undefined}});
  const result=await r.post(good);
  assert.equal(result.status,503);
  assert.equal((await result.json()).code,"LOCAL_ONLY");
  assert.equal(r.calls.length,0);
});
test("explicit Cloudflare provider never falls through to OpenAI",async()=>{
  const r=route({env:{ORBYVEN_AI_PROVIDER:"cloudflare",CLOUDFLARE_AI_API_TOKEN:"cf-test"}});
  const res=await r.post(good);
  assert.equal(res.status,200);
  assert.equal((await res.json()).draft.headline,"Titlu liber");
  assert.equal(r.calls.filter(x=>x[0]==="cloudflare").length,1);
  assert.equal(r.calls.filter(x=>x[0]==="ai").length,0);
});
test("Cloudflare free quota rejects request without paid-provider fallback",async()=>{
  const r=route({env:{ORBYVEN_AI_PROVIDER:"cloudflare",CLOUDFLARE_AI_API_TOKEN:"cf-test"},failCloudflare:"CF_LIMIT"});
  const res=await r.post(good);
  assert.equal(res.status,429);
  assert.equal((await res.json()).code,"CF_LIMIT");
  assert.equal(r.calls.filter(x=>x[0]==="ai").length,0);
});
test("Cloudflare missing token fails closed before quota or fetch",async()=>{
  const r=route({env:{ORBYVEN_AI_PROVIDER:"cloudflare",CLOUDFLARE_AI_API_TOKEN:""}});
  const res=await r.post(good);
  assert.equal(res.status,503);
  assert.equal(r.calls.length,0);
});
